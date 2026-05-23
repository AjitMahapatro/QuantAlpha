# 📈 QuantAlpha – Financial Analytics & Market Intelligence Platform

<<<<<<< HEAD
QuantAlpha is a machine learning-based financial analytics platform designed to analyze stock market trends, portfolio performance, and investment insights through an interactive dashboard experience.

The project combines financial data analysis, portfolio analytics, backtesting, and predictive modeling into a unified analytics platform using a React frontend and FastAPI backend.

Developed as a collaborative team project during the Machine Learning with Python Internship at Adhoc Network Tech Company.

---

# 👥 Team

## Team Leader
- Ajit Mahapatro

## Team Members
=======
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

## Notebooks and Research Structure

- `notebooks/eda_market_structure.ipynb`
- `notebooks/feature_engineering_workbench.ipynb`
- `notebooks/ml_experiments.ipynb`
- `notebooks/backtesting_analysis.ipynb`
- `research/README.md`
- `analysis/README.md`

## Screenshots

Add screenshots from the frontend to `analysis/screenshots/` and reference them here for portfolio submissions. Recommended captures:

- Market Overview page
- Risk Analysis page
- ML Forecasting page
- Backtesting Results page

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

## 👥 Team

### Team Leader
- Ajit Mahapatro

### Team Members
>>>>>>> 23d6d56 (Update the whole project)
- G. Jyothi Charan
- M. Naveen
- A. Shanmukh
- P. Leela Venkatesh
- K. Kushwanth
- K. Harsha

<<<<<<< HEAD
---

# 📌 Project Overview

QuantAlpha was developed to provide an interactive environment for:
- stock market analytics
- portfolio monitoring
- backtesting
- market trend analysis
- research signal visualization

The platform integrates financial data processing with analytics dashboards to help users explore stock performance and portfolio behavior.

---

# 🚀 Key Features

## Portfolio Analytics
- Portfolio performance tracking
- Expected return analysis
- Volatility monitoring
- Sharpe ratio visualization
- Portfolio allocation insights

---

## Backtesting System
- Portfolio vs benchmark comparison
- Historical performance analysis
- Trend visualization
- Multi-period analytics

---

## Research Signal Dashboard
- Multi-horizon research signals
- Market trend monitoring
- Best-pick stock insights
- Stock snapshot analytics

---

## Interactive Dashboard
- Dynamic chart visualizations
- Market pulse overview
- User-controlled ticker selection
- Configurable date ranges

---

## Data Reliability Handling
The platform includes safeguards for handling free-market data limitations such as:
- API rate limits
- unstable responses
- large query restrictions
- deployment-related delays

---

# 🤖 Machine Learning

The backend includes predictive modeling workflows using:
- Scikit-Learn
- XGBoost

The project uses machine learning models for multi-horizon market analysis including:
- short-term trend analysis
- medium-term forecasting
- research signal generation

---

# 🛠️ Tech Stack

## Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- Plotly

## Backend
- FastAPI
- Python
- Pandas
- NumPy
- Scikit-Learn
- XGBoost
- Joblib

## Data Source
- yfinance API

---

# 📂 Project Structure

```text
QuantAlpha/
│
├── backend/
│   ├── app.py
│   ├── train_model.py
│   ├── services/
│   ├── schemas/
│   └── models/
│
├── frontend/
│   ├── src/
│   └── public/
│
└── README.md
```

---

# 📊 Dashboard Modules

- Portfolio Overview
- Market Pulse Dashboard
- Backtesting Analytics
- Research Signal Panel
- Risk & Return Analysis
- Stock Snapshot Viewer

---

# ⚙️ Workflow

```text
Market Data Collection
        ↓
Data Preprocessing
        ↓
Feature Engineering
        ↓
Machine Learning Analysis
        ↓
Portfolio Analytics
        ↓
Dashboard Visualization
```

---

# 💻 Local Setup

## Clone Repository

```bash
git clone <repo-url>
cd QuantAlpha
```

---

## Backend Setup

```bash
cd backend

python -m venv .venv

pip install -r requirements.txt

uvicorn app:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# 🌐 Deployment

## Frontend
- Vercel

## Backend
- Render

---

# ⚠️ Known Limitations

- Free-market APIs may occasionally experience instability
- Large date ranges may increase response time
- Cloud-hosted free deployments may be slower than local execution

This project is intended for educational and analytics purposes only.

---

# 📈 Future Improvements

- Advanced portfolio optimization
- Real-time streaming market data
- Interactive analytics dashboards
- Enhanced predictive modeling
- Better deployment scalability

---


# 🎯 Learning Outcomes

This project helped strengthen practical skills in:
- financial analytics
- machine learning workflows
- data preprocessing
- portfolio analysis
- dashboard visualization
- frontend-backend integration
- collaborative product development

---

# 👤 Author

Ajit Mahapatro  
B.Sc. Data Science – Aditya Degree College
=======
## Contributions

Ajit Mahapatro primarily contributed to:
- financial data analysis workflows
- exploratory data analysis (EDA)
- feature engineering
- machine learning pipeline development
- XGBoost forecasting workflow
- risk analytics implementation
- backend analytical logic
- model evaluation and interpretation

Additional contributions from team members included support in frontend integration, testing, project coordination, and documentation.

## Why This Project Works For Interviews

This repository demonstrates:

- EDA on financial time series
- domain-specific feature engineering
- risk and portfolio analytics
- time-series-aware model evaluation
- interpretable machine learning
- API integration with unstable public data sources
- a practical backtesting loop
- clean communication between backend analytics and frontend visualization
>>>>>>> 23d6d56 (Update the whole project)
