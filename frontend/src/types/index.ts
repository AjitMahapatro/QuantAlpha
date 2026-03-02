export interface PortfolioData {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  weights: Record<string, number>;
  risk_contribution: Record<string, number>;
}

export interface BacktestData {
  dates: string[];
  portfolio_curve: number[];
  benchmark_curve: number[];
}

export interface OhlcData {
  dates: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface PredictResponse {
  ticker: string;
  as_of: string;
  pred_1d_log: number;
  pred_5d_log: number;
  pred_20d_log: number;
  pred_1d_pct: number;
  pred_5d_pct: number;
  pred_20d_pct: number;
  confidence: number;
}

export interface ResearchSignals {
  [ticker: string]: {
    '1D': number;
    '5D': number;
    '20D': number;
    'Confidence': number;
  };
}

export interface ResearchResponse {
  signals: ResearchSignals;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  loading?: boolean;
}
