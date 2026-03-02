# backend/services/metrics_service.py

import numpy as np

def sharpe_ratio(returns):
    return np.sqrt(252) * returns.mean() / returns.std()

def cagr(returns):
    cumulative = (1 + returns).prod()
    years = len(returns) / 252
    return cumulative**(1/years) - 1

def max_drawdown(returns):
    cumulative = (1 + returns).cumprod()
    peak = cumulative.cummax()
    drawdown = (cumulative - peak) / peak
    return drawdown.min()