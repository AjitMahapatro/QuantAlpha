from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel


class MatrixPayload(BaseModel):
    labels: List[str]
    matrix: List[List[float]]


class MarketOverviewResponse(BaseModel):
    tickers: List[str]
    dates: List[str]
    cumulative_returns: Dict[str, List[float]]
    rolling_volatility: List[float]
    return_distribution: List[float]
    correlation: MatrixPayload
    latest_prices: Dict[str, float]


class SnapshotResponse(BaseModel):
    meta: Dict[str, Any]
    market_overview: Dict[str, Any]
    portfolio_analytics: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    ml_forecasting: Dict[str, Any]
    backtesting: Dict[str, Any]
    economic_indicators: Dict[str, Any]
