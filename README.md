# QuantAlpha

QuantAlpha is a quantitative financial analytics and risk analysis platform built to demonstrate a realistic end-to-end data science workflow on public market data. The project combines historical equity prices from `yfinance`, macroeconomic indicators from FRED, feature engineering for time-series modeling, a transparent XGBoost classification pipeline, and a simple rules-based backtesting engine.

The goal is not to look like a startup dashboard. The goal is to show how a student can structure a practical financial analytics project that is readable, modular, and strong enough to discuss in interviews.

## Business Problem

Investors and analysts often need more than raw prices. They need a workflow that answers questions such as:

- How has a selected equity universe behaved over time?
- What does portfolio risk look like under different market conditions?
- Which technical and macro features are most informative for next-day trend prediction?
- Does a simple rules-based strategy outperform a passive benchmark after realistic signal lagging?

QuantAlpha turns those questions into a reproducible analysis pipeline instead of a purely visual stock dashboard.

## Analytical Scope

- Exploratory financial data analysis
- Portfolio analytics and risk diagnostics
- Technical indicator feature engineering
- Time-series-aware machine learning
- Strategy backtesting
- Macroeconomic context from FRED
- Investment decision support through interpretable metrics

## Datasets

### Market Data

- Source: `yfinance`
- Frequency: daily adjusted close prices
- Example universe: `AAPL`, `MSFT`, `NVDA`, `JPM`, `XOM`
- Benchmark: `^GSPC`

### Macroeconomic Data

- Source: FRED CSV endpoints
- Series included:
  - inflation proxy: `CPIAUCSL`
  - interest rates: `FEDFUNDS`
  - unemployment: `UNRATE`
  - 10Y treasury yield: `DGS10`
  - volatility index: `VIXCLS`

## Analytical Workflow

1. Fetch historical equity prices and benchmark data from `yfinance`.
2. Fetch macroeconomic indicators from FRED.
3. Cache downloaded data to reduce repeated API calls and improve reliability.
4. Forward-fill and align macro series to the trading calendar.
5. Engineer technical and return-based features for each ticker.
6. Build equal-weight portfolio baselines and risk metrics.
7. Train an XGBoost classifier using a chronological train/test split.
8. Run a simple signal-based backtest with one-day lagged execution.
9. Surface results in a minimal frontend designed for analysis rather than marketing.

## Feature Engineering

The backend generates a transparent feature set that is easy to explain in interviews:

- daily returns
- rolling means
- rolling standard deviation
- momentum over multiple windows
- annualized rolling volatility
- RSI
- MACD and MACD signal
- Bollinger Band position
- moving averages
- volume change
- benchmark return
- inflation
- interest rate
- unemployment
- treasury yield
- VIX

## Financial Analytics

The platform computes:

- cumulative return
- CAGR
- Sharpe ratio
- Sortino ratio
- beta
- alpha
- max drawdown
- annualized volatility
- rolling volatility
- Value at Risk (95%)
- Conditional Value at Risk (95%)
- correlation matrix

## Machine Learning Workflow

The machine learning module predicts next-day direction for the primary ticker in the selected universe.

Design choices:

- model: `XGBClassifier`
- target: next-day up/down move
- split: chronological 80/20 train/test split
- leakage control: features are built from information available at or before time `t`
- evaluation metrics:
  - accuracy
  - precision
  - recall
  - F1 score
  - confusion matrix
- interpretability:
  - feature importance
  - local contribution scores using XGBoost `pred_contribs`

## Backtesting Logic

The backtest is intentionally simple and interview-friendly.

- A long signal is generated when:
  - price is above the short moving average
  - MACD is above the MACD signal line
  - RSI is above 50
- Signals are lagged by one trading day to avoid look-ahead bias.
- Positions are equal-weighted across active signals.
- Performance is compared against the benchmark curve.

## Frontend Pages

- Market Overview
- Portfolio Analytics
- Risk Analysis
- ML Forecasting
- Backtesting Results
- Economic Indicators Dashboard

The frontend is intentionally restrained: a research console with tables and meaningful charts instead of a landing-page-style dashboard.

## Architecture

```text
QuantAlpha
├── backend
│   ├── app.py
│   ├── config.py
│   ├── requirements-analytics.txt
│   ├── services
│   │   ├── cache.py
│   │   ├── data_service.py
│   │   ├── feature_engineering.py
│   │   ├── analytics_service.py
│   │   ├── ml_service.py
│   │   ├── backtest_service.py
│   │   └── platform_service.py
│   └── models
├── frontend
│   └── src
├── notebooks
├── research
├── analysis
└── models
```

### Data Flow Diagram

```text
yfinance + FRED
       ↓
  Data fetching + caching
       ↓
Preprocessing and alignment
       ↓
Feature engineering
       ↓
├── Portfolio/risk analytics
├── XGBoost forecasting
└── Rules-based backtesting
       ↓
FastAPI snapshot endpoint
       ↓
React research interface
```

## Local Setup

### Backend

Use Python `3.11+`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-analytics.txt
uvicorn app:app --reload
```

Backend default URL:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## Main API Endpoint

- `GET /snapshot`

Query parameters:

- `tickers`
- `start_date`
- `end_date`

The endpoint returns the full analytics snapshot used by the frontend pages.

## 👥 Team

| Role | Name |
|---|---|
| Team Leader | Ajit Mahapatro |
| Team Member | G. Jyothi Charan |
| Team Member | M. Naveen |
| Team Member | A. Shanmukh |
| Team Member | P. Leela Venkatesh |
| Team Member | K. Kushwanth |
| Team Member | K. Harsha |

## Notebooks and Research Structure

- `notebooks/eda_market_structure.ipynb`
- `notebooks/feature_engineering_workbench.ipynb`
- `notebooks/ml_experiments.ipynb`
- `notebooks/backtesting_analysis.ipynb`
- `research/README.md`
- `analysis/README.md`

## Limitations

- `yfinance` and public FRED endpoints are free and convenient, but they are not institutional-grade data feeds.
- The current strategy is designed for interpretability, not production trading.
- Transaction costs, slippage, and sector constraints are not yet modeled.
- The ML pipeline uses one primary ticker at a time for direction prediction, which is helpful pedagogically but can be extended.

## Future Improvements

- Add walk-forward validation and probability calibration
- Add transaction costs and turnover penalties to the backtest
- Add portfolio optimization alternatives beyond equal weights
- Add richer macro regime labeling
- Add experiment tracking for repeated model runs
- Add volatility regime classification as a second ML task

