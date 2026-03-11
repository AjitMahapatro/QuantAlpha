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
    if (value > 2) return 'bg-green-500';
    if (value > 0.5) return 'bg-yellow-500';
    if (value > -0.5) return 'bg-gray-500';
    return 'bg-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 85) return 'text-green-400';
    if (confidence > 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="glass-effect relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-indigo-400/10 blur-3xl" />
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
          AI Research Signals
          <span className="text-xs text-white/50 font-medium">{Object.keys(data).length} tickers</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data).map(([ticker, signals]) => (
            <div key={ticker} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-white tracking-wide">{ticker}</h4>
                <Badge variant="outline" className={`${getConfidenceColor(signals.Confidence)} border-white/20 bg-white/5`}>
                  {signals.Confidence}%
                </Badge>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">1D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['1D'])}`}></div>
                    <span className="text-sm text-white font-semibold">
                      {signals['1D'] > 0 ? '+' : ''}{signals['1D']}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">5D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['5D'])}`}></div>
                    <span className="text-sm text-white font-semibold">
                      {signals['5D'] > 0 ? '+' : ''}{signals['5D']}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">20D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['20D'])}`}></div>
                    <span className="text-sm text-white font-semibold">
                      {signals['20D'] > 0 ? '+' : ''}{signals['20D']}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-white font-semibold mb-2">Signal Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-white/75">Strong Buy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-white/75">Buy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-white/75">Hold</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white/75">Sell</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
