# backend/config.py

from datetime import datetime
import os

_DEFAULT_TICKERS = [
    "AAPL","MSFT","NVDA",
    "JPM","GS",
    "JNJ","PFE",
    "PG","KO",
    "XOM"
]

_tickers_env = os.getenv("TICKERS")
TICKERS = [t.strip().upper() for t in _tickers_env.split(",") if t.strip()] if _tickers_env else _DEFAULT_TICKERS

BENCHMARK = os.getenv("BENCHMARK", "^GSPC")
START_DATE = os.getenv("START_DATE", "2014-01-01")
END_DATE = os.getenv("END_DATE", datetime.today().strftime("%Y-%m-%d"))

FEATURE_COLUMNS = [
    "return_5","return_20","return_60",
    "volatility_20","volatility_60"
]