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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="glass-effect card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Expected Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getReturnColor(data.expected_return)}`}>
            {data.expected_return}%
          </div>
          <p className="text-sm text-gray-400 mt-2">Annualized Return</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Volatility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-400">
            {data.volatility}%
          </div>
          <p className="text-sm text-gray-400 mt-2">Annual Risk</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Sharpe Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getSharpeColor(data.sharpe_ratio)}`}>
            {data.sharpe_ratio}
          </div>
          <p className="text-sm text-gray-400 mt-2">Risk-Adjusted Return</p>
        </CardContent>
      </Card>
    </div>
  );
};
