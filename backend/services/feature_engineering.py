# backend/services/feature_engineering.py

import numpy as np

def create_features(df):

    df = df.sort_values(["Ticker", "Date"])

    df["return_5"] = df.groupby("Ticker")["Close"].pct_change(5)
    df["return_20"] = df.groupby("Ticker")["Close"].pct_change(20)
    df["return_60"] = df.groupby("Ticker")["Close"].pct_change(60)

    df["log_return"] = np.log(df["Close"] / df["Close"].shift(1))
    df["volatility_20"] = df.groupby("Ticker")["log_return"].rolling(20).std().reset_index(level=0, drop=True)
    df["volatility_60"] = df.groupby("Ticker")["log_return"].rolling(60).std().reset_index(level=0, drop=True)

    return df