import React, { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import type { OhlcData, PredictResponse } from '../types';
import { apiService } from '../services/api';

interface BestPickCandlestickProps {
  ticker: string;
  startDate?: string;
  endDate?: string;
}

export const BestPickCandlestick: React.FC<BestPickCandlestickProps> = ({ ticker, startDate, endDate }) => {
  const [ohlc, setOhlc] = useState<OhlcData | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const titleTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ohlcData, pred] = await Promise.all([
          apiService.getOhlc({ ticker: titleTicker, start_date: startDate, end_date: endDate, interval: '1d' }),
          apiService.getPredict({ ticker: titleTicker }),
        ]);

        if (cancelled) return;
        setOhlc(ohlcData);
        setPrediction(pred);
      } catch {
        if (cancelled) return;
        setOhlc(null);
        setPrediction(null);
        setError('Failed to load candlestick data.');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [titleTicker, startDate, endDate, retryKey]);

  return (
    <Card className="glass-effect relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl" />

      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          Best Pick Candlestick
          <span className="text-white/80">{titleTicker}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prediction && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">As of</div>
              <div className="text-sm font-semibold text-white">{prediction.as_of}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">Pred 1D</div>
              <div className="text-sm font-semibold text-white">{prediction.pred_1d_pct > 0 ? '+' : ''}{prediction.pred_1d_pct}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">Pred 5D</div>
              <div className="text-sm font-semibold text-white">{prediction.pred_5d_pct > 0 ? '+' : ''}{prediction.pred_5d_pct}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">Pred 20D</div>
              <div className="text-sm font-semibold text-white">{prediction.pred_20d_pct > 0 ? '+' : ''}{prediction.pred_20d_pct}%</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-white/70">Loading candlestick…</div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-between gap-4">
            <div className="text-red-300">{error}</div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && ohlc && ohlc.dates.length > 0 ? (
          <>
            <div className="relative h-[26rem] bg-white/5 rounded-lg p-3 border border-white/10">
              <Plot
                data={[
                  {
                    x: ohlc.dates,
                    open: ohlc.open,
                    high: ohlc.high,
                    low: ohlc.low,
                    close: ohlc.close,
                    type: 'candlestick',
                    name: 'OHLC',
                    increasing: { line: { color: 'rgba(34,197,94,1)' } },
                    decreasing: { line: { color: 'rgba(239,68,68,1)' } },
                  },
                ] as any}
                layout={{
                  autosize: true,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  margin: { l: 48, r: 18, t: 10, b: 40 },
                  xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                  yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                  showlegend: false,
                } as any}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
              />
            </div>

            <div className="relative h-56 mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
              <Plot
                data={[
                  {
                    x: ohlc.dates,
                    y: ohlc.volume,
                    type: 'bar',
                    name: 'Volume',
                    marker: { color: 'rgba(148,163,184,0.6)' },
                  },
                ] as any}
                layout={{
                  autosize: true,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  margin: { l: 48, r: 18, t: 10, b: 40 },
                  xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                  yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                  showlegend: false,
                } as any}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
              />
            </div>
          </>
        ) : null}

        {!loading && !error && (!ohlc || ohlc.dates.length === 0) && (
          <div className="flex items-center justify-between gap-4">
            <div className="text-white/70">No candlestick data available for {titleTicker}.</div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {!prediction && (
          <div className="text-xs text-white/50 mt-4">
            
          </div>
        )}
      </CardContent>
    </Card>
  );
};
