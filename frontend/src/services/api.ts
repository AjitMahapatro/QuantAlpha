import axios from 'axios';
import { BacktestData, OhlcData, PortfolioData, PredictResponse, ResearchResponse, ResearchSignals, SnapshotResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getSnapshot(
    params?: { tickers?: string; start_date?: string; end_date?: string },
    timeoutMs = 10000
  ): Promise<SnapshotResponse> {
    const response = await api.get('/snapshot', { params, timeout: timeoutMs });
    return response.data;
  },

  async getPortfolio(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<PortfolioData> {
    const response = await api.get('/portfolio', { params, timeout: 9000 });
    return response.data;
  },

  async getBacktest(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<BacktestData> {
    const response = await api.get('/backtest', { params, timeout: 9000 });
    return response.data;
  },

  async getResearch(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<ResearchSignals> {
    const response = await api.get('/research', { params, timeout: 9000 });
    return (response.data as ResearchResponse).signals;
  },

  async getOhlc(params?: { ticker?: string; start_date?: string; end_date?: string; interval?: string }): Promise<OhlcData> {
    const response = await api.get('/ohlc', { params, timeout: 9000 });
    return response.data;
  },

  async getPredict(params?: { ticker?: string }): Promise<PredictResponse> {
    const response = await api.get('/predict', { params, timeout: 7000 });
    return response.data;
  },

  async healthCheck(): Promise<{ message: string }> {
    const response = await api.get('/');
    return response.data;
  },
};
