import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PortfolioOverview } from './components/PortfolioOverview';
import { BacktestChart } from './components/BacktestChart';
import { ResearchSignalsComponent } from './components/ResearchSignals';
import { BestPick } from './components/BestPick';
import { MarketPulsePanel } from './components/MarketPulsePanel';
import { Header, type HeaderPage } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { apiService } from './services/api';
import { PortfolioData, BacktestData, ResearchSignals as ISignals } from './types';
import Plot from 'react-plotly.js';

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
      // Ignore old cache generated from previous 3-ticker defaults.
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

    // Long ranges need more time, but still avoid indefinite full-screen blocking.
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
          // If user changed settings and load failed, tell them dashboard is still old data.
          if (queryKey !== lastLoadedQueryRef.current) {
            setError(
              `Could not load new settings in ${Math.round(timeoutMs / 1000)}s. Dashboard is still showing previous loaded range.`
            );
          } else {
            setError(null);
          }
        } else {
          // For a new query, do not silently show old cached data.
          if (queryKey !== lastLoadedQueryRef.current) {
            setError(
              `Could not load new settings in ${Math.round(timeoutMs / 1000)}s. No fresh data available for this range yet.`
            );
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
    return curve.map((v) => {
      peak = Math.max(peak, v);
      return peak > 0 ? (v / peak) - 1 : 0;
    });
  };

  const computeRollingSharpe = (curve: number[], windowSize = 63) => {
    if (curve.length < windowSize + 1) return [] as number[];
    const rets = curve.slice(1).map((v, i) => (v / curve[i]) - 1);
    const out: number[] = [];
    for (let i = 0; i < rets.length; i++) {
      if (i < windowSize - 1) {
        out.push(NaN);
        continue;
      }
      const slice = rets.slice(i - windowSize + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + (b - mean) * (b - mean), 0) / slice.length;
      const std = Math.sqrt(variance);
      const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
      out.push(sharpe);
    }
    return out;
  };

  const applyDatePresetYears = (years: number) => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
      .toISOString()
      .slice(0, 10);
    setDraftSettings((s) => ({ ...s, start_date: start, end_date: end }));
  };

  const normalizeTickers = (raw: string) =>
    raw
      .split(',')
      .map((t) => t.trim().toUpperCase())
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
    selected
      ? 'px-3 py-1.5 rounded-lg text-xs border border-cyan-300/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
      : 'px-3 py-1.5 rounded-lg text-xs border border-white/15 bg-white/5 hover:bg-white/10 text-white/80';

  const applySmartDefaults = () => {
    applyDatePresetYears(1);
    setDraftSettings((s) => ({
      ...s,
      tickers: DEFAULT_FAST_TICKERS,
      refreshSeconds: 60,
    }));
  };

  if (blockingLoad) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}
        {activePage === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {signalsData && <BestPick signals={signalsData} />}
            {signalsData && <MarketPulsePanel signals={signalsData} />}
            {portfolioData && <PortfolioOverview data={portfolioData} />}
            {backtestData && <BacktestChart data={backtestData} />}
            {signalsData && <ResearchSignalsComponent data={signalsData} />}
            {!signalsData && !portfolioData && !backtestData && (
              <div className="glass-effect rounded-lg p-6 border border-white/10 text-white/80">
                No data loaded yet. Try fewer tickers or a shorter date range, then click Apply.
              </div>
            )}
          </div>
        )}

        {activePage === 'analytics' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="glass-effect rounded-lg p-6 border border-white/10 relative overflow-hidden hover-glow">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-fuchsia-500/25 blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-500/25 blur-3xl"></div>
              <div className="relative">
                <h2 className="text-2xl font-bold text-white">Analytics</h2>
                <p className="text-white/70 mt-2">Real performance diagnostics from your current backtest.</p>
              </div>
            </div>

            {backtestData && (
              <div className="glass-effect rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Drawdown</h3>
                <div className="h-80">
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
              <div className="glass-effect rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Rolling Sharpe (63d)</h3>
                <div className="h-80">
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
          <div className="space-y-8 animate-fade-in-up">
            <div className="glass-effect rounded-lg p-6 border border-white/10 hover-glow">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-white/70 mt-2">Edit values, use presets, then click Apply.</p>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white mb-3">Universe Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESET_UNIVERSES).map(([label, tickers]) => (
                      <button
                        key={label}
                        type="button"
                        className={presetButtonClass(normalizeTickers(draftSettings.tickers) === normalizeTickers(tickers))}
                        onClick={() => setDraftSettings((s) => ({ ...s, tickers }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white mb-3">Date Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 5, 10, 20].map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={presetButtonClass(
                          draftSettings.start_date === getDatePresetRange(y).start &&
                          draftSettings.end_date === getDatePresetRange(y).end
                        )}
                        onClick={() => applyDatePresetYears(y)}
                      >
                        {y}Y
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white mb-3">Refresh Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {[0, 30, 60, 120].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={presetButtonClass(draftSettings.refreshSeconds === s)}
                        onClick={() => setDraftSettings((d) => ({ ...d, refreshSeconds: s }))}
                      >
                        {s === 0 ? 'Off' : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Tickers (comma-separated)</label>
                  <input
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white outline-none focus:border-white/30"
                    placeholder="AAPL,MSFT,NVDA"
                    value={draftSettings.tickers}
                    onChange={(e) => setDraftSettings((s) => ({ ...s, tickers: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Refresh interval (seconds)</label>
                  <input
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white outline-none focus:border-white/30"
                    type="number"
                    min={0}
                    placeholder="0 (off)"
                    value={draftSettings.refreshSeconds}
                    onChange={(e) => setDraftSettings((s) => ({ ...s, refreshSeconds: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Start date</label>
                  <input
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white outline-none focus:border-white/30"
                    type="date"
                    value={draftSettings.start_date}
                    onChange={(e) => setDraftSettings((s) => ({ ...s, start_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">End date</label>
                  <input
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white outline-none focus:border-white/30"
                    type="date"
                    value={draftSettings.end_date}
                    onChange={(e) => setDraftSettings((s) => ({ ...s, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  className={presetButtonClass(
                    normalizeTickers(draftSettings.tickers) === normalizeTickers(DEFAULT_FAST_TICKERS) &&
                    (() => {
                      const r = getDatePresetRange(1);
                      return draftSettings.start_date === r.start && draftSettings.end_date === r.end;
                    })() &&
                    draftSettings.refreshSeconds === 60
                  )}
                  onClick={applySmartDefaults}
                >
                  Smart Defaults
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/20 text-white border border-white/20"
                  onClick={() => {
                    // Clear visible cards so stale values are never confused as newly applied settings.
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
                  className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/10 text-white/80 border border-white/10"
                  onClick={() => setDraftSettings({ ...appliedSettings })}
                >
                  Reset
                </button>

                <div className="text-sm text-white/60">
                  Applied:
                  {' '}
                  {(appliedSettings.tickers || '(default)')}
                  {' | '}
                  {(appliedSettings.start_date || '(default)')}
                  {' to '}
                  {(appliedSettings.end_date || '(default)')}
                </div>
              </div>

              <div className="mt-6 text-sm text-white/60">
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
