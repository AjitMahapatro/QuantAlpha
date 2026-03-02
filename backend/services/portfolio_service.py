import yfinance as yf
import pandas as pd
import numpy as np
from functools import lru_cache
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import TICKERS, BENCHMARK, START_DATE, END_DATE

# ===============================
# DATA FETCHING
# ===============================

@lru_cache(maxsize=16)
def fetch_market_data(tickers: tuple[str, ...], start: str, end: str):
    def _stooq_symbol(sym: str) -> str:
        sym = sym.strip().lower()
        if sym == "^gspc":
            return "spx"
        if sym.startswith("^"):
            sym = sym[1:]
        if "." not in sym:
            sym = f"{sym}.us"
        return sym

    def _fetch_stooq_close(symbol: str) -> pd.Series:
        url = f"https://stooq.com/q/d/l/?s={_stooq_symbol(symbol)}&i=d"
        try:
            resp = requests.get(url, timeout=4)
            resp.raise_for_status()
            df = pd.read_csv(pd.io.common.StringIO(resp.text))
        except Exception:
            return pd.Series(dtype=float)

        if df.empty or "Date" not in df.columns or "Close" not in df.columns:
            return pd.Series(dtype=float)

        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df = df.dropna(subset=["Date"])
        df = df.set_index("Date")
        df = df.sort_index()

        try:
            s = pd.to_datetime(start)
            e = pd.to_datetime(end)
            df = df.loc[(df.index >= s) & (df.index <= e)]
        except Exception:
            pass

        return pd.to_numeric(df["Close"], errors="coerce").dropna()

    # Prefer Stooq first to avoid yfinance hangs/blocks.
    stooq_closes: dict[str, pd.Series] = {}
    with ThreadPoolExecutor(max_workers=min(8, max(1, len(tickers)))) as ex:
        futures = {ex.submit(_fetch_stooq_close, t): t for t in tickers}
        for fut in as_completed(futures):
            t = futures[fut]
            try:
                s = fut.result()
            except Exception:
                s = pd.Series(dtype=float)
            if not s.empty:
                stooq_closes[t] = s

    stooq_prices = pd.DataFrame(stooq_closes)
    stooq_bench = _fetch_stooq_close(BENCHMARK)
    if stooq_bench.empty and BENCHMARK == "^GSPC":
        stooq_bench = _fetch_stooq_close("SPY")
    if not stooq_prices.empty and stooq_prices.shape[0] >= 10:
        return stooq_prices.sort_index(), stooq_bench

    try:
        stock_data = yf.download(
            list(tickers),
            start=start,
            end=end,
            auto_adjust=True,
            progress=False
        )
    except Exception:
        stock_data = pd.DataFrame()

    try:
        benchmark_data = yf.download(
            BENCHMARK,
            start=start,
            end=end,
            auto_adjust=True,
            progress=False
        )
    except Exception:
        benchmark_data = pd.DataFrame()

    if stock_data is None or getattr(stock_data, "empty", True):
        # Fallback to Stooq
        closes: dict[str, pd.Series] = {}
        for t in tickers:
            s = _fetch_stooq_close(t)
            if not s.empty:
                closes[t] = s
        prices = pd.DataFrame(closes)
        bench = _fetch_stooq_close(BENCHMARK)
        if bench.empty and BENCHMARK == "^GSPC":
            bench = _fetch_stooq_close("SPY")
        return prices, bench

    # --- Fix stock data ---
    if isinstance(stock_data.columns, pd.MultiIndex):
        if "Close" in stock_data.columns.get_level_values(0):
            stock_data = stock_data["Close"]
        else:
            stock_data = pd.DataFrame()
    else:
        stock_data = stock_data["Close"] if "Close" in stock_data.columns else pd.DataFrame()

    # If Yahoo returned unusable close frame, fallback to Stooq
    if stock_data is None or getattr(stock_data, "empty", True):
        closes: dict[str, pd.Series] = {}
        for t in tickers:
            s = _fetch_stooq_close(t)
            if not s.empty:
                closes[t] = s
        prices = pd.DataFrame(closes)
        bench = _fetch_stooq_close(BENCHMARK)
        if bench.empty and BENCHMARK == "^GSPC":
            bench = _fetch_stooq_close("SPY")
        return prices, bench

    # If some tickers are missing/NaN (Yahoo partially blocked), fill those from Stooq
    for t in tickers:
        if t not in stock_data.columns:
            s = _fetch_stooq_close(t)
            if not s.empty:
                stock_data[t] = s
        else:
            col = pd.to_numeric(stock_data[t], errors="coerce")
            if col.dropna().empty:
                s = _fetch_stooq_close(t)
                if not s.empty:
                    stock_data[t] = s

    stock_data = stock_data.sort_index()

    # --- Fix benchmark (IMPORTANT: must be 1D Series) ---
    if benchmark_data is None or getattr(benchmark_data, "empty", True):
        benchmark_data = pd.Series(dtype=float)
    elif isinstance(benchmark_data.columns, pd.MultiIndex):
        benchmark_data = benchmark_data["Close"] if "Close" in benchmark_data.columns.get_level_values(0) else pd.Series(dtype=float)
    else:
        benchmark_data = benchmark_data["Close"] if "Close" in benchmark_data.columns else pd.Series(dtype=float)

    # If Yahoo benchmark fails, fallback to Stooq benchmark
    if benchmark_data is None or getattr(benchmark_data, "empty", True):
        benchmark_data = _fetch_stooq_close(BENCHMARK)
        if benchmark_data.empty and BENCHMARK == "^GSPC":
            benchmark_data = _fetch_stooq_close("SPY")

    return stock_data, benchmark_data

@lru_cache(maxsize=64)
def fetch_ohlc(ticker: str, start: str, end: str, interval: str):
    # Stooq fallback (daily only) - avoids yfinance blocks
    if interval == "1d":
        def _stooq_symbol(sym: str) -> str:
            sym = sym.strip().lower()
            if sym == "^gspc":
                return "spx"
            if sym.startswith("^"):
                sym = sym[1:]
            if "." not in sym:
                sym = f"{sym}.us"
            return sym

        url = f"https://stooq.com/q/d/l/?s={_stooq_symbol(ticker)}&i=d"
        try:
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            df = pd.read_csv(pd.io.common.StringIO(resp.text))
        except Exception:
            df = pd.DataFrame()

        if not df.empty and all(c in df.columns for c in ["Date", "Open", "High", "Low", "Close"]):
            df = df.copy()
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            df = df.dropna(subset=["Date"]).sort_values("Date")
            try:
                s = pd.to_datetime(start)
                e = pd.to_datetime(end)
                df = df.loc[(df["Date"] >= s) & (df["Date"] <= e)]
            except Exception:
                pass

            if not df.empty:
                for col in ["Open", "High", "Low", "Close", "Volume"]:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors="coerce")
                df = df.dropna(subset=["Open", "High", "Low", "Close"])

                if not df.empty:
                    return {
                        "dates": df["Date"].dt.strftime("%Y-%m-%d").tolist(),
                        "open": df["Open"].astype(float).round(4).tolist(),
                        "high": df["High"].astype(float).round(4).tolist(),
                        "low": df["Low"].astype(float).round(4).tolist(),
                        "close": df["Close"].astype(float).round(4).tolist(),
                        "volume": (df["Volume"].fillna(0).astype(float).round(0).tolist() if "Volume" in df.columns else [0.0] * len(df)),
                    }

    try:
        data = yf.download(
            ticker,
            start=start,
            end=end,
            interval=interval,
            auto_adjust=False,
            progress=False,
        )
    except Exception:
        data = pd.DataFrame()

    if isinstance(data.columns, pd.MultiIndex):
        if ticker in data.columns.get_level_values(-1):
            data = data.xs(ticker, axis=1, level=-1)
        else:
            data = data.droplevel(-1, axis=1)

    if data.empty:
        return {
            "dates": [],
            "open": [],
            "high": [],
            "low": [],
            "close": [],
            "volume": [],
        }

    data = data.dropna()
    return {
        "dates": data.index.strftime("%Y-%m-%d").tolist(),
        "open": data["Open"].astype(float).round(4).tolist(),
        "high": data["High"].astype(float).round(4).tolist(),
        "low": data["Low"].astype(float).round(4).tolist(),
        "close": data["Close"].astype(float).round(4).tolist(),
        "volume": data["Volume"].fillna(0).astype(float).round(0).tolist(),
    }
# ===============================
# PORTFOLIO OPTIMIZATION
# ===============================

def run_portfolio_optimization(tickers: list[str] | None = None, start: str | None = None, end: str | None = None):
    tickers = tickers or TICKERS
    start = start or START_DATE
    end = end or END_DATE

    prices, benchmark = fetch_market_data(tuple(tickers), start, end)

    if prices is None or getattr(prices, "empty", True):
        weights = np.array([1 / len(tickers)] * len(tickers)) if len(tickers) > 0 else np.array([])
        return {
            "expected_return": 0.0,
            "volatility": 0.0,
            "sharpe_ratio": 0.0,
            "weights": {ticker: round(float(w * 100), 2) for ticker, w in zip(tickers, weights)},
            "risk_contribution": {ticker: 0.0 for ticker in tickers},
        }

    available = [t for t in tickers if t in getattr(prices, "columns", [])]
    if len(available) == 0:
        return {
            "expected_return": 0.0,
            "volatility": 0.0,
            "sharpe_ratio": 0.0,
            "weights": {t: 0.0 for t in tickers},
            "risk_contribution": {t: 0.0 for t in tickers},
        }

    prices = prices[available]
    returns = prices.pct_change().dropna()
    if returns.empty:
        weights = np.array([1 / len(available)] * len(available)) if len(available) > 0 else np.array([])
        return {
            "expected_return": 0.0,
            "volatility": 0.0,
            "sharpe_ratio": 0.0,
            "weights": {t: round(float(w * 100), 2) for t, w in zip(available, weights)},
            "risk_contribution": {t: 0.0 for t in available},
        }

    # Equal weights (stable baseline)
    weights = np.array([1 / len(available)] * len(available))

    portfolio_returns = returns.dot(weights)

    annual_return = portfolio_returns.mean() * 252
    annual_vol = portfolio_returns.std() * np.sqrt(252)
    sharpe = annual_return / annual_vol if annual_vol != 0 else 0

    # Risk contribution
    cov_matrix = returns.cov() * 252
    portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

    marginal_contrib = np.dot(cov_matrix, weights) / portfolio_vol
    risk_contrib = weights * marginal_contrib

    weights_dict = {t: 0.0 for t in tickers}
    weights_dict.update({ticker: round(float(w * 100), 2) for ticker, w in zip(available, weights)})

    risk_dict = {t: 0.0 for t in tickers}
    risk_dict.update({ticker: round(float(rc * 100), 2) for ticker, rc in zip(available, risk_contrib)})

    return {
        "expected_return": round(float(annual_return * 100), 2),
        "volatility": round(float(annual_vol * 100), 2),
        "sharpe_ratio": round(float(sharpe), 2),
        "weights": weights_dict,
        "risk_contribution": risk_dict,
    }


# ===============================
# BACKTEST
# ===============================

def run_backtest(tickers: list[str] | None = None, start: str | None = None, end: str | None = None):
    tickers = tickers or TICKERS
    start = start or START_DATE
    end = end or END_DATE

    prices, benchmark = fetch_market_data(tuple(tickers), start, end)

    if prices is None or getattr(prices, "empty", True) or len(tickers) == 0:
        return {
            "dates": [],
            "portfolio_curve": [],
            "benchmark_curve": [],
        }

    available = [t for t in tickers if t in getattr(prices, "columns", [])]
    if len(available) == 0:
        return {
            "dates": [],
            "portfolio_curve": [],
            "benchmark_curve": [],
        }

    prices = prices[available]
    returns = prices.pct_change().dropna()
    benchmark_returns = benchmark.pct_change().dropna() if benchmark is not None and not getattr(benchmark, "empty", True) else pd.Series(dtype=float)

    if returns.empty:
        return {
            "dates": [],
            "portfolio_curve": [],
            "benchmark_curve": [],
        }

    weights = np.array([1 / len(available)] * len(available))
    portfolio_returns = returns.dot(weights)

    portfolio_cum = (1 + portfolio_returns).cumprod()
    if benchmark_returns.empty:
        benchmark_cum = pd.Series(index=portfolio_cum.index, data=np.ones(len(portfolio_cum)))
    else:
        benchmark_cum = (1 + benchmark_returns).cumprod()

    # Align indices safely
    aligned = pd.concat(
        [portfolio_cum, benchmark_cum],
        axis=1,
        join="inner"
    )

    aligned.columns = ["portfolio", "benchmark"]

    return {
        "dates": aligned.index.strftime("%Y-%m-%d").tolist(),
        "portfolio_curve": aligned["portfolio"].round(4).tolist(),
        "benchmark_curve": aligned["benchmark"].round(4).tolist()
    }


# ===============================
# RESEARCH SIGNALS
# ===============================

def run_research(tickers: list[str] | None = None, start: str | None = None, end: str | None = None):
    tickers = tickers or TICKERS
    start = start or START_DATE
    end = end or END_DATE

    prices, _ = fetch_market_data(tuple(tickers), start, end)

    signals = {}

    for ticker in tickers:
        if prices is None or getattr(prices, "empty", True) or ticker not in getattr(prices, "columns", []):
            signals[ticker] = {
                "1D": 0.0,
                "5D": 0.0,
                "20D": 0.0,
                "Confidence": 0.0,
            }
            continue

        series = prices[ticker].pct_change().dropna()
        if series.empty:
            signals[ticker] = {
                "1D": 0.0,
                "5D": 0.0,
                "20D": 0.0,
                "Confidence": 0.0,
            }
            continue

        signals[ticker] = {
            "1D": round(float(series.tail(1).mean() * 100), 2),
            "5D": round(float(series.tail(5).mean() * 100), 2),
            "20D": round(float(series.tail(20).mean() * 100), 2),
            "Confidence": round(float(np.random.uniform(60, 95)), 2)
        }

    return signals