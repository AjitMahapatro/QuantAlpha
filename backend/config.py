from __future__ import annotations

from datetime import datetime
import os
from pathlib import Path
import tempfile

DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "JPM", "XOM"]
DEFAULT_BENCHMARK = "^GSPC"
DEFAULT_START_DATE = "2018-01-01"
DEFAULT_END_DATE = datetime.today().strftime("%Y-%m-%d")

TICKERS = [
    ticker.strip().upper()
    for ticker in os.getenv("TICKERS", ",".join(DEFAULT_TICKERS)).split(",")
    if ticker.strip()
]
BENCHMARK = os.getenv("BENCHMARK", DEFAULT_BENCHMARK)
START_DATE = os.getenv("START_DATE", DEFAULT_START_DATE)
END_DATE = os.getenv("END_DATE", DEFAULT_END_DATE)
RISK_FREE_RATE = float(os.getenv("RISK_FREE_RATE", "0.02"))

MODELS_DIR = Path(__file__).resolve().parent / "models"
ANALYSIS_DIR = Path(__file__).resolve().parent.parent / "analysis"


def _ensure_directory(preferred: Path, fallback_name: str) -> Path:
    try:
        preferred.mkdir(parents=True, exist_ok=True)
        return preferred
    except PermissionError:
        fallback = Path(tempfile.gettempdir()) / "quantalpha" / fallback_name
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


MODELS_DIR = _ensure_directory(MODELS_DIR, "models")
CACHE_DIR = _ensure_directory(Path(__file__).resolve().parent / "cache", "cache")
ANALYSIS_DIR = _ensure_directory(ANALYSIS_DIR, "analysis")

FEATURE_COLUMNS = [
    "daily_return",
    "rolling_mean_5",
    "rolling_mean_20",
    "rolling_std_20",
    "momentum_5",
    "momentum_20",
    "volatility_20",
    "rsi_14",
    "macd",
    "macd_signal",
    "bollinger_position",
    "volume_change",
    "benchmark_return",
    "inflation",
    "interest_rate",
    "unemployment",
    "treasury_yield_10y",
    "vix",
]
