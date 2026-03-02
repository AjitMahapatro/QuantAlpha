import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import type { ResearchSignals } from '../types';
import { computePick } from '../utils/pickUtils';

interface BestPickProps {
  signals: ResearchSignals;
}

export const BestPick: React.FC<BestPickProps> = ({ signals }) => {
  const pick = computePick(signals);
  if (!pick) return null;

  const label = pick.score > 2 ? 'Strong Buy' : pick.score > 0.5 ? 'Buy' : pick.score > -0.5 ? 'Hold' : 'Sell';
  const labelColor = pick.score > 2 ? 'text-green-400' : pick.score > 0.5 ? 'text-emerald-300' : pick.score > -0.5 ? 'text-yellow-300' : 'text-red-400';

  return (
    <Card className="glass-effect relative overflow-hidden hover-glow">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-500/25 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/25 blur-3xl" />

      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          Best Pick
          <span className={`text-sm font-semibold ${labelColor}`}>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">{pick.ticker}</div>
              <div className="text-sm text-white/70 mt-1">AI signal score: {pick.score.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Confidence</div>
              <div className="text-xl font-semibold text-white">{pick.confidence.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">1D</div>
              <div className="text-sm font-semibold text-white">{pick.s1d > 0 ? '+' : ''}{pick.s1d.toFixed(2)}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">5D</div>
              <div className="text-sm font-semibold text-white">{pick.s5d > 0 ? '+' : ''}{pick.s5d.toFixed(2)}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60">20D</div>
              <div className="text-sm font-semibold text-white">{pick.s20d > 0 ? '+' : ''}{pick.s20d.toFixed(2)}%</div>
            </div>
          </div>

          <div className="text-xs text-white/50 mt-4">
            Computed as weighted momentum (20D, 5D, 1D) + confidence.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
