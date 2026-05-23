from __future__ import annotations

from datetime import datetime
import os
import time

import pandas as pd
import requests
import yfinance as yf
from dotenv import load_dotenv
from pathlib import Path

from backend.config import BENCHMARK
from backend.services.cache import load_cached, store_cached

env_path = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(dotenv_path=env_path)
FRED_API_KEY = os.getenv("FRED_API_KEY")
print("FRED KEY:", FRED_API_KEY)

FRED_SERIES = {
    "inflation": "CPIAUCSL",
    "interest_rate": "FEDFUNDS",
    "unemployment": "UNRATE",
    "treasury_yield_10y": "DGS10",
    "vix": "VIXCLS",
}


def _retry_get(url: str, timeout: int = 10, attempts: int = 3) -> requests.Response:
    last_error: Exception | None = None

    for attempt in range(attempts):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            return response

        except Exception as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"Request failed for {url}") from last_error


def fetch_price_data(tickers: list[str], start: str, end: str) -> pd.DataFrame:
    cache_key = f"{','.join(tickers)}|{start}|{end}"

    cached = load_cached("prices", cache_key, ttl_seconds=6 * 60 * 60)

    if cached is not None:
        return cached

    all_data = {}

    for ticker in tickers:
        success = False

        for attempt in range(3):
            try:
                print(f"Fetching {ticker}...")

                data = yf.download(
                    ticker,
                    start=start,
                    end=end,
                    auto_adjust=True,
                    progress=False,
                    threads=False,
                )

                if not data.empty:
                    close = data["Close"].copy()

                    if isinstance(close, pd.DataFrame):
                        close = close.iloc[:, 0]

                    close.name = ticker
                    all_data[ticker] = close

                    success = True
                    break

                time.sleep(1)

            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {ticker}: {e}")
                time.sleep(2)

        if not success:
            print(f"Skipping {ticker}")

    if not all_data:
        raise RuntimeError("No market data returned from yfinance")

    close = pd.DataFrame(all_data)

    close.index = pd.to_datetime(close.index)
    close = close.sort_index().ffill().dropna(how="all")

    store_cached("prices", cache_key, close)

    return close


def fetch_volume_data(ticker: str, start: str, end: str) -> pd.Series:
    cache_key = f"{ticker}|{start}|{end}"

    cached = load_cached("volume", cache_key, ttl_seconds=6 * 60 * 60)

    if cached is not None:
        return cached

    try:
        data = yf.download(
            ticker,
            start=start,
            end=end,
            auto_adjust=False,
            progress=False,
            threads=False,
        )

        if data.empty:
            return pd.Series(dtype=float)

        volume = data["Volume"].copy()

        if isinstance(volume, pd.DataFrame):
            volume = volume.iloc[:, 0]

        volume.index = pd.to_datetime(volume.index)

        store_cached("volume", cache_key, volume)

        return volume

    except Exception as e:
        print(f"Volume fetch failed for {ticker}: {e}")
        return pd.Series(dtype=float)


def fetch_benchmark_data(start: str, end: str) -> pd.Series:
    frame = fetch_price_data([BENCHMARK], start, end)

    series = frame.iloc[:, 0]
    series.name = BENCHMARK

    return series


def fetch_macro_data(start: str, end: str) -> pd.DataFrame:
    cache_key = f"{start}|{end}"

    cached = load_cached("macro", cache_key, ttl_seconds=24 * 60 * 60)

    if cached is not None:
        return cached

    macro_series: dict[str, pd.Series] = {}

    for name, fred_id in FRED_SERIES.items():
        try:
            print(f"Fetching macro series: {fred_id}")

            url = (
                f"https://api.stlouisfed.org/fred/series/observations"
                f"?series_id={fred_id}"
                f"&api_key={FRED_API_KEY}"
                f"&file_type=json"
            )

            response = _retry_get(url, timeout=10, attempts=3)

            data = response.json()

            observations = data.get("observations", [])

            if not observations:
                print(f"No observations returned for {fred_id}")
                continue

            frame = pd.DataFrame(observations)

            if "date" not in frame.columns or "value" not in frame.columns:
                print(f"Invalid FRED response for {fred_id}")
                continue

            frame["date"] = pd.to_datetime(frame["date"], errors="coerce")

            frame["value"] = pd.to_numeric(
                frame["value"].replace(".", pd.NA),
                errors="coerce",
            )

            series = frame.set_index("date")["value"].sort_index()

            macro_series[name] = series

        except Exception as e:
            print(f"Failed macro series {fred_id}: {e}")

    if not macro_series:
        raise RuntimeError("No macroeconomic data could be fetched")

    macro = pd.DataFrame(macro_series).sort_index()

    date_index = pd.date_range(start=start, end=end, freq="B")

    macro = macro.reindex(date_index).ffill().bfill()

    if "inflation" in macro.columns:
        inflation_base = macro["inflation"].shift(12 * 21)

        macro["inflation"] = (
            (macro["inflation"] / inflation_base) - 1
        )

        macro["inflation"] = macro["inflation"].ffill().bfill()

    store_cached("macro", cache_key, macro)

    return macro


def normalize_inputs(
    tickers: list[str] | None,
    start_date: str | None,
    end_date: str | None,
) -> tuple[list[str], str, str]:

    parsed_tickers = [
        ticker.strip().upper()
        for ticker in (tickers or [])
        if ticker.strip()
    ]

    if not parsed_tickers:
        from config import TICKERS, START_DATE, END_DATE

        return (
            TICKERS,
            start_date or START_DATE,
            end_date or END_DATE,
        )

    return (
        parsed_tickers,
        start_date or "2018-01-01",
        end_date or datetime.today().strftime("%Y-%m-%d"),
    )