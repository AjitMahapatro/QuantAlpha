import React, { useCallback, useEffect, useState } from 'react';
import { PortfolioOverview } from './components/PortfolioOverview';
import { BacktestChart } from './components/BacktestChart';
import { ResearchSignalsComponent } from './components/ResearchSignals';
import { BestPick } from './components/BestPick';
import { BestPickCandlestick } from './components/BestPickCandlestick';
import { Header, type HeaderPage } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { apiService } from './services/api';
import { PortfolioData, BacktestData, ResearchSignals as ISignals } from './types';
import Plot from 'react-plotly.js';
import { computePick } from './utils/pickUtils';

function App() {
  const [activePage, setActivePage] = useState<HeaderPage>('dashboard');
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestData | null>(null);
  const [signalsData, setSignalsData] = useState<ISignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedSettings, setAppliedSettings] = useState({
    tickers: '',
    start_date: '',
    end_date: '',
    refreshSeconds: 0,
  });

  const [draftSettings, setDraftSettings] = useState({
    tickers: '',
    start_date: '',
    end_date: '',
    refreshSeconds: 0,
  });

  const [ohlc, setOhlc] = useState<{
    dates: string[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        tickers: appliedSettings.tickers || undefined,
        start_date: appliedSettings.start_date || undefined,
        end_date: appliedSettings.end_date || undefined,
      };

      const [portfolio, backtest, signals] = await Promise.all([
        apiService.getPortfolio(params),
        apiService.getBacktest(params),
        apiService.getResearch(params)
      ]);

      setPortfolioData(portfolio);
      setBacktestData(backtest);
      setSignalsData(signals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [appliedSettings.tickers, appliedSettings.start_date, appliedSettings.end_date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!appliedSettings.refreshSeconds || appliedSettings.refreshSeconds <= 0) return;
    const id = window.setInterval(() => {
      fetchData();
    }, appliedSettings.refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [appliedSettings.refreshSeconds, fetchData]);

  useEffect(() => {
    const ticker = (appliedSettings.tickers || 'AAPL').split(',')[0]?.trim() || 'AAPL';
    const params = {
      ticker,
      start_date: appliedSettings.start_date || undefined,
      end_date: appliedSettings.end_date || undefined,
      interval: '1d',
    };
    apiService.getOhlc(params)
      .then(setOhlc)
      .catch(() => setOhlc(null));
  }, [appliedSettings.tickers, appliedSettings.start_date, appliedSettings.end_date]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main className="container mx-auto px-4 py-8">
        {activePage === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {signalsData && <BestPick signals={signalsData} />}
            {signalsData && computePick(signalsData) && (
              <BestPickCandlestick
                ticker={computePick(signalsData)!.ticker}
                startDate={appliedSettings.start_date || undefined}
                endDate={appliedSettings.end_date || undefined}
              />
            )}
            {portfolioData && <PortfolioOverview data={portfolioData} />}
            {backtestData && <BacktestChart data={backtestData} />}
            {signalsData && <ResearchSignalsComponent data={signalsData} />}
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

            {ohlc && ohlc.dates.length > 0 && (
              <div className="glass-effect rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Candlestick (1D) - {((appliedSettings.tickers || 'AAPL').split(',')[0] || 'AAPL').trim().toUpperCase()}</h3>
                <div className="h-[28rem]">
                  <Plot
                    data={[
                      {
                        x: ohlc.dates,
                        open: ohlc.open,
                        high: ohlc.high,
                        low: ohlc.low,
                        close: ohlc.close,
                        type: 'candlestick',
                        name: 'OHLC',
                        increasing: { line: { color: 'rgba(34,197,94,1)' } },
                        decreasing: { line: { color: 'rgba(239,68,68,1)' } },
                      },
                    ] as any}
                    layout={{
                      autosize: true,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      margin: { l: 48, r: 18, t: 10, b: 40 },
                      xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      showlegend: false,
                    } as any}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                </div>

                <div className="h-56 mt-6">
                  <Plot
                    data={[
                      {
                        x: ohlc.dates,
                        y: ohlc.volume,
                        type: 'bar',
                        name: 'Volume',
                        marker: { color: 'rgba(148,163,184,0.6)' },
                      },
                    ] as any}
                    layout={{
                      autosize: true,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      margin: { l: 48, r: 18, t: 10, b: 40 },
                      xaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickfont: { color: 'rgba(255,255,255,0.7)' } },
                      showlegend: false,
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
              <p className="text-white/70 mt-2">Edit values, then click Apply. No more refresh on every keypress.</p>

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
                  className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/20 text-white border border-white/20"
                  onClick={() => setAppliedSettings({ ...draftSettings })}
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
                Tip: leave fields blank to use backend defaults.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
