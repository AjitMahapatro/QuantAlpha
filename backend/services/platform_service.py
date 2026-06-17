from __future__ import annotations

import numpy as np
import pandas as pd

from backend.config import BENCHMARK, RISK_FREE_RATE
from backend.services.analytics_service import correlation_matrix, summarize_performance
from backend.services.backtest_service import run_backtest
from backend.services.data_service import (
    fetch_benchmark_data,
    fetch_macro_data,
    fetch_price_data,
    fetch_volume_data,
    normalize_inputs,
)
from backend.services.feature_engineering import create_ticker_feature_frame
from backend.services.ml_service import train_direction_model


def _series_payload(series: pd.Series, decimals: int = 6) -> list[float]:
    """Helper to format a pandas Series for JSON serialization."""
    return series.fillna(0.0).round(decimals).tolist()


def build_platform_snapshot(
    tickers: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, object]:
    """
    The main orchestration function. It runs the entire analytics pipeline and
    assembles the final JSON object for the frontend.
    """
    # 1. Normalize inputs and fetch all required raw data.
    selected_tickers, start, end = normalize_inputs(tickers, start_date, end_date)
    prices = fetch_price_data(selected_tickers, start, end)
    benchmark = fetch_benchmark_data(start, end)
    macro = fetch_macro_data(start, end)

    # 2. Loop through each ticker to generate its feature set.
    benchmark_returns = benchmark.pct_change().rename("benchmark_return")
    feature_map: dict[str, pd.DataFrame] = {}

    for ticker in selected_tickers:
        volume = fetch_volume_data(ticker, start, end)
        feature_map[ticker] = create_ticker_feature_frame(
            ticker=ticker,
            price_series=prices[ticker].dropna(),
            benchmark_returns=benchmark_returns,
            macro_frame=macro,
            volume_series=volume,
        )

    # 3. Calculate baseline portfolio analytics (equal-weight).
    asset_returns = prices.pct_change().dropna(how="all")
    equal_weight_returns = asset_returns.mean(axis=1).fillna(0.0)
    benchmark_aligned_returns = benchmark.pct_change().reindex(equal_weight_returns.index).fillna(0.0)
    portfolio_curve = (1 + equal_weight_returns).cumprod()
    benchmark_curve = (1 + benchmark_aligned_returns).cumprod()

    portfolio_metrics = summarize_performance(equal_weight_returns, benchmark_aligned_returns, RISK_FREE_RATE)
    weights = {ticker: round(100 / len(selected_tickers), 2) for ticker in selected_tickers}
    # Simple risk contribution based on un-diversified standard deviation.
    risk_contribution = {
        ticker: float((asset_returns[ticker].std() / asset_returns.std().sum()) * 100)
        if asset_returns[ticker].std() and asset_returns.std().sum()
        else 0.0
        for ticker in selected_tickers
    }

    # 4. Run the more complex modules: backtesting and ML forecasting.
    first_ticker = selected_tickers[0]
    first_features = feature_map[first_ticker]
    backtest = run_backtest(prices, benchmark, feature_map, RISK_FREE_RATE)
    # The ML model is trained on-the-fly for the first ticker in the list.
    ml_results = train_direction_model(first_features, first_ticker)

    # 5. Prepare and structure all data into a final dictionary for the API response.
    rolling_volatility = (equal_weight_returns.rolling(21).std() * np.sqrt(252)).reindex(prices.index).fillna(0.0)
    return_distribution = equal_weight_returns.dropna()
    cumulative_returns = prices.divide(prices.iloc[0]).subtract(1.0).dropna(how="all")

    # This structure maps directly to the pages/components on the frontend.
    market_overview = {
        "tickers": selected_tickers,
        "dates": cumulative_returns.index.strftime("%Y-%m-%d").tolist(),
        "cumulative_returns": {
            ticker: _series_payload(cumulative_returns[ticker]) for ticker in cumulative_returns.columns
        },
        "rolling_volatility": _series_payload(rolling_volatility),
        "return_distribution": return_distribution.round(6).tolist(),
        "correlation": correlation_matrix(asset_returns),
        "latest_prices": {ticker: float(prices[ticker].iloc[-1]) for ticker in selected_tickers},
    }

    portfolio_analytics = {
        "weights": weights,
        "risk_contribution": {ticker: round(value, 2) for ticker, value in risk_contribution.items()},
        "metrics": portfolio_metrics,
        "ticker_summary": [
            {
                "ticker": ticker,
                "annual_return": float(asset_returns[ticker].mean() * 252),
                "annual_volatility": float(asset_returns[ticker].std() * np.sqrt(252)),
                "cumulative_return": float((prices[ticker].iloc[-1] / prices[ticker].iloc[0]) - 1),
            }
            for ticker in selected_tickers
        ],
    }

    risk_analysis = {
        "drawdown_dates": portfolio_curve.index.strftime("%Y-%m-%d").tolist(),
        "drawdown_curve": _series_payload(portfolio_curve / portfolio_curve.cummax() - 1),
        "rolling_volatility": _series_payload(rolling_volatility),
        "return_distribution": return_distribution.round(6).tolist(),
        "var_95": float(return_distribution.quantile(0.05)) if not return_distribution.empty else 0.0,
        "cvar_95": float(return_distribution[return_distribution <= return_distribution.quantile(0.05)].mean())
        if not return_distribution.empty
        else 0.0,
        "metrics": portfolio_metrics,
    }

    economic_indicators = {
        "dates": macro.index.strftime("%Y-%m-%d").tolist(),
        "series": {
            column: _series_payload(macro[column], decimals=4) for column in macro.columns
        },
    }

    return {
        "meta": {
            "tickers": selected_tickers,
            "benchmark": BENCHMARK,
            "start_date": start,
            "end_date": end,
            "primary_ticker": first_ticker,
        },
        "market_overview": market_overview,
        "portfolio_analytics": portfolio_analytics,
        "risk_analysis": risk_analysis,
        "ml_forecasting": ml_results,
        "backtesting": backtest,
        "economic_indicators": economic_indicators,
    }
