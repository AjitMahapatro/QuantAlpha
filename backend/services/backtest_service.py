from __future__ import annotations

import numpy as np
import pandas as pd

from backend.services.analytics_service import summarize_performance, calculate_drawdown


def generate_strategy_signals(feature_map: dict[str, pd.DataFrame]) -> pd.DataFrame:
    signals: dict[str, pd.Series] = {}
    for ticker, frame in feature_map.items():
        long_signal = (
            (frame["close"] > frame["ma_10"])
            & (frame["macd"] > frame["macd_signal"])
            & (frame["rsi_14"] > 50)
        ).astype(float)
        signals[ticker] = long_signal.shift(1).fillna(0.0)
    return pd.DataFrame(signals).sort_index().fillna(0.0)


def run_backtest(
    prices: pd.DataFrame,
    benchmark: pd.Series,
    feature_map: dict[str, pd.DataFrame],
    risk_free_rate: float,
) -> dict[str, object]:
    asset_returns = prices.pct_change().fillna(0.0)
    signals = generate_strategy_signals(feature_map).reindex(asset_returns.index).fillna(0.0)

    active_counts = signals.sum(axis=1).replace(0.0, np.nan)
    weights = signals.div(active_counts, axis=0).fillna(0.0)
    strategy_returns = (weights * asset_returns).sum(axis=1)
    benchmark_returns = benchmark.pct_change().reindex(strategy_returns.index).fillna(0.0)

    strategy_curve = (1 + strategy_returns).cumprod()
    benchmark_curve = (1 + benchmark_returns).cumprod()
    drawdown = calculate_drawdown(strategy_curve)

    trades = []
    for ticker in prices.columns:
        signal = signals[ticker]
        changes = signal.diff().fillna(signal)
        entry_dates = changes[changes > 0].index.tolist()
        exit_dates = changes[changes < 0].index.tolist()
        trades.append(
            {
                "ticker": ticker,
                "entries": len(entry_dates),
                "exits": len(exit_dates),
                "avg_signal": float(signal.mean()),
            }
        )

    return {
        "dates": strategy_curve.index.strftime("%Y-%m-%d").tolist(),
        "strategy_curve": strategy_curve.round(6).tolist(),
        "benchmark_curve": benchmark_curve.round(6).tolist(),
        "drawdown_curve": drawdown.round(6).tolist(),
        "signal_strength": signals.mean().round(4).to_dict(),
        "trades": trades,
        "metrics": summarize_performance(strategy_returns, benchmark_returns, risk_free_rate),
    }
