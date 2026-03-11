from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import logging
from datetime import date

try:
    from backend.services.portfolio_service import (
        run_portfolio_optimization,
        run_backtest,
        run_research,
        fetch_ohlc,
    )
    from backend.schemas.responses import BacktestResponse, PortfolioResponse, ResearchResponse
except ModuleNotFoundError:
    from services.portfolio_service import (
        run_portfolio_optimization,
        run_backtest,
        run_research,
        fetch_ohlc,
    )
    from schemas.responses import BacktestResponse, PortfolioResponse, ResearchResponse

app = FastAPI(title="QuantAlpha API")

try:
    from dotenv import load_dotenv

    load_dotenv()
except ModuleNotFoundError:
    pass

logger = logging.getLogger("quantalph.api")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Reduce noisy upstream logs (Yahoo blocks can spam errors)
logging.getLogger("yfinance").setLevel(logging.WARNING)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error"},
    )

# ============================
# CORS (Allow React frontend)
# ============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# ROUTES
# ============================

@app.get("/")
def root():
    return {"message": "QuantAlpha Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/portfolio", response_model=PortfolioResponse)
def portfolio(
    tickers: str | None = Query(default=None, description="Comma-separated tickers"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
):
    try:
        parsed = [t.strip().upper() for t in tickers.split(",") if t.strip()] if tickers else None
        return run_portfolio_optimization(parsed, start_date, end_date)
    except Exception as exc:
        logger.exception("Portfolio endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Portfolio optimization failed",
        ) from exc

@app.get("/predict")
def predict(
    ticker: str = Query(default="AAPL", description="Single ticker"),
):
    try:
        try:
            from backend.services.inference_service import predict_ticker
        except ModuleNotFoundError:
            from services.inference_service import predict_ticker

        result = predict_ticker(ticker)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prediction unavailable (market data fetch failed or ticker missing)",
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Predict endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction failed",
        ) from exc

@app.get("/routes")
def routes():
    return {
        "routes": sorted({getattr(r, "path", "") for r in app.router.routes if getattr(r, "path", "")})
    }

@app.get("/backtest", response_model=BacktestResponse)
def backtest(
    tickers: str | None = Query(default=None, description="Comma-separated tickers"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
):
    try:
        parsed = [t.strip().upper() for t in tickers.split(",") if t.strip()] if tickers else None
        return run_backtest(parsed, start_date, end_date)
    except Exception as exc:
        logger.exception("Backtest endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Backtest failed",
        ) from exc

@app.get("/research", response_model=ResearchResponse)
def research(
    tickers: str | None = Query(default=None, description="Comma-separated tickers"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
):
    try:
        parsed = [t.strip().upper() for t in tickers.split(",") if t.strip()] if tickers else None
        return {"signals": run_research(parsed, start_date, end_date)}
    except Exception as exc:
        logger.exception("Research endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Research failed",
        ) from exc


@app.get("/snapshot")
def snapshot(
    tickers: str | None = Query(default=None, description="Comma-separated tickers"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
):
    try:
        parsed = [t.strip().upper() for t in tickers.split(",") if t.strip()] if tickers else None
        return {
            "portfolio": run_portfolio_optimization(parsed, start_date, end_date),
            "backtest": run_backtest(parsed, start_date, end_date),
            "signals": run_research(parsed, start_date, end_date),
        }
    except Exception as exc:
        logger.exception("Snapshot endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Snapshot failed",
        ) from exc

@app.get("/ohlc")
def ohlc(
    ticker: str = Query(default="AAPL", description="Single ticker"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    interval: str = Query(default="1d", description="yfinance interval (e.g. 1d, 1h)"),
):
    try:
        try:
            from backend.config import START_DATE, END_DATE
        except ModuleNotFoundError:
            from config import START_DATE, END_DATE

        start = start_date or START_DATE
        end = end_date or END_DATE

        try:
            date.fromisoformat(start)
            date.fromisoformat(end)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format") from exc

        allowed_intervals = {"1d", "1h", "30m", "15m", "5m"}
        if interval not in allowed_intervals:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid interval")

        return fetch_ohlc(ticker.strip().upper(), start, end, interval)
    except Exception as exc:
        logger.exception("OHLC endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OHLC fetch failed",
        ) from exc
