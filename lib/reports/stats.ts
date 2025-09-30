// lib/reports/stats.ts
export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function pctSummary(values: number[]) {
  const arr = values.slice().sort((a, b) => a - b);
  return {
    p50: Math.round(percentile(arr, 0.5) * 1000) / 1000,
    p75: Math.round(percentile(arr, 0.75) * 1000) / 1000,
    p90: Math.round(percentile(arr, 0.9) * 1000) / 1000,
    p95: Math.round(percentile(arr, 0.95) * 1000) / 1000,
    count: arr.length,
  };
}
