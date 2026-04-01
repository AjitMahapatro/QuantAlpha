import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-shell">
      <div className="glass-effect panel loading-panel">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring-inner"></div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <p className="title-lg">Loading new market data...</p>
          <p className="metric-caption">Please wait. Dashboard will appear when fresh data is ready.</p>
        </div>
      </div>
    </div>
  );
};
