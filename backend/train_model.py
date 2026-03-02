# backend/train_model.py

import yfinance as yf
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from datetime import datetime

# =========================
# CONFIG
# =========================

TICKERS = [
    "AAPL","MSFT","NVDA",
    "JPM","GS",
    "JNJ","PFE",
    "PG","KO",
    "XOM"
]

BENCHMARK = "^GSPC"
START_DATE = "2014-01-01"
END_DATE = datetime.today().strftime("%Y-%m-%d")

FEATURE_COLUMNS = [
    "return_5","return_20","return_60",
    "volatility_20","volatility_60"
]

# =========================
# DATA DOWNLOAD
# =========================

print("Downloading data...")

data = yf.download(TICKERS, start=START_DATE, end=END_DATE, auto_adjust=True)
sp500 = yf.download(BENCHMARK, start=START_DATE, end=END_DATE, auto_adjust=True)

close = data["Close"].stack().reset_index()
close.columns = ["Date", "Ticker", "Close"]

sp500["sp_return"] = sp500["Close"].pct_change()
sp = sp500["sp_return"].reset_index()

df = close.merge(sp, on="Date", how="left")

# =========================
# FEATURE ENGINEERING
# =========================

df = df.sort_values(["Ticker", "Date"])

df["return_5"] = df.groupby("Ticker")["Close"].pct_change(5)
df["return_20"] = df.groupby("Ticker")["Close"].pct_change(20)
df["return_60"] = df.groupby("Ticker")["Close"].pct_change(60)

df["log_return"] = np.log(df["Close"] / df["Close"].shift(1))
df["volatility_20"] = df.groupby("Ticker")["log_return"].rolling(20).std().reset_index(level=0, drop=True)
df["volatility_60"] = df.groupby("Ticker")["log_return"].rolling(60).std().reset_index(level=0, drop=True)

# =========================
# TARGETS (MULTI-HORIZON)
# =========================

df["target_1d"] = df.groupby("Ticker")["log_return"].shift(-1)
df["target_5d"] = df.groupby("Ticker")["log_return"].shift(-5)
df["target_20d"] = df.groupby("Ticker")["log_return"].shift(-20)

df = df.dropna()

# =========================
# TRAIN MODELS
# =========================

X = df[FEATURE_COLUMNS]

def train_model(target_column, filename):

    print(f"Training model for {target_column}...")

    y = df[target_column]

    model = XGBRegressor(
        n_estimators=600,
        max_depth=5,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, f"models/{filename}")
    print(f"Saved {filename}")

# Ensure models folder exists
import os
os.makedirs("models", exist_ok=True)

train_model("target_1d", "alpha_1d.pkl")
train_model("target_5d", "alpha_5d.pkl")
train_model("target_20d", "alpha_20d.pkl")

print("Training complete.")