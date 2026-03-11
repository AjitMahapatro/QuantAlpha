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
    <Card className="glass-effect relative overflow-hidden hover-glow">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          Market Pulse
          <span className="text-xs text-white/50 font-medium">computed from loaded signals</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/60">Bullish Breadth (1D)</div>
            <div className="text-xl font-semibold text-white mt-1">{bullish1D.toFixed(1)}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/60">Bullish Breadth (20D)</div>
            <div className="text-xl font-semibold text-white mt-1">{bullish20D.toFixed(1)}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/60">Avg Confidence</div>
            <div className="text-xl font-semibold text-white mt-1">{avgConfidence.toFixed(1)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-semibold text-emerald-300 mb-3">Top Opportunities</div>
            <div className="space-y-2">
              {leaders.map((r) => (
                <div key={`top-${r.ticker}`} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  <div className="text-white font-medium">{r.ticker}</div>
                  <div className="text-right">
                    <div className="text-white text-sm">{formatSigned(r.s20)}</div>
                    <div className="text-white/60 text-xs">score {r.score.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-300 mb-3">Weakest Momentum</div>
            <div className="space-y-2">
              {laggards.map((r) => (
                <div key={`low-${r.ticker}`} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  <div className="text-white font-medium">{r.ticker}</div>
                  <div className="text-right">
                    <div className="text-white text-sm">{formatSigned(r.s20)}</div>
                    <div className="text-white/60 text-xs">score {r.score.toFixed(2)}</div>
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
