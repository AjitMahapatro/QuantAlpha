from __future__ import annotations

import numpy as np
import pandas as pd


def _compute_rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.rolling(window=window, min_periods=window).mean()
    avg_loss = loss.rolling(window=window, min_periods=window).mean()
    rs = avg_gain / avg_loss.replace(0.0, np.nan)
    return 100 - (100 / (1 + rs))


def create_ticker_feature_frame(
    ticker: str,
    price_series: pd.Series,
    benchmark_returns: pd.Series,
    macro_frame: pd.DataFrame,
    volume_series: pd.Series | None = None,
) -> pd.DataFrame:
    """
    Build an interview-friendly feature table for one ticker.

    The key choice here is to keep the features explicit and transparent so the
    user can explain them in a project walkthrough without relying on opaque
    feature factories.
    """

    frame = pd.DataFrame({"close": price_series.astype(float)}).sort_index()
    frame.index = pd.to_datetime(frame.index)

    if volume_series is not None and not volume_series.empty:
        frame["volume"] = volume_series.reindex(frame.index).astype(float)
    else:
        frame["volume"] = np.nan

    frame["daily_return"] = frame["close"].pct_change()
    frame["log_return"] = np.log(frame["close"] / frame["close"].shift(1))
    frame["rolling_mean_5"] = frame["close"].rolling(5).mean()
    frame["rolling_mean_20"] = frame["close"].rolling(20).mean()
    frame["rolling_std_20"] = frame["close"].rolling(20).std()
    frame["momentum_5"] = frame["close"] / frame["close"].shift(5) - 1
    frame["momentum_20"] = frame["close"] / frame["close"].shift(20) - 1
    frame["volatility_20"] = frame["daily_return"].rolling(20).std() * np.sqrt(252)
    frame["ma_10"] = frame["close"].rolling(10).mean()
    frame["ma_50"] = frame["close"].rolling(50).mean()
    frame["rsi_14"] = _compute_rsi(frame["close"], 14)

    ema_12 = frame["close"].ewm(span=12, adjust=False).mean()
    ema_26 = frame["close"].ewm(span=26, adjust=False).mean()
    frame["macd"] = ema_12 - ema_26
    frame["macd_signal"] = frame["macd"].ewm(span=9, adjust=False).mean()

    bollinger_mid = frame["close"].rolling(20).mean()
    bollinger_std = frame["close"].rolling(20).std()
    frame["bollinger_upper"] = bollinger_mid + (2 * bollinger_std)
    frame["bollinger_lower"] = bollinger_mid - (2 * bollinger_std)
    spread = (frame["bollinger_upper"] - frame["bollinger_lower"]).replace(0, np.nan)
    frame["bollinger_position"] = (frame["close"] - bollinger_mid) / spread

    frame["volume_change"] = frame["volume"].pct_change().replace([np.inf, -np.inf], np.nan)
    frame["benchmark_return"] = benchmark_returns.reindex(frame.index)

    aligned_macro = macro_frame.reindex(frame.index).ffill()
    for column in aligned_macro.columns:
        frame[column] = aligned_macro[column]

    frame["target_direction"] = (frame["close"].shift(-1) > frame["close"]).astype(int)
    frame["target_next_return"] = frame["daily_return"].shift(-1)
    frame["target_volatility_regime"] = (
        frame["daily_return"].rolling(20).std().shift(-1)
        > frame["daily_return"].rolling(60).std()
    ).astype(int)

    frame["ticker"] = ticker
    frame = frame.replace([np.inf, -np.inf], np.nan)
    frame = frame.ffill()
    return frame
