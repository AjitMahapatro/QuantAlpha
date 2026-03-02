import React from 'react';

export type HeaderPage = 'dashboard' | 'analytics' | 'settings';

interface HeaderProps {
  activePage: HeaderPage;
  onNavigate: (page: HeaderPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const navButtonClass = (page: HeaderPage) => {
    const base = 'px-4 py-2 text-sm font-medium transition-colors';
    if (activePage === page) {
      return `${base} text-white bg-white/10 border border-white/20 rounded-lg`;
    }
    return `${base} text-white/80 hover:text-white`;
  };

  return (
    <header className="glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QuantAlpha</h1>
              <p className="text-sm text-gray-400">AI-Powered Portfolio Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className={navButtonClass('dashboard')}
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={navButtonClass('analytics')}
              onClick={() => onNavigate('analytics')}
            >
              Analytics
            </button>
            <button
              type="button"
              className={navButtonClass('settings')}
              onClick={() => onNavigate('settings')}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
