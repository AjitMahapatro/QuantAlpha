import type { ResearchSignals } from '../types';

type Pick = {
  ticker: string;
  score: number;
  confidence: number;
  s1d: number;
  s5d: number;
  s20d: number;
};

export const computePick = (signals: ResearchSignals): Pick | null => {
  const entries = Object.entries(signals);
  if (entries.length === 0) return null;

  // Filter to tickers with at least some real return signal data (not all zeros)
  // Note: Confidence is always non-zero (random 60-95), so we don't use it for filtering
  const validEntries = entries.filter(([, s]) =>
    (s['1D'] !== 0 || s['5D'] !== 0 || s['20D'] !== 0)
  );

  const candidates = validEntries.length > 0 ? validEntries : entries;

  let best: Pick | null = null;

  for (const [ticker, s] of candidates) {
    const s1d = s['1D'] ?? 0;
    const s5d = s['5D'] ?? 0;
    const s20d = s['20D'] ?? 0;
    const confidence = s['Confidence'] ?? 0;

    const score = 0.2 * s1d + 0.3 * s5d + 0.5 * s20d + 0.02 * confidence;

    const candidate: Pick = { ticker, score, confidence, s1d, s5d, s20d };

    if (!best) {
      best = candidate;
      continue;
    }

    if (candidate.score > best.score) {
      best = candidate;
      continue;
    }

    if (candidate.score === best.score && candidate.confidence > best.confidence) {
      best = candidate;
    }
  }

  // If the best pick has all-zero signals, fall back to MSFT (known to have data)
  if (best && best.s1d === 0 && best.s5d === 0 && best.s20d === 0) {
    const fallback = signals['MSFT'];
    if (fallback && (fallback['1D'] !== 0 || fallback['5D'] !== 0 || fallback['20D'] !== 0)) {
      return {
        ticker: 'MSFT',
        score: 0.2 * (fallback['1D'] ?? 0) + 0.3 * (fallback['5D'] ?? 0) + 0.5 * (fallback['20D'] ?? 0) + 0.02 * (fallback['Confidence'] ?? 0),
        confidence: fallback['Confidence'] ?? 0,
        s1d: fallback['1D'] ?? 0,
        s5d: fallback['5D'] ?? 0,
        s20d: fallback['20D'] ?? 0,
      };
    }
    // If MSFT also has no data, try NVDA
    const nvda = signals['NVDA'];
    if (nvda && (nvda['1D'] !== 0 || nvda['5D'] !== 0 || nvda['20D'] !== 0)) {
      return {
        ticker: 'NVDA',
        score: 0.2 * (nvda['1D'] ?? 0) + 0.3 * (nvda['5D'] ?? 0) + 0.5 * (nvda['20D'] ?? 0) + 0.02 * (nvda['Confidence'] ?? 0),
        confidence: nvda['Confidence'] ?? 0,
        s1d: nvda['1D'] ?? 0,
        s5d: nvda['5D'] ?? 0,
        s20d: nvda['20D'] ?? 0,
      };
    }
  }

  return best;
};
