// app/stats/components/stats-utils.ts
'use client';

export type CorrMethod = 'pearson' | 'spearman';

export const toNum = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(',', '.').trim();
  if (s === '' || s.toLowerCase() === 'na') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;

export const std = (a: number[]) => {
  const n = a.length;
  if (n < 2) return NaN;
  const m = mean(a);
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1);
  return Math.sqrt(v);
};

export const quantile = (a: number[], p: number) => {
  if (!a.length) return NaN;
  const arr = [...a].sort((x, y) => x - y);
  const idx = (arr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return arr[lo];
  const t = idx - lo;
  return arr[lo] * (1 - t) + arr[hi] * t;
};

export function rankify(values: number[]): number[] {
  // average ranks, ties handled
  const idx = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = Array(values.length).fill(0);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
    const avg = (i + j + 2) / 2; // 1-based average rank
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avg;
    i = j + 1;
  }
  return ranks;
}

/** Стандартна нормальна CDF */
export function phi(z: number): number {
  // Abramowitz–Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const p =
    1 -
    d *
      (0.319381530 * t -
        0.356563782 * t ** 2 +
        1.781477937 * t ** 3 -
        1.821255978 * t ** 4 +
        1.330274429 * t ** 5);
  return z >= 0 ? p : 1 - p;
}

/** p-value для r за Fisher z: z=atanh(r), se=1/sqrt(n-3), p=2*(1-Phi(|z|/se)) */
export function pvalFromR(r: number, n: number): number {
  if (!Number.isFinite(r) || n <= 3 || Math.abs(r) >= 1) return NaN;
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const z0 = Math.abs(z) * Math.sqrt(n - 3);
  const p = 2 * (1 - phi(z0));
  return Math.max(0, Math.min(1, p));
}

/** FDR Benjamini–Hochberg */
export function fdrBH(p: number[]): number[] {
  const m = p.length;
  const arr = p.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array(m).fill(1);
  let prev = 1;
  for (let k = m; k >= 1; k--) {
    const [pv, i] = arr[k - 1];
    const val = Math.min(prev, (pv * m) / k);
    out[i] = val;
    prev = val;
  }
  return out;
}

/** Кореляція та p-value */
export function correlation(
  xRaw: any[],
  yRaw: any[],
  method: CorrMethod = 'pearson'
): { r: number; p: number; n: number } {
  const xs0: number[] = [];
  const ys0: number[] = [];
  for (let i = 0; i < Math.min(xRaw.length, yRaw.length); i++) {
    const xi = toNum(xRaw[i]);
    const yi = toNum(yRaw[i]);
    if (xi !== null && yi !== null) {
      xs0.push(xi);
      ys0.push(yi);
    }
  }
  const n = xs0.length;
  if (n < 4) return { r: NaN, p: NaN, n };

  const xs = method === 'spearman' ? rankify(xs0) : xs0;
  const ys = method === 'spearman' ? rankify(ys0) : ys0;

  const mx = mean(xs);
  const my = mean(ys);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const r = num / Math.sqrt(dx * dy);
  const p = pvalFromR(r, n);
  return { r, p, n };
}

export const fmt = (x: number, digits = 3) =>
  Number.isFinite(x) ? x.toFixed(digits) : '—';
