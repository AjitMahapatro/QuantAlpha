# 📈 QuantAlpha – Financial Analytics & Market Intelligence Platform

QuantAlpha is a machine learning-based financial analytics platform designed to analyze stock market trends, portfolio performance, and investment insights through an interactive dashboard experience.

The project combines financial data analysis, portfolio analytics, backtesting, and predictive modeling into a unified analytics platform using a React frontend and FastAPI backend.

Developed as a collaborative team project during the Machine Learning with Python Internship at Adhoc Network Tech Company.

---

# 👥 Team

## Team Leader
- Ajit Mahapatro

## Team Members
- G. Jyothi Charan
- M. Naveen
- A. Shanmukh
- P. Leela Venkatesh
- K. Kushwanth
- K. Harsha

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
