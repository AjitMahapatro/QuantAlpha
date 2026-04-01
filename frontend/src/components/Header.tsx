import React from 'react';

export type HeaderPage = 'dashboard' | 'analytics' | 'settings';

interface HeaderProps {
  activePage: HeaderPage;
  onNavigate: (page: HeaderPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navButtonClass = (page: HeaderPage) =>
    `nav-button ${activePage === page ? 'nav-button-active' : ''}`.trim();

  return (
    <header className="glass-effect header-shell">
      <div className="header-inner">
        <div className="header-row">
          <div className="header-brand">
            <div className="brand-mark">Q</div>
            <div className="brand-copy">
              <h1>QuantAlpha</h1>
              <p>AI-Powered Portfolio Analytics</p>
            </div>
          </div>

          <div className="nav-desktop">
            <button type="button" className={navButtonClass('dashboard')} onClick={() => onNavigate('dashboard')}>
              Dashboard
            </button>
            <button type="button" className={navButtonClass('analytics')} onClick={() => onNavigate('analytics')}>
              Analytics
            </button>
            <button type="button" className={navButtonClass('settings')} onClick={() => onNavigate('settings')}>
              Settings
            </button>
          </div>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <span>{mobileOpen ? 'x' : '='}</span>
          </button>
        </div>

        <div className={`nav-mobile ${mobileOpen ? 'nav-mobile-open' : ''}`.trim()}>
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
      </div>
    </header>
  );
};
