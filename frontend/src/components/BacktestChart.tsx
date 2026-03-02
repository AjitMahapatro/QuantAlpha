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

  return (
    <Card className="glass-effect relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
          Portfolio Backtest Performance
          <div className="flex space-x-4 text-sm">
            <span className="text-green-400">Portfolio: +{performance.portfolio}%</span>
            {performance.benchmark !== null && (
              <>
                <span className="text-blue-400">Benchmark: +{performance.benchmark}%</span>
                <span className={`font-bold ${parseFloat(performance.outperformance || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Alpha: {parseFloat(performance.outperformance || '0') >= 0 ? '+' : ''}{performance.outperformance}%
                </span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl"></div>
        </div>

        <div className="relative h-96 bg-white/5 rounded-lg p-4 border border-white/10">
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
