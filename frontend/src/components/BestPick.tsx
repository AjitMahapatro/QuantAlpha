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

  const momentumScore = 0.2 * pick.s1d + 0.3 * pick.s5d + 0.5 * pick.s20d;
  const label =
    momentumScore > 1.0 ? 'Strong Buy' :
    momentumScore > 0.2 ? 'Buy' :
    momentumScore > -0.2 ? 'Hold' :
    momentumScore > -1.0 ? 'Reduce' : 'Sell';
  const labelColor =
    momentumScore > 1.0 ? 'text-success' :
    momentumScore > 0.2 ? 'text-success-soft' :
    momentumScore > -0.2 ? 'text-warning' :
    momentumScore > -1.0 ? 'text-orange' : 'text-danger';

  return (
    <Card className="glass-effect hover-glow">
      <div className="floating-orb orb-top-right orb-medium orb-indigo" />
      <div className="floating-orb orb-bottom-left orb-medium orb-emerald" />

      <CardHeader>
        <CardTitle className="title-lg panel-title-row">
          Best Pick
          <span className={`small-text ${labelColor}`}>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bestpick-summary">
          <div>
            <div className="bestpick-ticker">{pick.ticker}</div>
            <div className="muted-text-strong small-text" style={{ marginTop: '0.25rem' }}>
              AI signal score: {pick.score.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="muted-text small-text">Confidence</div>
            <div className="title-xl">{pick.confidence.toFixed(1)}%</div>
          </div>
        </div>

        <div className="three-col-grid" style={{ marginTop: '1.25rem' }}>
          <div className="mini-card">
            <div className="tiny-text">1D</div>
            <div className="title-md">{pick.s1d > 0 ? '+' : ''}{pick.s1d.toFixed(2)}%</div>
          </div>
          <div className="mini-card">
            <div className="tiny-text">5D</div>
            <div className="title-md">{pick.s5d > 0 ? '+' : ''}{pick.s5d.toFixed(2)}%</div>
          </div>
          <div className="mini-card">
            <div className="tiny-text">20D</div>
            <div className="title-md">{pick.s20d > 0 ? '+' : ''}{pick.s20d.toFixed(2)}%</div>
          </div>
        </div>

        <div className="tiny-text" style={{ marginTop: '1rem' }}>
          Ranking uses weighted momentum + confidence. Action label uses momentum direction.
        </div>
      </CardContent>
    </Card>
  );
};
