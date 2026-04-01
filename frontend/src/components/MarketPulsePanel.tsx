import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import type { ResearchSignals } from '../types';

interface MarketPulsePanelProps {
  signals: ResearchSignals;
}

type Row = {
  ticker: string;
  score: number;
  c: number;
  s1: number;
  s5: number;
  s20: number;
};

const formatSigned = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export const MarketPulsePanel: React.FC<MarketPulsePanelProps> = ({ signals }) => {
  const rows: Row[] = Object.entries(signals).map(([ticker, s]) => {
    const s1 = s['1D'] ?? 0;
    const s5 = s['5D'] ?? 0;
    const s20 = s['20D'] ?? 0;
    const c = s['Confidence'] ?? 0;
    const score = 0.2 * s1 + 0.3 * s5 + 0.5 * s20 + 0.02 * c;
    return { ticker, score, c, s1, s5, s20 };
  });

  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const perSide = Math.min(5, Math.max(1, Math.floor(sorted.length / 2)));
  const leaders = sorted.slice(0, perSide);
  const leaderTickers = new Set(leaders.map((r) => r.ticker));
  const laggardsPool = sorted.filter((r) => !leaderTickers.has(r.ticker));
  const laggards = [...laggardsPool].sort((a, b) => a.score - b.score).slice(0, perSide);

  const bullish1D = (rows.filter((r) => r.s1 > 0).length / rows.length) * 100;
  const bullish20D = (rows.filter((r) => r.s20 > 0).length / rows.length) * 100;
  const avgConfidence = rows.reduce((sum, r) => sum + r.c, 0) / rows.length;

  return (
    <Card className="glass-effect hover-glow">
      <div className="floating-orb orb-top-right orb-medium orb-sky" />
      <div className="floating-orb orb-bottom-left orb-medium orb-emerald" />

      <CardHeader>
        <CardTitle className="title-lg panel-title-row">
          Market Pulse
          <span className="tiny-text">computed from loaded signals</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="three-col-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="mini-card">
            <div className="tiny-text">Bullish Breadth (1D)</div>
            <div className="title-lg" style={{ marginTop: '0.25rem' }}>{bullish1D.toFixed(1)}%</div>
          </div>
          <div className="mini-card">
            <div className="tiny-text">Bullish Breadth (20D)</div>
            <div className="title-lg" style={{ marginTop: '0.25rem' }}>{bullish20D.toFixed(1)}%</div>
          </div>
          <div className="mini-card">
            <div className="tiny-text">Avg Confidence</div>
            <div className="title-lg" style={{ marginTop: '0.25rem' }}>{avgConfidence.toFixed(1)}%</div>
          </div>
        </div>

        <div className="field-grid">
          <div className="subpanel">
            <div className="small-text text-success-soft" style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
              Top Opportunities
            </div>
            <div className="stack-sm">
              {leaders.map((r) => (
                <div key={`top-${r.ticker}`} className="surface-muted" style={{ padding: '0.65rem 0.85rem' }}>
                  <div className="row-between">
                    <div style={{ fontWeight: 600 }}>{r.ticker}</div>
                    <div className="text-right">
                      <div className="small-text">{formatSigned(r.s20)}</div>
                      <div className="tiny-text">score {r.score.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="subpanel">
            <div className="small-text text-danger-soft" style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
              Weakest Momentum
            </div>
            <div className="stack-sm">
              {laggards.map((r) => (
                <div key={`low-${r.ticker}`} className="surface-muted" style={{ padding: '0.65rem 0.85rem' }}>
                  <div className="row-between">
                    <div style={{ fontWeight: 600 }}>{r.ticker}</div>
                    <div className="text-right">
                      <div className="small-text">{formatSigned(r.s20)}</div>
                      <div className="tiny-text">score {r.score.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
