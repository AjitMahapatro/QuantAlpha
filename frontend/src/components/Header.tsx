import React from 'react';

export type HeaderPage = 'dashboard' | 'analytics' | 'settings';

interface HeaderProps {
  activePage: HeaderPage;
  onNavigate: (page: HeaderPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navButtonClass = (page: HeaderPage) => {
    const base = 'px-4 py-2 text-sm font-semibold tracking-wide transition-all rounded-xl border';
    if (activePage === page) {
      return `${base} text-white bg-white/12 border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`;
    }
    return `${base} text-white/75 border-transparent hover:text-white hover:bg-white/7 hover:border-white/10`;
  };

  return (
    <header className="glass-effect sticky top-0 z-20 border-b border-white/10">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-none text-white tracking-tight">QuantAlpha</h1>
              <p className="text-sm text-white/60 mt-1">AI-Powered Portfolio Analytics</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-black/15 border border-white/10 rounded-2xl p-1.5">
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

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/15 bg-white/5 text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span className="text-lg">{mobileOpen ? 'x' : '='}</span>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-4 grid grid-cols-1 gap-2 bg-black/15 border border-white/10 rounded-xl p-2">
            <button
              type="button"
              className={navButtonClass('dashboard')}
              onClick={() => {
                onNavigate('dashboard');
                setMobileOpen(false);
              }}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={navButtonClass('analytics')}
              onClick={() => {
                onNavigate('analytics');
                setMobileOpen(false);
              }}
            >
              Analytics
            </button>
            <button
              type="button"
              className={navButtonClass('settings')}
              onClick={() => {
                onNavigate('settings');
                setMobileOpen(false);
              }}
            >
              Settings
            </button>
          </div>
        )}
        </div>
    </header>
  );
};
