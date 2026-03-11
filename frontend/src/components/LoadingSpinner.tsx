import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="glass-effect rounded-xl p-5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-cyan-400/70 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Loading market snapshot...</p>
          <p className="text-white/60 text-xs">Preparing cards and charts</p>
        </div>
      </div>
    </div>
  );
};
