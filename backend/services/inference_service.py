import math
from functools import lru_cache
from pathlib import Path

import joblib

try:
    from backend.config import FEATURE_COLUMNS
    from backend.services.data_service import fetch_market_data
    from backend.services.feature_engineering import create_features
except ModuleNotFoundError:
    from config import FEATURE_COLUMNS
    from services.data_service import fetch_market_data
    from services.feature_engineering import create_features

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


@lru_cache(maxsize=1)
def _load_models():
    model_1d = joblib.load(MODELS_DIR / "alpha_1d.pkl")
    model_5d = joblib.load(MODELS_DIR / "alpha_5d.pkl")
    model_20d = joblib.load(MODELS_DIR / "alpha_20d.pkl")
    return model_1d, model_5d, model_20d


def predict_ticker(ticker: str):
    ticker = ticker.strip().upper()
    close, _ = fetch_market_data()
    if close is None or getattr(close, "empty", True):
        return None
    df = create_features(close)
    df = df.dropna()

    latest_date = df["Date"].max()
    latest = df[(df["Date"] == latest_date) & (df["Ticker"] == ticker)].copy()
    if latest.empty:
        return None

    X = latest[FEATURE_COLUMNS]
    model_1d, model_5d, model_20d = _load_models()

    pred_1d = float(model_1d.predict(X)[0])
    pred_5d = float(model_5d.predict(X)[0])
    pred_20d = float(model_20d.predict(X)[0])

    vol20 = float(latest["volatility_20"].iloc[0]) if "volatility_20" in latest.columns else 0.0
    confidence = abs(pred_1d) / (abs(vol20) + 1e-6)

    def to_pct(log_ret: float):
        return (math.exp(log_ret) - 1.0) * 100.0

    return {
        "ticker": ticker,
        "as_of": str(latest_date.date()) if hasattr(latest_date, "date") else str(latest_date),
        "pred_1d_log": pred_1d,
        "pred_5d_log": pred_5d,
        "pred_20d_log": pred_20d,
        "pred_1d_pct": round(to_pct(pred_1d), 3),
        "pred_5d_pct": round(to_pct(pred_5d), 3),
        "pred_20d_pct": round(to_pct(pred_20d), 3),
        "confidence": round(float(confidence), 3),
    }
