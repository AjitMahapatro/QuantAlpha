import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-effect rounded-2xl p-8 border border-white/10 w-full max-w-md text-center">
        <div className="relative mx-auto w-12 h-12">
          <div className="w-12 h-12 border-2 border-cyan-400/70 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-1 w-10 h-10 border-2 border-indigo-400/60 border-b-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-4">
          <p className="text-white text-lg font-semibold">Loading new market data...</p>
          <p className="text-white/60 text-sm mt-1">Please wait. Dashboard will appear when fresh data is ready.</p>
        </div>
      </div>
    </div>
  );
};
