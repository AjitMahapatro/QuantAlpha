import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-4 text-white text-lg font-medium">Loading QuantAlpha...</p>
        <p className="text-gray-400 text-sm mt-2">Analyzing market data</p>
      </div>
    </div>
  );
};
