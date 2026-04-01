import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { PortfolioData } from '../types';

interface PortfolioOverviewProps {
  data: PortfolioData;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ data }) => {
  const getSharpeColor = (ratio: number) => {
    if (ratio > 2) return 'text-success';
    if (ratio > 1) return 'text-warning';
    return 'text-danger';
  };

  const getReturnColor = (returnRate: number) => {
    if (returnRate > 15) return 'text-success';
    if (returnRate > 5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="overview-grid">
      <Card className="glass-effect card-hover">
        <div className="floating-orb orb-top-right orb-small orb-emerald" />
        <CardHeader>
          <CardTitle className="title-md">Expected Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`metric-value ${getReturnColor(data.expected_return)}`}>
            {data.expected_return}%
          </div>
          <p className="metric-caption">Annualized return forecast</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover">
        <div className="floating-orb orb-top-right orb-small orb-sky" />
        <CardHeader>
          <CardTitle className="title-md">Volatility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="metric-value text-cyan">{data.volatility}%</div>
          <p className="metric-caption">Annual risk estimate</p>
        </CardContent>
      </Card>

      <Card className="glass-effect card-hover">
        <div className="floating-orb orb-top-right orb-small orb-amber" />
        <CardHeader>
          <CardTitle className="title-md">Sharpe Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`metric-value ${getSharpeColor(data.sharpe_ratio)}`}>
            {data.sharpe_ratio}
          </div>
          <p className="metric-caption">Risk-adjusted efficiency</p>
        </CardContent>
      </Card>
    </div>
  );
};
