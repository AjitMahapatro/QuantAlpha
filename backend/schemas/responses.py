
from typing import Dict, List

from pydantic import BaseModel


class PortfolioResponse(BaseModel):
    expected_return: float
    volatility: float
    sharpe_ratio: float
    weights: Dict[str, float]
    risk_contribution: Dict[str, float]


class BacktestResponse(BaseModel):
    dates: List[str]
    portfolio_curve: List[float]
    benchmark_curve: List[float]


class ResearchResponse(BaseModel):
    signals: Dict[str, Dict[str, float]]
