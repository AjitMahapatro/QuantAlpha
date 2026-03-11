import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { PortfolioData } from '../types';

interface PortfolioOverviewProps {
  data: PortfolioData;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ data }) => {
  const getSharpeColor = (ratio: number) => {
    if (ratio > 2) return 'text-green-400';
    if (ratio > 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReturnColor = (returnRate: number) => {
    if (returnRate > 15) return 'text-green-400';
    if (returnRate > 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      <Card className="glass-effect card-hover relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-emerald-400/15 blur-2xl" />
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white/85">Expected Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold tracking-tight ${getReturnColor(data.expected_return)}`}>
            {data.expected_return}%
          </div>
          <p className="text-sm text-white/60 mt-2">Annualized return forecast</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-sky-400/15 blur-2xl" />
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white/85">Volatility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-cyan-300 tracking-tight">
            {data.volatility}%
          </div>
          <p className="text-sm text-white/60 mt-2">Annual risk estimate</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-amber-300/15 blur-2xl" />
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white/85">Sharpe Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold tracking-tight ${getSharpeColor(data.sharpe_ratio)}`}>
            {data.sharpe_ratio}
          </div>
          <p className="text-sm text-white/60 mt-2">Risk-adjusted efficiency</p>
        </CardContent>
      </Card>
    </div>
  );
};
