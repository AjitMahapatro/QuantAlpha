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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [titleTicker, startDate, endDate, retryKey]);

  return (
    <Card className="glass-effect">
      <div className="floating-orb orb-top-right orb-medium orb-fuchsia" />
      <div className="floating-orb orb-bottom-left orb-medium orb-sky" />

      <CardHeader>
        <CardTitle className="title-lg panel-title-row">
          Best Pick Candlestick
          <span className="muted-text-strong">{titleTicker}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prediction && (
          <div className="prediction-grid">
            <div className="mini-card">
              <div className="tiny-text">As of</div>
              <div className="title-md">{prediction.as_of}</div>
            </div>
            <div className="mini-card">
              <div className="tiny-text">Pred 1D</div>
              <div className="title-md">{prediction.pred_1d_pct > 0 ? '+' : ''}{prediction.pred_1d_pct}%</div>
            </div>
            <div className="mini-card">
              <div className="tiny-text">Pred 5D</div>
              <div className="title-md">{prediction.pred_5d_pct > 0 ? '+' : ''}{prediction.pred_5d_pct}%</div>
            </div>
            <div className="mini-card">
              <div className="tiny-text">Pred 20D</div>
              <div className="title-md">{prediction.pred_20d_pct > 0 ? '+' : ''}{prediction.pred_20d_pct}%</div>
            </div>
          </div>
        )}

        {loading && <div className="muted-text-strong">Loading candlestick...</div>}

        {!loading && error && (
          <div className="row-between" style={{ gap: '1rem' }}>
            <div className="text-danger-soft">{error}</div>
            <button type="button" className="button" onClick={() => setRetryKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && ohlc && ohlc.dates.length > 0 ? (
          <>
            <div className="chart-shell chart-shell-tall">
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

            <div className="chart-shell" style={{ height: '14rem', marginTop: '1rem' }}>
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
          <div className="row-between" style={{ gap: '1rem' }}>
            <div className="muted-text-strong">No candlestick data available for {titleTicker}.</div>
            <button type="button" className="button" onClick={() => setRetryKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        )}

        {!prediction && <div className="tiny-text" style={{ marginTop: '1rem' }}></div>}
      </CardContent>
    </Card>
  );
};
