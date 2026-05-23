import axios from 'axios';
import { AnalyticsSnapshot } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getSnapshot(params?: { tickers?: string; start_date?: string; end_date?: string }): Promise<AnalyticsSnapshot> {
    const response = await api.get('/snapshot', { params });
    return response.data;
  },
};
