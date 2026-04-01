import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { PortfolioOverview } from './components/PortfolioOverview';
import { BacktestChart } from './components/BacktestChart';
import { ResearchSignalsComponent } from './components/ResearchSignals';
import { BestPick } from './components/BestPick';
import { MarketPulsePanel } from './components/MarketPulsePanel';
import { Header, type HeaderPage } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { apiService } from './services/api';
import { PortfolioData, BacktestData, ResearchSignals as ISignals } from './types';

function App() {
  const DEFAULT_FAST_TICKERS = 'AAPL,MSFT,NVDA';
  const PRESET_UNIVERSES: Record<string, string> = {
    'US 3 (Recommended)': DEFAULT_FAST_TICKERS,
    'US 10': 'AAPL,MSFT,NVDA,JPM,GS,JNJ,PFE,PG,KO,XOM',
    'Big Tech': 'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA',
    'Defensive': 'JNJ,PFE,PG,KO,PEP,WMT,COST',
  };

  const defaultDateRange = useMemo(() => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }, []);

  const [activePage, setActivePage] = useState<HeaderPage>('dashboard');
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestData | null>(null);
  const [signalsData, setSignalsData] = useState<ISignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockingLoad, setBlockingLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasVisibleDataRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const lastLoadedQueryRef = useRef('');

  const [appliedSettings, setAppliedSettings] = useState(() => ({
    tickers: DEFAULT_FAST_TICKERS,
    start_date: defaultDateRange.start,
    end_date: defaultDateRange.end,
    refreshSeconds: 60,
  }));

  const [draftSettings, setDraftSettings] = useState(() => ({
    tickers: DEFAULT_FAST_TICKERS,
    start_date: defaultDateRange.start,
    end_date: defaultDateRange.end,
    refreshSeconds: 60,
  }));

  const readCachedSnapshot = () => {
    try {
      const raw = window.localStorage.getItem('qa_last_snapshot');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { portfolio: PortfolioData; backtest: BacktestData; signals: ISignals };
      const signalCount = Object.keys(parsed?.signals || {}).length;
      if (signalCount > 0 && signalCount < 10) {
        window.localStorage.removeItem('qa_last_snapshot');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const getSnapshotTimeoutMs = (startDate?: string, endDate?: string, blocking = false) => {
    const startMs = startDate ? Date.parse(startDate) : NaN;
    const endMs = endDate ? Date.parse(endDate) : NaN;
    const years =
      Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
        ? (endMs - startMs) / (1000 * 60 * 60 * 24 * 365)
        : 1;

    let timeoutMs = 30000;
    if (years >= 15) timeoutMs = 120000;
    else if (years >= 10) timeoutMs = 90000;
    else if (years >= 5) timeoutMs = 60000;
    else if (years >= 2) timeoutMs = 45000;

    return blocking ? Math.min(timeoutMs, 45000) : timeoutMs;
  };

  const fetchData = useCallback(async (options?: { blocking?: boolean }) => {
    const requestId = ++latestRequestIdRef.current;
    const isBlocking = options?.blocking ?? !hasVisibleDataRef.current;

    const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
      new Promise((resolve) => {
        const id = window.setTimeout(() => resolve(null), ms);
        promise
          .then((value) => {
            window.clearTimeout(id);
            resolve(value);
          })
          .catch(() => {
            window.clearTimeout(id);
            resolve(null);
          });
      });

    try {
      setLoading(true);
      if (isBlocking) {
        setBlockingLoad(true);
      }
      setError(null);

      const params = {
        tickers: appliedSettings.tickers || undefined,
        start_date: appliedSettings.start_date || undefined,
        end_date: appliedSettings.end_date || undefined,
      };
      const queryKey = JSON.stringify(params);
      const timeoutMs = getSnapshotTimeoutMs(params.start_date, params.end_date, isBlocking);

      const snapshot = await withTimeout(apiService.getSnapshot(params, timeoutMs), timeoutMs);
      const hasSignalData = (s: ISignals | null | undefined) => {
        if (!s) return false;
        return Object.values(s).some((v) => (v['1D'] ?? 0) !== 0 || (v['5D'] ?? 0) !== 0 || (v['20D'] ?? 0) !== 0);
      };

      const isMeaningfulSnapshot = snapshot
        && (
          snapshot.backtest.dates.length > 0
          || snapshot.portfolio.expected_return !== 0
          || snapshot.portfolio.volatility !== 0
          || snapshot.portfolio.sharpe_ratio !== 0
          || hasSignalData(snapshot.signals)
        );

      if (isMeaningfulSnapshot) {
        if (requestId !== latestRequestIdRef.current) return;
        setPortfolioData(snapshot.portfolio);
        setBacktestData(snapshot.backtest);
        setSignalsData(snapshot.signals);
        lastLoadedQueryRef.current = queryKey;
        window.localStorage.setItem('qa_last_snapshot', JSON.stringify(snapshot));
        setError(null);
      } else {
        if (requestId !== latestRequestIdRef.current) return;
        if (hasVisibleDataRef.current) {
          if (queryKey !== lastLoadedQueryRef.current) {
            setError(`Could not load new settings in ${Math.round(timeoutMs / 1000)}s. Dashboard is still showing previous loaded range.`);
          } else {
            setError(null);
          }
        } else if (queryKey !== lastLoadedQueryRef.current) {
          setError(`Could not load new settings in ${Math.round(timeoutMs / 1000)}s. No fresh data available for this range yet.`);
        } else {
          const cached = readCachedSnapshot();
          if (cached) {
            setPortfolioData(cached.portfolio);
            setBacktestData(cached.backtest);
            setSignalsData(cached.signals);
            setError(`Live data timed out at ${Math.round(timeoutMs / 1000)}s. Showing cached snapshot.`);
          } else {
            setError(`Timed out at ${Math.round(timeoutMs / 1000)}s. Reduce date range/tickers.`);
          }
        }
      }
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
        setBlockingLoad(false);
      }
    }
  }, [appliedSettings.tickers, appliedSettings.start_date, appliedSettings.end_date]);

  useEffect(() => {
    hasVisibleDataRef.current = Boolean(portfolioData || backtestData || signalsData);
  }, [portfolioData, backtestData, signalsData]);

  useEffect(() => {
    const cached = readCachedSnapshot();
    if (cached) {
      setPortfolioData(cached.portfolio);
      setBacktestData(cached.backtest);
      setSignalsData(cached.signals);
    }
    fetchData({ blocking: true });
  }, [fetchData]);

  useEffect(() => {
    if (!appliedSettings.refreshSeconds || appliedSettings.refreshSeconds <= 0) return;
    const id = window.setInterval(() => {
      fetchData({ blocking: false });
    }, appliedSettings.refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [appliedSettings.refreshSeconds, fetchData]);

  const computeDrawdown = (curve: number[]) => {
    let peak = -Infinity;
    return curve.map((value) => {
      peak = Math.max(peak, value);
      return peak > 0 ? (value / peak) - 1 : 0;
    });
  };

  const computeRollingSharpe = (curve: number[], windowSize = 63) => {
    if (curve.length < windowSize + 1) return [] as number[];
    const returns = curve.slice(1).map((value, index) => (value / curve[index]) - 1);
    const output: number[] = [];

    for (let index = 0; index < returns.length; index += 1) {
      if (index < windowSize - 1) {
        output.push(NaN);
        continue;
      }

      const slice = returns.slice(index - windowSize + 1, index + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + (b - mean) * (b - mean), 0) / slice.length;
      const std = Math.sqrt(variance);
      output.push(std > 0 ? (mean / std) * Math.sqrt(252) : 0);
    }

    return output;
  };

  const applyDatePresetYears = (years: number) => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
      .toISOString()
      .slice(0, 10);
    setDraftSettings((settings) => ({ ...settings, start_date: start, end_date: end }));
  };

  const normalizeTickers = (raw: string) =>
    raw
      .split(',')
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean)
      .join(',');

  const getDatePresetRange = (years: number) => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
      .toISOString()
      .slice(0, 10);
    return { start, end };
  };

  const presetButtonClass = (selected: boolean) =>
    selected ? 'preset-button preset-button-active' : 'preset-button';

  const draftTickerCount = normalizeTickers(draftSettings.tickers).split(',').filter(Boolean).length;
  const draftYears = (() => {
    const startMs = draftSettings.start_date ? Date.parse(draftSettings.start_date) : NaN;
    const endMs = draftSettings.end_date ? Date.parse(draftSettings.end_date) : NaN;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 1;
    return (endMs - startMs) / (1000 * 60 * 60 * 24 * 365);
  })();
  const isHeavyDraftQuery =
    (draftTickerCount >= 7 && draftYears >= 5)
    || (draftTickerCount >= 10 && draftYears >= 3)
    || (draftTickerCount >= 5 && draftYears >= 10);

  const applySmartDefaults = () => {
    applyDatePresetYears(1);
    setDraftSettings((settings) => ({
      ...settings,
      tickers: DEFAULT_FAST_TICKERS,
      refreshSeconds: 60,
    }));
  };

  const hasUsablePortfolioData = Boolean(
    portfolioData
    && (
      portfolioData.expected_return !== 0
      || portfolioData.volatility !== 0
      || portfolioData.sharpe_ratio !== 0
      || Object.values(portfolioData.risk_contribution || {}).some((value) => value !== 0)
    )
  );

  const hasUsableBacktestData = Boolean(
    backtestData
    && backtestData.dates.length > 0
    && backtestData.portfolio_curve.length > 0
  );

  if (blockingLoad) {
    return (
      <div className="app-shell">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main className="app-main">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {activePage === 'dashboard' && (
          <div className="stack-lg fade-in-up">
            {signalsData && <BestPick signals={signalsData} />}
            {signalsData && <MarketPulsePanel signals={signalsData} />}
            {hasUsablePortfolioData && portfolioData && <PortfolioOverview data={portfolioData} />}
            {hasUsableBacktestData && backtestData && <BacktestChart data={backtestData} />}
            {!hasUsablePortfolioData && !hasUsableBacktestData && signalsData && (
              <div className="glass-effect panel alert-warning">
                Portfolio optimization and backtest data are unavailable for this range right now.
                Research signals are still shown from the loaded universe.
              </div>
            )}
            {signalsData && <ResearchSignalsComponent data={signalsData} />}
            {!signalsData && !portfolioData && !backtestData && (
              <div className="glass-effect panel muted-text-strong">
                No data loaded yet. Try fewer tickers or a shorter date range, then click Apply.
              </div>
            )}
          </div>
        )}

        {activePage === 'analytics' && (
          <div className="stack-lg fade-in-up">
            <div className="glass-effect panel hover-glow">
              <div className="floating-orb orb-top-right orb-large orb-fuchsia"></div>
              <div className="floating-orb orb-bottom-left orb-large orb-sky"></div>
              <div>
                <h2 className="title-xl">Analytics</h2>
                <p className="section-blurb">Real performance diagnostics from your current backtest.</p>
              </div>
            </div>

            {backtestData && (
              <div className="glass-effect panel">
                <h3 className="title-lg" style={{ marginBottom: '1rem' }}>Drawdown</h3>
                <div className="chart-shell chart-shell-short">
                  <Plot
                    data={[
                      {
                        x: backtestData.dates,
                        y: computeDrawdown(backtestData.portfolio_curve),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Portfolio DD',
                        line: { color: 'rgba(239,68,68,1)', width: 2 },
                        fill: 'tozeroy',
                        fillcolor: 'rgba(239,68,68,0.12)',
                      },
                    ] as any}
                    layout={{
                      autosize: true,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      margin: { l: 48, r: 18, t: 10, b: 40 },
                      xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' }, tickformat: '.0%' },
                      legend: { orientation: 'h', font: { color: 'rgba(255,255,255,0.75)' } },
                    } as any}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                </div>
              </div>
            )}

            {backtestData && (
              <div className="glass-effect panel">
                <h3 className="title-lg" style={{ marginBottom: '1rem' }}>Rolling Sharpe (63d)</h3>
                <div className="chart-shell chart-shell-short">
                  <Plot
                    data={[
                      {
                        x: backtestData.dates.slice(1),
                        y: computeRollingSharpe(backtestData.portfolio_curve, 63),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Sharpe',
                        line: { color: 'rgba(34,197,94,1)', width: 2 },
                      },
                    ] as any}
                    layout={{
                      autosize: true,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      margin: { l: 48, r: 18, t: 10, b: 40 },
                      xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      legend: { orientation: 'h', font: { color: 'rgba(255,255,255,0.75)' } },
                    } as any}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === 'settings' && (
          <div className="stack-lg fade-in-up">
            <div className="glass-effect panel hover-glow">
              <h2 className="title-xl">Settings</h2>
              <p className="section-blurb">Edit values, use presets, then click Apply.</p>

              <div className="settings-grid">
                <div className="subpanel">
                  <div className="title-md" style={{ marginBottom: '0.75rem' }}>Universe Presets</div>
                  <div className="chip-group">
                    {Object.entries(PRESET_UNIVERSES).map(([label, tickers]) => (
                      <button
                        key={label}
                        type="button"
                        className={presetButtonClass(normalizeTickers(draftSettings.tickers) === normalizeTickers(tickers))}
                        onClick={() => setDraftSettings((settings) => ({ ...settings, tickers }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="subpanel">
                  <div className="title-md" style={{ marginBottom: '0.75rem' }}>Date Presets</div>
                  <div className="chip-group">
                    {[1, 3, 5, 10, 20].map((years) => (
                      <button
                        key={years}
                        type="button"
                        className={presetButtonClass(
                          draftSettings.start_date === getDatePresetRange(years).start
                          && draftSettings.end_date === getDatePresetRange(years).end
                        )}
                        onClick={() => applyDatePresetYears(years)}
                      >
                        {years}Y
                      </button>
                    ))}
                  </div>
                </div>

                <div className="subpanel">
                  <div className="title-md" style={{ marginBottom: '0.75rem' }}>Refresh Presets</div>
                  <div className="chip-group">
                    {[0, 30, 60, 120].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        className={presetButtonClass(draftSettings.refreshSeconds === seconds)}
                        onClick={() => setDraftSettings((settings) => ({ ...settings, refreshSeconds: seconds }))}
                      >
                        {seconds === 0 ? 'Off' : `${seconds}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="field-grid">
                <div>
                  <label className="form-label">Tickers (comma-separated)</label>
                  <input
                    className="input-field"
                    placeholder="AAPL,MSFT,NVDA"
                    value={draftSettings.tickers}
                    onChange={(event) => setDraftSettings((settings) => ({ ...settings, tickers: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Refresh interval (seconds)</label>
                  <input
                    className="input-field"
                    type="number"
                    min={0}
                    placeholder="0 (off)"
                    value={draftSettings.refreshSeconds}
                    onChange={(event) => setDraftSettings((settings) => ({ ...settings, refreshSeconds: Number(event.target.value) }))}
                  />
                </div>

                <div>
                  <label className="form-label">Start date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={draftSettings.start_date}
                    onChange={(event) => setDraftSettings((settings) => ({ ...settings, start_date: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">End date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={draftSettings.end_date}
                    onChange={(event) => setDraftSettings((settings) => ({ ...settings, end_date: event.target.value }))}
                  />
                </div>
              </div>

              {isHeavyDraftQuery && (
                <div className="alert alert-warning" style={{ marginTop: '1.25rem' }}>
                  This combination is too heavy for free market data. Keep one side smaller:
                  fewer companies or a shorter date range.
                </div>
              )}

              <div className="controls-row">
                <button
                  type="button"
                  className={presetButtonClass(
                    normalizeTickers(draftSettings.tickers) === normalizeTickers(DEFAULT_FAST_TICKERS)
                    && (() => {
                      const range = getDatePresetRange(1);
                      return draftSettings.start_date === range.start && draftSettings.end_date === range.end;
                    })()
                    && draftSettings.refreshSeconds === 60
                  )}
                  onClick={applySmartDefaults}
                >
                  Smart Defaults
                </button>

                <button
                  type="button"
                  className={`button button-primary ${isHeavyDraftQuery ? 'button-disabled' : ''}`.trim()}
                  disabled={isHeavyDraftQuery}
                  onClick={() => {
                    setPortfolioData(null);
                    setBacktestData(null);
                    setSignalsData(null);
                    setBlockingLoad(true);
                    setLoading(true);
                    setError(null);
                    setAppliedSettings({ ...draftSettings });
                    setActivePage('dashboard');
                  }}
                >
                  Apply
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDraftSettings({ ...appliedSettings })}
                >
                  Reset
                </button>

                <div className="applied-summary">
                  Applied: {appliedSettings.tickers || '(default)'} | {appliedSettings.start_date || '(default)'} to {appliedSettings.end_date || '(default)'}
                </div>
              </div>

              <div className="tip-text">
                Tip: Smart Defaults = 3-ticker universe + 1Y range + 60s refresh.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
