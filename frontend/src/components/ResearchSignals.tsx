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
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">
          AI Research Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data).map(([ticker, signals]) => (
            <div key={ticker} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">{ticker}</h4>
                <Badge variant="outline" className={getConfidenceColor(signals.Confidence)}>
                  {signals.Confidence}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">1D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['1D'])}`}></div>
                    <span className="text-sm text-white font-medium">
                      {signals['1D'] > 0 ? '+' : ''}{signals['1D']}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">5D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['5D'])}`}></div>
                    <span className="text-sm text-white font-medium">
                      {signals['5D'] > 0 ? '+' : ''}{signals['5D']}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">20D Signal</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSignalColor(signals['20D'])}`}></div>
                    <span className="text-sm text-white font-medium">
                      {signals['20D'] > 0 ? '+' : ''}{signals['20D']}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-semibold mb-2">Signal Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-300">Strong Buy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-300">Buy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-300">Hold</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-300">Sell</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
