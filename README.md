# QuantAlpha

QuantAlpha is a quantitative financial analytics and risk analysis platform built to demonstrate a realistic end-to-end data science workflow on public market data.

The project combines:
- historical equity prices from `yfinance`
- macroeconomic indicators from FRED
- feature engineering for financial time series
- XGBoost-based forecasting experiments
- portfolio and risk analytics
- interpretable machine learning
- strategy backtesting
- interactive frontend visualization

The goal of the project is not to simulate a trading platform or startup dashboard. Instead, it focuses on demonstrating practical data science workflows, financial analytics concepts, and time-series modeling techniques in an interview-friendly and educational manner.

---

# Business Problem

Financial markets are noisy and difficult to predict consistently. Investors and analysts require workflows that go beyond simple price visualization.

QuantAlpha explores questions such as:

- How do selected equities behave under changing market conditions?
- What portfolio risk characteristics emerge across different assets?
- Can technical and macroeconomic indicators provide useful directional signals?
- How can leakage-aware machine learning workflows be applied to financial time series?
- How do simple rule-based strategies compare against benchmark performance?

The platform converts these ideas into a reproducible analytical workflow instead of a purely visual stock dashboard.

---

# Core Features

## Exploratory Financial Data Analysis
- historical market analysis
- cumulative returns
- rolling volatility
- return distributions
- correlation analysis

## Portfolio & Risk Analytics
- Sharpe Ratio
- Sortino Ratio
- Beta
- Alpha
- Maximum Drawdown
- Annualized Volatility
- Value at Risk (VaR)
- Conditional Value at Risk (CVaR)

## Machine Learning Forecasting
- XGBoost forecasting experiments
- chronological train/test split
- leakage-aware feature engineering
- feature importance analysis
- directional forecasting workflow

## Feature Engineering
Technical indicators include:
- RSI
- MACD
- Bollinger Bands
- moving averages
- momentum indicators
- rolling standard deviation
- volatility metrics
- benchmark returns

## Macroeconomic Integration
FRED indicators:
- inflation
- federal funds rate
- unemployment rate
- treasury yields
- VIX

## Backtesting Engine
- signal generation
- lagged execution logic
- benchmark comparison
- strategy performance tracking

---

# Datasets & APIs

## Market Data
Source:
- `yfinance`

Example equities:
- AAPL
- MSFT
- NVDA
- JPM
- XOM

Benchmark:
- S&P 500 (`^GSPC`)

## Macroeconomic Data
Source:
- FRED API

Indicators:
- CPIAUCSL
- FEDFUNDS
- UNRATE
- DGS10
- VIXCLS

---

# Machine Learning Workflow

The forecasting workflow is intentionally designed to remain:
- interpretable
- leakage-aware
- educational
- realistic

## Model
- XGBoost Classifier (`XGBClassifier`)

## Objective
Explore whether technical and macroeconomic features provide useful short-term directional signals.

## Workflow
- chronological train/test split
- feature engineering using historical information only
- leakage prevention
- classification metrics evaluation

## Evaluation Metrics
- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

## Interpretability
- feature importance
- contribution analysis

---

# Backtesting Logic

The backtesting module evaluates simple rule-based trading signals.

Signals are generated using:
- moving averages
- MACD crossover
- RSI thresholds

To avoid look-ahead bias:
- signals are lagged by one trading day before execution

Strategy performance is compared against benchmark cumulative returns.

---

# Project Structure

```text
QuantAlpha
├── backend
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── services
│   │   ├── cache.py
│   │   ├── data_service.py
│   │   ├── feature_engineering.py
│   │   ├── analytics_service.py
│   │   ├── ml_service.py
│   │   ├── backtest_service.py
│   │   └── platform_service.py
│   └── models
│
├── frontend
│   └── src
│
├── notebooks
│   ├── eda_market_structure.ipynb
│   ├── feature_engineering_workbench.ipynb
│   ├── ml_experiments.ipynb
│   └── backtesting_analysis.ipynb
│
├── research
├── analysis
└── README.md