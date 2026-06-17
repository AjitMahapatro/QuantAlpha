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

# Load environment variables from the .env file in the parent directory.
env_path = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(dotenv_path=env_path)
FRED_API_KEY = os.getenv("FRED_API_KEY")
print("FRED KEY:", FRED_API_KEY)

# Mapping of our internal macro variable names to their FRED series IDs.
FRED_SERIES = {
    "inflation": "CPIAUCSL",
    "interest_rate": "FEDFUNDS",
    "unemployment": "UNRATE",
    "treasury_yield_10y": "DGS10",
    "vix": "VIXCLS",
}


def _retry_get(url: str, timeout: int = 10, attempts: int = 3) -> requests.Response:
    """A simple wrapper around requests.get to handle transient network errors."""
    last_error: Exception | None = None

    for attempt in range(attempts):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            return response

        except Exception as exc:
            last_error = exc
            # Exponential backoff to wait longer between retries
            time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"Request failed for {url}") from last_error


def fetch_price_data(tickers: list[str], start: str, end: str) -> pd.DataFrame:
    """
    Fetches historical adjusted close prices for a list of tickers from yfinance.
    Results are cached to avoid redundant API calls.
    """
    cache_key = f"{','.join(tickers)}|{start}|{end}"

    # First, try to load from the cache to reduce API calls.
    cached = load_cached("prices", cache_key, ttl_seconds=6 * 60 * 60)  # 6-hour TTL

    if cached is not None:
        return cached

    all_data = {}

    # yfinance can be flaky, so we loop through tickers and add a retry mechanism.
    for ticker in tickers:
        success = False

        for attempt in range(3):
            try:
                print(f"Fetching {ticker}...")

                data = yf.download(
                    ticker,
                    start=start,
                    end=end,
                    auto_adjust=True,  # Automatically adjust for splits and dividends
                    progress=False,
                    threads=False,  # Set to False to avoid potential conflicts in a server environment
                )

                if not data.empty:
                    close = data["Close"].copy()

                    # Handle cases where yfinance might return a DataFrame instead of a Series
                    if isinstance(close, pd.DataFrame):
                        close = close.iloc[:, 0]

                    close.name = ticker
                    all_data[ticker] = close

                    success = True
                    break  # Exit retry loop on success

                time.sleep(1)  # Small delay if data is empty

            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {ticker}: {e}")
                time.sleep(2)

        if not success:
            print(f"Skipping {ticker} after multiple failed attempts.")

    if not all_data:
        raise RuntimeError("No market data returned from yfinance")

    close = pd.DataFrame(all_data)

    close.index = pd.to_datetime(close.index)
    # Sort by date and forward-fill missing values to create a clean time series.
    close = close.sort_index().ffill().dropna(how="all")

    # Store the successfully fetched data in the cache for next time.
    store_cached("prices", cache_key, close)

    return close


def fetch_volume_data(ticker: str, start: str, end: str) -> pd.Series:
    """Fetches historical volume data for a single ticker."""
    cache_key = f"{ticker}|{start}|{end}"

    cached = load_cached("volume", cache_key, ttl_seconds=6 * 60 * 60)

    if cached is not None:
        return cached

    try:
        data = yf.download(
            ticker,
            start=start,
            end=end,
            auto_adjust=False,  # We need the raw volume, so don't auto-adjust
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
        # Return an empty series on failure so the pipeline can continue.
        return pd.Series(dtype=float)


def fetch_benchmark_data(start: str, end: str) -> pd.Series:
    """A convenience wrapper to fetch price data for the designated benchmark."""
    frame = fetch_price_data([BENCHMARK], start, end)

    series = frame.iloc[:, 0]
    series.name = BENCHMARK

    return series


def fetch_macro_data(start: str, end: str) -> pd.DataFrame:
    """
    Fetches multiple economic time series from the FRED API.
    The resulting DataFrame is aligned to a business-day calendar.
    """
    cache_key = f"{start}|{end}"

    # Macro data changes infrequently, so we can use a longer TTL.
    cached = load_cached("macro", cache_key, ttl_seconds=24 * 60 * 60)  # 24-hour TTL

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

            # Basic validation of the FRED response structure.
            if "date" not in frame.columns or "value" not in frame.columns:
                print(f"Invalid FRED response for {fred_id}")
                continue

            frame["date"] = pd.to_datetime(frame["date"], errors="coerce")

            # FRED uses '.' for missing values, which needs to be handled.
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

    # Align the sparse macro data to a regular business day frequency.
    date_index = pd.date_range(start=start, end=end, freq="B")

    # Reindex and then fill missing values forward, then backward for any gaps at the start.
    macro = macro.reindex(date_index).ffill().bfill()

    # Special handling for inflation: convert level to year-over-year percentage change.
    if "inflation" in macro.columns:
        # Look back 12 months * 21 business days/month to get the year-ago value.
        inflation_base = macro["inflation"].shift(12 * 21)

        macro["inflation"] = (
            (macro["inflation"] / inflation_base) - 1
        )

        # Fill any NaNs that might have been created by the transformation.
        macro["inflation"] = macro["inflation"].ffill().bfill()

    store_cached("macro", cache_key, macro)

    return macro


def normalize_inputs(
    tickers: list[str] | None,
    start_date: str | None,
    end_date: str | None,
) -> tuple[list[str], str, str]:
    """
    Cleans and provides default values for the main API query parameters.
    This ensures the application can run even with no user input.
    """

    # Sanitize the ticker list from the user input.
    parsed_tickers = [
        ticker.strip().upper()
        for ticker in (tickers or [])
        if ticker.strip()
    ]

    # If no tickers are provided, fall back to the default config.
    if not parsed_tickers:
        from config import TICKERS, START_DATE, END_DATE

        return (
            TICKERS,
            start_date or START_DATE,
            end_date or END_DATE,
        )

    # Otherwise, use the parsed tickers with default date ranges if needed.
    return (
        parsed_tickers,
        start_date or "2018-01-01",
        end_date or datetime.today().strftime("%Y-%m-%d"),
    )