export interface MatrixPayload {
  labels: string[];
  matrix: number[][];
}

export interface MarketOverview {
  tickers: string[];
  dates: string[];
  cumulative_returns: Record<string, number[]>;
  rolling_volatility: number[];
  return_distribution: number[];
  correlation: MatrixPayload;
  latest_prices: Record<string, number>;
}

export interface PortfolioAnalytics {
  weights: Record<string, number>;
  risk_contribution: Record<string, number>;
  metrics: Record<string, number>;
  ticker_summary: Array<{
    ticker: string;
    annual_return: number;
    annual_volatility: number;
    cumulative_return: number;
  }>;
}

export interface RiskAnalysis {
  drawdown_dates: string[];
  drawdown_curve: number[];
  rolling_volatility: number[];
  return_distribution: number[];
  var_95: number;
  cvar_95: number;
  metrics: Record<string, number>;
}

export interface ForecastingSnapshot {
  ticker: string;
  train_rows: number;
  test_rows: number;
  metrics: Record<string, number>;
  confusion_matrix: number[][];
  feature_importance: Array<{ feature: string; importance: number }>;
  shap_values: Array<{ feature: string; contribution: number }>;
  prediction: {
    date: string;
    probability_up: number;
    predicted_class: number;
    confidence: number;
  };
  test_actuals: number[];
  test_probabilities: number[];
  test_dates: string[];
}

export interface BacktestingSnapshot {
  dates: string[];
  strategy_curve: number[];
  benchmark_curve: number[];
  drawdown_curve: number[];
  signal_strength: Record<string, number>;
  trades: Array<{
    ticker: string;
    entries: number;
    exits: number;
    avg_signal: number;
  }>;
  metrics: Record<string, number>;
}

export interface EconomicIndicators {
  dates: string[];
  series: Record<string, number[]>;
}

export interface AnalyticsSnapshot {
  meta: {
    tickers: string[];
    benchmark: string;
    start_date: string;
    end_date: string;
    primary_ticker: string;
  };
  market_overview: MarketOverview;
  portfolio_analytics: PortfolioAnalytics;
  risk_analysis: RiskAnalysis;
  ml_forecasting: ForecastingSnapshot;
  backtesting: BacktestingSnapshot;
  economic_indicators: EconomicIndicators;
}
