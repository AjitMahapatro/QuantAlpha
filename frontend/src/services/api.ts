import axios from 'axios';
import { BacktestData, OhlcData, PortfolioData, PredictResponse, ResearchResponse, ResearchSignals } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getPortfolio(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<PortfolioData> {
    const response = await api.get('/portfolio', { params });
    return response.data;
  },

  async getBacktest(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<BacktestData> {
    const response = await api.get('/backtest', { params });
    return response.data;
  },

  async getResearch(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<ResearchSignals> {
    const response = await api.get('/research', { params });
    return (response.data as ResearchResponse).signals;
  },

  async getOhlc(params?: { ticker?: string; start_date?: string; end_date?: string; interval?: string }): Promise<OhlcData> {
    const response = await api.get('/ohlc', { params });
    return response.data;
  },

  async getPredict(params?: { ticker?: string }): Promise<PredictResponse> {
    const response = await api.get('/predict', { params });
    return response.data;
  },

  async healthCheck(): Promise<{ message: string }> {
    const response = await api.get('/');
    return response.data;
  },
};
