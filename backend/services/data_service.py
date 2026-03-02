# backend/services/data_service.py

import yfinance as yf
import pandas as pd
import requests
from io import StringIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import TICKERS, BENCHMARK, START_DATE, END_DATE

def fetch_market_data():

    def _stooq_symbol(sym: str) -> str:
        sym = sym.strip().lower()
        if sym == "^gspc":
            return "spx"
        if sym.startswith("^"):
            sym = sym[1:]
        if "." not in sym:
            sym = f"{sym}.us"
        return sym

    def _fetch_stooq(symbol: str) -> pd.DataFrame:
        url = f"https://stooq.com/q/d/l/?s={_stooq_symbol(symbol)}&i=d"
        try:
            resp = requests.get(url, timeout=4)
            resp.raise_for_status()
            df = pd.read_csv(StringIO(resp.text))
        except Exception:
            return pd.DataFrame()
        return df

    def _stooq_close_series(symbol: str) -> pd.Series:
        df = _fetch_stooq(symbol)
        if df.empty or "Date" not in df.columns or "Close" not in df.columns:
            return pd.Series(dtype=float)

        df = df[["Date", "Close"]].copy()
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
        df = df.dropna(subset=["Date", "Close"]).sort_values("Date")

        try:
            s = pd.to_datetime(START_DATE)
            e = pd.to_datetime(END_DATE)
            df = df.loc[(df["Date"] >= s) & (df["Date"] <= e)]
        except Exception:
            pass

        if df.empty:
            return pd.Series(dtype=float)
        return df.set_index("Date")["Close"].sort_index()

    # Prefer Stooq first to avoid yfinance hangs/blocks.
    rows = []
    with ThreadPoolExecutor(max_workers=min(8, max(1, len(TICKERS)))) as ex:
        futures = {ex.submit(_stooq_close_series, t): t for t in TICKERS}
        for fut in as_completed(futures):
            t = futures[fut]
            try:
                s = fut.result()
            except Exception:
                s = pd.Series(dtype=float)
            if s.empty:
                continue
            df = s.reset_index()
            df.columns = ["Date", "Close"]
            df["Ticker"] = t
            rows.append(df[["Date", "Ticker", "Close"]])

    close = pd.concat(rows, ignore_index=True) if rows else pd.DataFrame(columns=["Date", "Ticker", "Close"])

    bench_s = _stooq_close_series(BENCHMARK)
    if not bench_s.empty:
        bdf = bench_s.reset_index()
        bdf.columns = ["Date", "Close"]
        bdf["sp_return"] = bdf["Close"].pct_change()
        sp = bdf[["Date", "sp_return"]].copy()
    else:
        sp = pd.DataFrame(columns=["Date", "sp_return"])

    if not close.empty and pd.to_numeric(close["Close"], errors="coerce").dropna().shape[0] >= 200:
        return close, sp

    try:
        data = yf.download(TICKERS, start=START_DATE, end=END_DATE, auto_adjust=True, progress=False)
    except Exception:
        data = pd.DataFrame()

    try:
        sp500 = yf.download(BENCHMARK, start=START_DATE, end=END_DATE, auto_adjust=True, progress=False)
    except Exception:
        sp500 = pd.DataFrame()

    if data is None or getattr(data, "empty", True):
        close = pd.DataFrame(columns=["Date", "Ticker", "Close"])
    else:
        if isinstance(data.columns, pd.MultiIndex) and "Close" in data.columns.get_level_values(0):
            close = data["Close"].stack().reset_index()
            close.columns = ["Date", "Ticker", "Close"]

        elif "Close" in data.columns:
            close = data[["Close"]].reset_index()
            close["Ticker"] = TICKERS[0] if len(TICKERS) else ""
            close = close[["Date", "Ticker", "Close"]]
        else:
            close = pd.DataFrame(columns=["Date", "Ticker", "Close"])

    # If Yahoo is blocked, it can return frames full of NaNs. If so, fill from Stooq.
    if close.empty or pd.to_numeric(close.get("Close", pd.Series(dtype=float)), errors="coerce").dropna().empty:
        rows = []
        for t in TICKERS:
            s = _stooq_close_series(t)
            if s.empty:
                continue
            df = s.reset_index()
            df.columns = ["Date", "Close"]
            df["Ticker"] = t
            rows.append(df[["Date", "Ticker", "Close"]])
        close = pd.concat(rows, ignore_index=True) if rows else pd.DataFrame(columns=["Date", "Ticker", "Close"])

    if sp500 is None or getattr(sp500, "empty", True) or "Close" not in sp500.columns:
        sp500 = pd.DataFrame()

    if sp500.empty:
        s = _stooq_close_series(BENCHMARK)
        if s.empty:
            sp = pd.DataFrame(columns=["Date", "sp_return"])
        else:
            df = s.reset_index()
            df.columns = ["Date", "Close"]
            df["sp_return"] = df["Close"].pct_change()
            sp = df[["Date", "sp_return"]].copy()
    else:
        sp500 = sp500.copy()
        sp500["sp_return"] = sp500["Close"].pct_change()
        sp = sp500[["sp_return"]].reset_index()

    return close, sp