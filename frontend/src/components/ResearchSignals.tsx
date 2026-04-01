import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';

interface ResearchSignalsData {
  [ticker: string]: {
    '1D': number;
    '5D': number;
    '20D': number;
    'Confidence': number;
  };
}

interface ResearchSignalsProps {
  data: ResearchSignalsData;
}

export const ResearchSignalsComponent: React.FC<ResearchSignalsProps> = ({ data }) => {
  const getSignalColor = (value: number) => {
    if (value > 2) return 'dot-green';
    if (value > 0.5) return 'dot-yellow';
    if (value > -0.5) return 'dot-gray';
    return 'dot-red';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 85) return 'text-success';
    if (confidence > 75) return 'text-warning';
    return 'text-danger';
  };

  return (
    <Card className="glass-effect">
      <div className="floating-orb orb-top-right orb-medium orb-indigo" />
      <CardHeader>
        <CardTitle className="title-xl panel-title-row">
          AI Research Signals
          <span className="tiny-text">{Object.keys(data).length} tickers</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="signal-grid">
          {Object.entries(data).map(([ticker, signals]) => (
            <div key={ticker} className="subpanel card-hover">
              <div className="row-between" style={{ marginBottom: '0.75rem' }}>
                <h4 className="title-lg">{ticker}</h4>
                <Badge variant="outline" className={getConfidenceColor(signals.Confidence)}>
                  {signals.Confidence}%
                </Badge>
              </div>

              <div className="stack-sm">
                <div className="signal-row">
                  <span className="muted-text small-text">1D Signal</span>
                  <div className="pill-row">
                    <div className={`signal-dot ${getSignalColor(signals['1D'])}`}></div>
                    <span className="small-text" style={{ fontWeight: 700 }}>
                      {signals['1D'] > 0 ? '+' : ''}{signals['1D']}%
                    </span>
                  </div>
                </div>

                <div className="signal-row">
                  <span className="muted-text small-text">5D Signal</span>
                  <div className="pill-row">
                    <div className={`signal-dot ${getSignalColor(signals['5D'])}`}></div>
                    <span className="small-text" style={{ fontWeight: 700 }}>
                      {signals['5D'] > 0 ? '+' : ''}{signals['5D']}%
                    </span>
                  </div>
                </div>

                <div className="signal-row">
                  <span className="muted-text small-text">20D Signal</span>
                  <div className="pill-row">
                    <div className={`signal-dot ${getSignalColor(signals['20D'])}`}></div>
                    <span className="small-text" style={{ fontWeight: 700 }}>
                      {signals['20D'] > 0 ? '+' : ''}{signals['20D']}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="subpanel" style={{ marginTop: '1.5rem' }}>
          <h4 className="title-md" style={{ marginBottom: '0.75rem' }}>Signal Legend</h4>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-dot dot-green"></div>
              <span className="muted-text-strong small-text">Strong Buy</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-yellow"></div>
              <span className="muted-text-strong small-text">Buy</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-gray"></div>
              <span className="muted-text-strong small-text">Hold</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot dot-red"></div>
              <span className="muted-text-strong small-text">Sell</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
