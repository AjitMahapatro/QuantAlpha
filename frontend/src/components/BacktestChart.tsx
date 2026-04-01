import React from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { BacktestData } from '../types';

interface BacktestChartProps {
  data: BacktestData;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ data }) => {
  const calculatePerformance = () => {
    if (data.portfolio_curve.length === 0) {
      return { portfolio: '0.00', benchmark: null as string | null, outperformance: null as string | null };
    }

    const portfolio = ((data.portfolio_curve[data.portfolio_curve.length - 1] - 1) * 100).toFixed(2);

    if (data.benchmark_curve.length === 0) {
      return { portfolio, benchmark: null, outperformance: null };
    }

    const benchmark = ((data.benchmark_curve[data.benchmark_curve.length - 1] - 1) * 100).toFixed(2);
    const outperformance = (parseFloat(portfolio) - parseFloat(benchmark)).toFixed(2);

    return { portfolio, benchmark, outperformance };
  };

  const performance = calculatePerformance();
  const alphaClass = parseFloat(performance.outperformance || '0') >= 0 ? 'text-success' : 'text-danger';

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="title-xl panel-title-row">
          Portfolio Backtest Performance
          <div className="metrics-inline">
            <span className="text-success">Portfolio: +{performance.portfolio}%</span>
            {performance.benchmark !== null && (
              <>
                <span className="text-info">Benchmark: +{performance.benchmark}%</span>
                <span className={alphaClass}>
                  Alpha: {parseFloat(performance.outperformance || '0') >= 0 ? '+' : ''}
                  {performance.outperformance}%
                </span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="chart-overlay">
          <div className="floating-orb orb-top-right orb-large orb-purple"></div>
          <div className="floating-orb orb-bottom-left orb-large orb-cyan"></div>
        </div>

        <div className="chart-shell">
          <Plot
            data={([
              {
                x: data.dates,
                y: data.portfolio_curve,
                type: 'scatter',
                mode: 'lines',
                name: 'Portfolio',
                line: { color: 'rgba(34,197,94,1)', width: 3 },
                hovertemplate: '%{x}<br>Portfolio: %{y:.4f}<extra></extra>',
              },
              ...(data.benchmark_curve.length
                ? [
                    {
                      x: data.dates,
                      y: data.benchmark_curve,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Benchmark',
                      line: { color: 'rgba(59,130,246,1)', width: 2, dash: 'dot' },
                      hovertemplate: '%{x}<br>Benchmark: %{y:.4f}<extra></extra>',
                    },
                  ]
                : []),
            ] as any)}
            layout={{
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              margin: { l: 48, r: 18, t: 10, b: 40 },
              xaxis: {
                title: 'Date',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickfont: { color: 'rgba(255,255,255,0.7)' },
                titlefont: { color: 'rgba(255,255,255,0.7)' },
              },
              yaxis: {
                title: 'Cumulative Return',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickfont: { color: 'rgba(255,255,255,0.7)' },
                titlefont: { color: 'rgba(255,255,255,0.7)' },
                zeroline: false,
              },
              legend: {
                orientation: 'h',
                x: 0,
                y: 1.15,
                font: { color: 'rgba(255,255,255,0.75)' },
              },
              hovermode: 'x unified',
              hoverlabel: {
                bgcolor: 'rgba(15,23,42,0.95)',
                bordercolor: 'rgba(255,255,255,0.15)',
                font: { color: '#fff' },
              },
            } as any}
            config={{
              displayModeBar: false,
              responsive: true,
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </div>
      </CardContent>
    </Card>
  );
};
