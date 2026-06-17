from __future__ import annotations

import numpy as np
import pandas as pd


def calculate_drawdown(curve: pd.Series) -> pd.Series:
    """Calculates the percentage drop from a running peak in a cumulative return curve."""
    running_max = curve.cummax()
    return curve / running_max - 1


def calculate_cagr(returns: pd.Series) -> float:
    """Calculates the Compound Annual Growth Rate for a series of daily returns."""
    if returns.empty:
        return 0.0
    # Calculate total return over the period
    total_return = (1 + returns).prod()
    # Annualize the total return
    years = max(len(returns) / 252, 1 / 252)  # Use at least 1 day to avoid division by zero
    return total_return ** (1 / years) - 1


def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """Calculates the Sharpe ratio, a measure of risk-adjusted return."""
    # Calculate excess returns over the risk-free rate
    excess = returns - (risk_free_rate / 252)
    volatility = excess.std()
    if volatility == 0 or np.isnan(volatility):
        return 0.0
    # Annualize the result
    return np.sqrt(252) * excess.mean() / volatility


def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """
    Calculates the Sortino ratio, which is similar to Sharpe but only penalizes for
    downside volatility.
    """
    excess = returns - (risk_free_rate / 252)
    # Consider only the standard deviation of negative returns
    downside = excess[excess < 0].std()
    if downside == 0 or np.isnan(downside):
        return 0.0
    return np.sqrt(252) * excess.mean() / downside


def calculate_beta_alpha(portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> tuple[float, float]:
    """Calculates Beta (market sensitivity) and Alpha (excess return)."""
    # Align returns and drop any days where one is missing
    aligned = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
    if aligned.empty or aligned.iloc[:, 1].var() == 0:
        return 0.0, 0.0
    # Beta = Cov(portfolio, benchmark) / Var(benchmark)
    covariance = aligned.iloc[:, 0].cov(aligned.iloc[:, 1])
    beta = covariance / aligned.iloc[:, 1].var()
    # Alpha = (Avg Portfolio Return - Beta * Avg Benchmark Return), annualized
    alpha = (aligned.iloc[:, 0].mean() - beta * aligned.iloc[:, 1].mean()) * 252
    return float(beta), float(alpha)


def summarize_performance(
    returns: pd.Series,
    benchmark_returns: pd.Series,
    risk_free_rate: float = 0.02,
) -> dict[str, float]:
    """Aggregates a wide range of performance and risk metrics into a single dictionary."""
    curve = (1 + returns).cumprod()
    drawdown = calculate_drawdown(curve)
    beta, alpha = calculate_beta_alpha(returns, benchmark_returns)
    volatility = returns.std() * np.sqrt(252) if not returns.empty else 0.0

    return {
        "cumulative_return": float(curve.iloc[-1] - 1) if not curve.empty else 0.0,
        "cagr": float(calculate_cagr(returns)),
        "sharpe_ratio": float(calculate_sharpe_ratio(returns, risk_free_rate)),
        "sortino_ratio": float(calculate_sortino_ratio(returns, risk_free_rate)),
        "beta": beta,
        "alpha": alpha,
        "max_drawdown": float(drawdown.min()) if not drawdown.empty else 0.0,
        "rolling_volatility": float(returns.tail(20).std() * np.sqrt(252)) if len(returns) >= 20 else 0.0,
        "annualized_volatility": float(volatility),
    }


def correlation_matrix(returns_frame: pd.DataFrame) -> dict[str, object]:
    """Calculates the correlation matrix for a DataFrame of asset returns."""
    corr = returns_frame.corr().fillna(0.0)
    labels = corr.columns.tolist()
    # Format for Plotly's heatmap
    return {
        "labels": labels,
        "matrix": corr.round(4).values.tolist(),
    }
