import React, { startTransition, useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { apiService } from './services/api';
import { AnalyticsSnapshot } from './types';

type PageKey =
  | 'market'
  | 'portfolio'
  | 'risk'
  | 'forecasting'
  | 'backtesting'
  | 'macro';

const pages: Array<{ key: PageKey; label: string }> = [
  { key: 'market', label: 'Market Overview' },
  { key: 'portfolio', label: 'Portfolio Analytics' },
  { key: 'risk', label: 'Risk Analysis' },
  { key: 'forecasting', label: 'ML Forecasting' },
  { key: 'backtesting', label: 'Backtesting Results' },
  { key: 'macro', label: 'Economic Indicators' },
];

const defaultRange = () => {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  return { start, end };
};

const metricLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const percentMetricKeys = new Set([
  'cumulative_return',
  'cagr',
  'alpha',
  'max_drawdown',
  'rolling_volatility',
  'annualized_volatility',
  'annual_return',
  'annual_volatility',
]);

const chartLayout = {
  autosize: true,
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  margin: { l: 42, r: 16, t: 12, b: 36 },
  font: { color: '#1f2937', family: 'IBM Plex Sans, Segoe UI, sans-serif', size: 12 },
  hovermode: 'x unified' as const,
  xaxis: {
    gridcolor: '#e5e7eb',
    zerolinecolor: '#e5e7eb',
    tickangle: -45,
    automargin: true,
  },
  yaxis: {
    gridcolor: '#e5e7eb',
    zerolinecolor: '#e5e7eb',
    automargin: true,
  },
  legend: { orientation: 'h' as const, y: -0.22, x: 0, traceorder: 'normal' as const },
};

const chartHeights = {
  default: 420,
  compact: 340,
  large: 460,
};

const plotConfig = { displayModeBar: false, responsive: true };
const plotStyle = { width: '100%', height: '100%' } as const;

const buildLayout = (overrides: Record<string, any> = {}) => ({
  ...chartLayout,
  ...overrides,
  xaxis: { ...chartLayout.xaxis, ...(overrides.xaxis || {}) },
  yaxis: { ...chartLayout.yaxis, ...(overrides.yaxis || {}) },
  legend: { ...chartLayout.legend, ...(overrides.legend || {}) },
});

const normalizeSeries = (series: Record<string, number[]>) =>
  Object.fromEntries(
    Object.entries(series).map(([seriesName, values]) => {
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance) || 1;
      return [seriesName, values.map((value) => (value - mean) / std)];
    }),
  ) as Record<string, number[]>;

function App() {
  const range = useMemo(() => defaultRange(), []);
  const [activePage, setActivePage] = useState<PageKey>('market');
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickers, setTickers] = useState('AAPL,MSFT,NVDA,JPM,XOM');
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSnapshot({
        tickers,
        start_date: startDate,
        end_date: endDate,
      });
      startTransition(() => {
        setSnapshot(data);
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load analytics snapshot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const renderMetricCards = (metrics: Record<string, number>) => (
    <div className="metric-grid">
      {Object.entries(metrics).map(([key, value]) => (
        <article className="metric-card" key={key}>
          <div className="metric-label">{metricLabel(key)}</div>
          <div className="metric-value">
            {percentMetricKeys.has(key) ? `${(value * 100).toFixed(2)}%` : value.toFixed(3)}
          </div>
        </article>
      ))}
    </div>
  );

  const renderMarketPage = () => {
    if (!snapshot) return null;
    const market = snapshot.market_overview;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Universe Performance</h2>
            <p>Cumulative return paths for the selected research universe.</p>
          </div>
          <div className="plot-card">
            <Plot
              data={Object.entries(market.cumulative_returns).map(([ticker, values]) => ({
                x: market.dates,
                y: values,
                type: 'scatter',
                mode: 'lines',
                line: { shape: 'spline', smoothing: 1.1 },
                connectgaps: true,
                name: ticker,
              }))}
              layout={buildLayout({ height: chartHeights.default, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' }, yaxis: { tickformat: '.0%' }, hovermode: 'x unified' })}
              config={plotConfig}
              style={plotStyle}
              useResizeHandler
            />
          </div>
        </section>

        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Rolling Portfolio Volatility</h2>
              <p>21-day annualized volatility for an equal-weight portfolio.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: market.dates,
                  y: market.rolling_volatility,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Volatility',
                  line: { color: '#1d4ed8', shape: 'spline', smoothing: 1.1 },
                }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' }, yaxis: { tickformat: '.0%' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Return Correlation</h2>
              <p>Cross-asset daily return correlation matrix.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: market.correlation.labels,
                  y: market.correlation.labels,
                  z: market.correlation.matrix,
                  type: 'heatmap',
                  colorscale: 'Blues',
                  xgap: 2,
                  ygap: 2,
                  hovertemplate: '%{y} / %{x}: %{z}<extra></extra>',
                }]}
                layout={buildLayout({ height: chartHeights.compact, margin: { l: 40, r: 16, t: 12, b: 40 }, xaxis: { tickangle: -45 } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Latest Prices</h2>
            <p>Most recent close pulled from the historical data window.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Latest Close</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(market.latest_prices).map(([ticker, price]) => (
                  <tr key={ticker}>
                    <td>{ticker}</td>
                    <td>{price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderPortfolioPage = () => {
    if (!snapshot) return null;
    const portfolio = snapshot.portfolio_analytics;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Portfolio Performance Metrics</h2>
            <p>Equal-weight baseline portfolio metrics computed from daily returns.</p>
          </div>
          {renderMetricCards(portfolio.metrics)}
        </section>
        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Weight Allocation</h2>
              <p>Simple equal-weight portfolio used as the analytical baseline.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{ labels: Object.keys(portfolio.weights), values: Object.values(portfolio.weights), type: 'pie', hole: 0.45 }]}
                layout={buildLayout({ height: chartHeights.compact, margin: { l: 12, r: 12, t: 12, b: 12 } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Risk Contribution</h2>
              <p>Relative contribution based on component return volatility.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{ x: Object.keys(portfolio.risk_contribution), y: Object.values(portfolio.risk_contribution), type: 'bar', marker: { color: '#2563eb' } }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { type: 'category', title: 'Ticker' }, yaxis: { ...chartLayout.yaxis, title: 'Risk Contribution', tickformat: '.1f' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Ticker Summary</h2>
            <p>Per-asset return and volatility profile for the selected window.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Annual Return</th>
                  <th>Annual Volatility</th>
                  <th>Cumulative Return</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.ticker_summary.map((row) => (
                  <tr key={row.ticker}>
                    <td>{row.ticker}</td>
                    <td>{(row.annual_return * 100).toFixed(2)}%</td>
                    <td>{(row.annual_volatility * 100).toFixed(2)}%</td>
                    <td>{(row.cumulative_return * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderRiskPage = () => {
    if (!snapshot) return null;
    const risk = snapshot.risk_analysis;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Risk Metrics</h2>
            <p>Core downside, relative performance, and volatility diagnostics.</p>
          </div>
          {renderMetricCards({ ...risk.metrics, var_95: risk.var_95, cvar_95: risk.cvar_95 })}
        </section>
        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Drawdown Curve</h2>
              <p>Peak-to-trough loss profile for the equal-weight portfolio.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: risk.drawdown_dates,
                  y: risk.drawdown_curve,
                  type: 'scatter',
                  mode: 'lines',
                  fill: 'tozeroy',
                  name: 'Drawdown',
                  line: { color: '#b91c1c', shape: 'spline', smoothing: 1.1 },
                }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' }, yaxis: { ...chartLayout.yaxis, tickformat: '.0%' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Return Distribution</h2>
              <p>Daily return histogram for quick tail-risk inspection.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{ x: risk.return_distribution, type: 'histogram', marker: { color: '#0f766e' } }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { ...chartLayout.xaxis, tickformat: '.1%' }, yaxis: { title: 'Frequency' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderForecastingPage = () => {
    if (!snapshot) return null;
    const forecasting = snapshot.ml_forecasting;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Market Trend Forecasting Experiment</h2>
            <p>
              Chronological train/test split on {forecasting.ticker}. This module explores whether technical and macroeconomic indicators provide useful signals for short-term market direction using a leakage-aware time-series workflow.
              while avoiding temporal leakage.
            </p>
          </div>
          {renderMetricCards(forecasting.metrics)}
          <div className="insight-strip">
            <div>
              <strong>Latest prediction date:</strong> {forecasting.prediction.date}
            </div>
            <div>
              <strong>Probability of upward move:</strong> {(forecasting.prediction.probability_up * 100).toFixed(2)}%
            </div>
            <div>
              <strong>Prediction confidence:</strong> {(forecasting.prediction.confidence * 100).toFixed(2)}%
            </div>
          </div>
        </section>
        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Feature Importance</h2>
              <p>Model-level importance for the engineered technical and macro features.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: forecasting.feature_importance.slice().sort((a, b) => b.importance - a.importance).map((row) => row.importance),
                  y: forecasting.feature_importance.slice().sort((a, b) => b.importance - a.importance).map((row) => row.feature),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#1d4ed8' },
                }]}
                layout={buildLayout({
                  height: chartHeights.compact,
                  margin: { l: 160, r: 16, t: 12, b: 36 },
                  xaxis: { title: 'Importance' },
                })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Local Explanation</h2>
              <p>Per-feature contribution for the latest prediction using XGBoost contribution scores.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: forecasting.shap_values.slice().sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).map((row) => row.contribution),
                  y: forecasting.shap_values.slice().sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).map((row) => row.feature),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#0f766e' },
                }]}
                layout={buildLayout({
                  height: chartHeights.compact,
                  margin: { l: 160, r: 16, t: 12, b: 36 },
                  xaxis: { title: 'Contribution' },
                })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>
        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Prediction Confidence Over Test Window</h2>
              <p>Out-of-sample class probabilities on the held-out time period.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: forecasting.test_dates,
                  y: forecasting.test_probabilities,
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'P(up)',
                  line: { shape: 'spline', smoothing: 1.1 },
                  marker: { size: 4 },
                }]}
                layout={buildLayout({ height: chartHeights.compact, yaxis: { ...chartLayout.yaxis, range: [0, 1], tickformat: '.0%' }, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Confusion Matrix</h2>
              <p>Prediction accuracy split across up and down market classes.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{
                  x: ['Pred Down', 'Pred Up'],
                  y: ['Actual Down', 'Actual Up'],
                  z: forecasting.confusion_matrix,
                  type: 'heatmap',
                  colorscale: 'Greens',
                  xgap: 2,
                  ygap: 2,
                  hovertemplate: '%{y} / %{x}: %{z}<extra></extra>',
                }]}
                layout={buildLayout({ height: chartHeights.compact, margin: { l: 60, r: 16, t: 24, b: 60 }, xaxis: { tickangle: -45 }, yaxis: { automargin: true } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderBacktestingPage = () => {
    if (!snapshot) return null;
    const backtest = snapshot.backtesting;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Strategy Performance</h2>
            <p>Rules-based long-only strategy compared with the benchmark.</p>
          </div>
          {renderMetricCards(backtest.metrics)}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Cumulative Strategy vs Benchmark</h2>
            <p>Signal execution is lagged by one day to keep the backtest realistic.</p>
          </div>
          <div className="plot-card">
            <Plot
              data={[
                { x: backtest.dates, y: backtest.strategy_curve, type: 'scatter', mode: 'lines', name: 'Strategy', line: { shape: 'spline', smoothing: 1.1 } },
                { x: backtest.dates, y: backtest.benchmark_curve, type: 'scatter', mode: 'lines', name: 'Benchmark', line: { shape: 'spline', smoothing: 1.1 } },
              ]}
              layout={buildLayout({ height: chartHeights.default, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' } })}
              config={plotConfig}
              style={plotStyle}
              useResizeHandler
            />
          </div>
        </section>
        <section className="panel two-column">
          <div>
            <div className="panel-head">
              <h2>Backtest Drawdown</h2>
              <p>Portfolio pain profile during adverse periods.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{ x: backtest.dates, y: backtest.drawdown_curve, type: 'scatter', mode: 'lines', fill: 'tozeroy', line: { color: '#b91c1c', shape: 'spline', smoothing: 1.1 } }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' }, yaxis: { ...chartLayout.yaxis, tickformat: '.0%' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Average Signal Strength</h2>
              <p>Share of time each asset was held by the strategy.</p>
            </div>
            <div className="plot-card compact">
              <Plot
                data={[{ x: Object.keys(backtest.signal_strength), y: Object.values(backtest.signal_strength), type: 'bar', marker: { color: '#7c3aed' } }]}
                layout={buildLayout({ height: chartHeights.compact, xaxis: { type: 'category', title: 'Ticker' }, yaxis: { title: 'Signal Share' } })}
                config={plotConfig}
                style={plotStyle}
                useResizeHandler
              />
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Trade Diagnostics</h2>
            <p>Simple counts help explain how active the strategy was per asset.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Entries</th>
                  <th>Exits</th>
                  <th>Average Signal</th>
                </tr>
              </thead>
              <tbody>
                {backtest.trades.map((trade) => (
                  <tr key={trade.ticker}>
                    <td>{trade.ticker}</td>
                    <td>{trade.entries}</td>
                    <td>{trade.exits}</td>
                    <td>{trade.avg_signal.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderMacroPage = () => {
    if (!snapshot) return null;
    const macro = snapshot.economic_indicators;
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Macroeconomic Context</h2>
            <p>FRED series are forward-filled to align with the trading calendar used by the analytics pipeline.</p>
          </div>
          <div className="plot-card">
            <Plot
              data={Object.entries(normalizeSeries(macro.series)).map(([seriesName, values]) => ({
                x: macro.dates,
                y: values,
                type: 'scatter',
                mode: 'lines',
                connectgaps: true,
                line: { shape: 'spline', smoothing: 1.1 },
                name: metricLabel(seriesName),
              }))}
              layout={buildLayout({
                height: chartHeights.default,
                xaxis: { ...chartLayout.xaxis, type: 'date', tickformat: '%b %Y' },
                yaxis: { title: 'Normalized z-score', tickformat: '.1f' },
                margin: { l: 48, r: 16, t: 12, b: 42 },
              })}
              config={plotConfig}
              style={plotStyle}
              useResizeHandler
            />
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">QuantAlpha</div>
          <h1>Quantitative Financial Analytics and Risk Analysis Platform</h1>
          <p>
            A data-science-first workspace for market analysis, portfolio risk, forecasting, and
            strategy evaluation.
          </p>
        </div>
        <div className="filter-card">
          <label>
            Tickers
            <input value={tickers} onChange={(event) => setTickers(event.target.value.toUpperCase())} />
          </label>
          <label>
            Start Date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            End Date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button className="primary-button" onClick={fetchSnapshot} disabled={loading}>
            {loading ? 'Running Analysis...' : 'Run Analysis'}
          </button>
        </div>
      </header>

      <nav className="page-tabs">
        {pages.map((page) => (
          <button
            key={page.key}
            className={page.key === activePage ? 'tab-active' : 'tab-button'}
            onClick={() => setActivePage(page.key)}
          >
            {page.label}
          </button>
        ))}
      </nav>

      {error && <div className="error-banner">{error}</div>}

      {loading && !snapshot ? (
        <div className="empty-state">Running the data pipeline, feature engineering steps, and model evaluation.</div>
      ) : (
        <>
          {snapshot && (
            <section className="summary-strip">
              <div>
                <span>Primary ticker</span>
                <strong>{snapshot.meta.primary_ticker}</strong>
              </div>
              <div>
                <span>Universe</span>
                <strong>{snapshot.meta.tickers.join(', ')}</strong>
              </div>
              <div>
                <span>Date range</span>
                <strong>
                  {snapshot.meta.start_date} to {snapshot.meta.end_date}
                </strong>
              </div>
              <div>
                <span>Benchmark</span>
                <strong>{snapshot.meta.benchmark}</strong>
              </div>
            </section>
          )}

          <main key={activePage} className="content-shell">
            {activePage === 'market' && renderMarketPage()}
            {activePage === 'portfolio' && renderPortfolioPage()}
            {activePage === 'risk' && renderRiskPage()}
            {activePage === 'forecasting' && renderForecastingPage()}
            {activePage === 'backtesting' && renderBacktestingPage()}
            {activePage === 'macro' && renderMacroPage()}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
