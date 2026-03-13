# QuantAlpha

QuantAlpha is an AI-powered stock market analytics dashboard built with a React frontend and a FastAPI backend. It uses `yfinance` as the primary market data source, computes portfolio and backtest analytics, and surfaces research signals with a simple decision-support UI.

This project was built as a college submission and is designed to demonstrate:

- stock data collection with `yfinance`
- portfolio optimization and backtesting
- multi-horizon research signals
- a modern analytics dashboard for interactive exploration

## Features

- Portfolio overview with:
  - expected return
  - volatility
  - Sharpe ratio
- Portfolio backtest chart against benchmark
- Research signals for multiple tickers
- Best pick selection from the selected universe
- Market pulse summary
- Settings page for:
  - ticker universe
  - date range
  - refresh interval
- Heavy-query guardrails for free market data usage
- Deployment-ready frontend/backend split

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Plotly
  - Axios
- Backend:
  - FastAPI
  - Uvicorn
  - Pandas
  - NumPy
  - scikit-learn
  - XGBoost
  - joblib
  - yfinance

## Project Structure

```text
QuantAlpha/
  backend/
    app.py
    config.py
    train_model.py
    requirements.txt
    services/
    schemas/
    models/
  frontend/
    src/
    public/
    package.json
  runtime.txt
```

## Data Source

This project uses `yfinance` as the primary market data source. In deployed environments, long date ranges with many tickers can be less reliable than local runs because free data sources are slower and more rate-limited.

For that reason, the UI includes practical limits and warnings for heavy combinations such as:

- too many companies with too many years
- large date ranges on free-hosted deployments

## Machine Learning

The backend includes a training pipeline in `backend/train_model.py` that trains XGBoost regressors for:

- 1-day horizon
- 5-day horizon
- 20-day horizon

Feature columns used:

- `return_5`
- `return_20`
- `return_60`
- `volatility_20`
- `volatility_60`

Trained models are saved in `backend/models/`.

## Local Setup

### Backend

Use Python `3.11`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend runs by default on:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs by default on:

```text
http://localhost:5173
```

## Environment Configuration

The frontend reads the backend URL from:

```text
VITE_API_BASE_URL
```

If not provided, it falls back to:

```text
http://localhost:8000
```

## API Endpoints

Main backend routes from `backend/app.py`:

- `GET /`
- `GET /health`
- `GET /portfolio`
- `GET /backtest`
- `GET /research`
- `GET /snapshot`
- `GET /predict`
- `GET /ohlc`

## Deployment

### Frontend

Recommended deployment: Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:

```text
VITE_API_BASE_URL=https://<your-backend-url>
```

### Backend

Recommended deployment: Render

- Build command:

```bash
pip install -r backend/requirements.txt
```

- Start command:

```bash
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

## Known Limitations

- `yfinance` is convenient but not always stable in cloud deployment
- free-hosted backends may be slower than local runs
- large date ranges with many tickers can fail or take too long
- this project is intended for educational and analytical use, not financial advice

## Default Universe

The project configuration includes a 10-stock default universe in `backend/config.py`:

- AAPL
- MSFT
- NVDA
- JPM
- GS
- JNJ
- PFE
- PG
- KO
- XOM

The deployed frontend may use a smaller recommended preset by default for better reliability on free infrastructure.

## Team

Team Leader:

- Ajit Mahapatro

Team Members:

- G. Jyothi Charan
- M. Naveen
- A. Shanmukh
- P. Leela Venkatesh
- K. Kushwanth
- K. Harsha
