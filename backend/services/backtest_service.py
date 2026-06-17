from __future__ import annotations

import numpy as np
import pandas as pd

from backend.services.analytics_service import summarize_performance, calculate_drawdown


def generate_strategy_signals(feature_map: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Generates trading signals for each ticker based on a simple rules-based strategy.
    The strategy is intentionally simple for interview interpretability.
    """
    signals: dict[str, pd.Series] = {}
    for ticker, frame in feature_map.items():
        # A long signal is generated if all three conditions are met.
        long_signal = (
            (frame["close"] > frame["ma_10"])  # Price is above short-term moving average
            & (frame["macd"] > frame["macd_signal"])  # MACD line is above signal line (bullish)
            & (frame["rsi_14"] > 50)  # RSI indicates bullish momentum
        ).astype(float)  # Convert boolean to 1.0 for long, 0.0 for no position

        # CRITICAL: Lag signals by one day to avoid look-ahead bias.
        # We can only act on yesterday's signal for today's trading.
        signals[ticker] = long_signal.shift(1).fillna(0.0)
    return pd.DataFrame(signals).sort_index().fillna(0.0)


def run_backtest(
    prices: pd.DataFrame,
    benchmark: pd.Series,
    feature_map: dict[str, pd.DataFrame],
    risk_free_rate: float,
) -> dict[str, object]:
    """
    Runs a simple, equal-weight backtest on a set of generated signals and
    returns a dictionary of performance metrics and curves.
    """
    asset_returns = prices.pct_change().fillna(0.0)
    signals = generate_strategy_signals(feature_map).reindex(asset_returns.index).fillna(0.0)

    # Determine how many assets have an active signal each day.
    active_counts = signals.sum(axis=1).replace(0.0, np.nan)
    # Portfolio weights are equal among all assets with an active signal.
    weights = signals.div(active_counts, axis=0).fillna(0.0)
    # Strategy return is the sum of (weight * return) for each asset.
    strategy_returns = (weights * asset_returns).sum(axis=1)
    benchmark_returns = benchmark.pct_change().reindex(strategy_returns.index).fillna(0.0)

    # Calculate cumulative return curves for plotting.
    strategy_curve = (1 + strategy_returns).cumprod()
    benchmark_curve = (1 + benchmark_returns).cumprod()
    drawdown = calculate_drawdown(strategy_curve)

    # --- Trade Diagnostics ---
    trades = []
    for ticker in prices.columns:
        signal = signals[ticker]
        # Find where the signal changes from 0 to 1 (entry) or 1 to 0 (exit).
        changes = signal.diff().fillna(signal)
        entry_dates = changes[changes > 0].index.tolist()
        exit_dates = changes[changes < 0].index.tolist()
        trades.append(
            {
                "ticker": ticker,
                "entries": len(entry_dates),
                "exits": len(exit_dates),
                "avg_signal": float(signal.mean()),  # % of time a signal was active
            }
        )

    # Assemble the final payload for the frontend.
    return {
        "dates": strategy_curve.index.strftime("%Y-%m-%d").tolist(),
        "strategy_curve": strategy_curve.round(6).tolist(),
        "benchmark_curve": benchmark_curve.round(6).tolist(),
        "drawdown_curve": drawdown.round(6).tolist(),
        "signal_strength": signals.mean().round(4).to_dict(),
        "trades": trades,
        "metrics": summarize_performance(strategy_returns, benchmark_returns, risk_free_rate),
    }
