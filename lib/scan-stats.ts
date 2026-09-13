// T12 spike: what a decode trial measures. Kept out of the page so it is testable.

export type Trial = {
  frames: number;
  hits: number;
  decodeMs: number[];
  firstHitMs: number | null;
  codes: Record<string, number>;
};

export const emptyTrial = (): Trial => ({
  frames: 0,
  hits: 0,
  decodeMs: [],
  firstHitMs: null,
  codes: {},
});

/** One decode attempt. `elapsedMs` is time since the trial started, not decode time. */
export function recordFrame(
  trial: Trial,
  { elapsedMs, decodeMs, code }: { elapsedMs: number; decodeMs: number; code?: string },
): Trial {
  return {
    frames: trial.frames + 1,
    hits: trial.hits + (code ? 1 : 0),
    decodeMs: [...trial.decodeMs, decodeMs],
    firstHitMs: trial.firstHitMs ?? (code ? elapsedMs : null),
    codes: code ? { ...trial.codes, [code]: (trial.codes[code] ?? 0) + 1 } : trial.codes,
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarize(trial: Trial) {
  const codes = Object.entries(trial.codes).sort((a, b) => b[1] - a[1]);
  return {
    frames: trial.frames,
    hits: trial.hits,
    // The spike's headline number: share of camera frames that yielded a code.
    hitRate: trial.frames ? trial.hits / trial.frames : 0,
    firstHitMs: trial.firstHitMs,
    medianDecodeMs: median(trial.decodeMs),
    // More than one entry means the decoder disagreed with itself on one package.
    codes: Object.fromEntries(codes),
  };
}
