// app/stats/utils/stats.ts
import * as ss from "simple-statistics";

export type Row = Record<string, any>;

export const isFiniteNum = (v: any) => typeof v === "number" && Number.isFinite(v);

export function toNumeric(arr: any[]) {
  return arr.map(v => (typeof v === "string" && v.trim() !== "" ? +v : v))
            .map(v => (Number.isFinite(v) ? v : NaN));
}

export function getNumericColumns(rows: Row[], maxUniqueCategorical = 20) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0] ?? {});
  return keys.filter(k => {
    const vals = rows.map(r => r?.[k]).filter(v => v !== null && v !== undefined);
    const nums = vals.filter(v => typeof v === "number" || (!isNaN(+v) && v !== ""));
    // відкидаємо "категоріальні числові" з дуже малою кількістю унікальних значень
    const uniq = new Set(nums.map(Number)).size;
    return nums.length >= Math.max(5, 0.5 * vals.length) && uniq > maxUniqueCategorical;
  });
}

export type DescribeRow = {
  variable: string;
  n: number;
  missing: number;
  mean: number | null;
  sd: number | null;
  min: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max: number | null;
  iqr: number | null;
  zeros: number;
  negatives: number;
  skewness: number | null;
  kurtosis: number | null;
  outliersIQR: number; // |x - median| > 1.5*IQR
};

export function describeDataset(rows: Row[]): DescribeRow[] {
  const cols = getNumericColumns(rows);
  return cols.map(col => {
    const raw = rows.map(r => r?.[col]);
    const nums = toNumeric(raw).filter(v => Number.isFinite(v)) as number[];
    const n = nums.length;
    const missing = rows.length - n;
    if (!n) {
      return {
        variable: col, n: 0, missing,
        mean: null, sd: null, min: null, q1: null, median: null, q3: null, max: null,
        iqr: null, zeros: 0, negatives: 0, skewness: null, kurtosis: null, outliersIQR: 0
      };
    }
    const sorted = [...nums].sort((a,b)=>a-b);
    const min = sorted[0], max = sorted[sorted.length-1];
    const q1 = ss.quantileSorted(sorted, 0.25);
    const median = ss.medianSorted(sorted);
    const q3 = ss.quantileSorted(sorted, 0.75);
    const iqr = q3 - q1;
    const mean = ss.mean(nums);
    const sd = nums.length > 1 ? ss.sampleStandardDeviation(nums) : 0;
    const zeros = nums.filter(v => v === 0).length;
    const negatives = nums.filter(v => v < 0).length;
    const skewness = nums.length > 2 ? ss.sampleSkewness(nums) : 0;
    const kurtosis = nums.length > 3 ? ss.sampleKurtosis(nums) : 0;
    const outliersIQR = nums.filter(v => Math.abs(v - median) > 1.5 * iqr).length;

    return {
      variable: col, n, missing,
      mean, sd, min, q1, median, q3, max, iqr, zeros, negatives, skewness, kurtosis, outliersIQR
    };
  });
}

// ---------------- Correlation ----------------

function rankWithTies(values: number[]) {
  const idx = values.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v);
  const ranks = new Array(values.length).fill(0);
  let i = 0;
  while (i < idx.length) {
    let j = i+1;
    while (j < idx.length && idx[j].v === idx[i].v) j++;
    const avg = (i + j - 1) / 2 + 1; // 1-based середній ранг
    for (let k=i; k<j; k++) ranks[idx[k].i] = avg;
    i = j;
  }
  return ranks;
}

export type CorrMethod = "pearson" | "spearman";

export function correlationMatrix(rows: Row[], cols?: string[], method: CorrMethod = "pearson") {
  const variables = cols && cols.length ? cols : getNumericColumns(rows);
  const nVar = variables.length;
  const Z: number[][] = Array.from({length: nVar}, ()=>Array(nVar).fill(1));

  // попарно поєднуємо, фільтруючи нечислові/NaN
  for (let a=0; a<nVar; a++) {
    for (let b=a; b<nVar; b++) {
      const xa: number[] = [];
      const xb: number[] = [];
      for (const r of rows) {
        const va = Number(r?.[variables[a]]);
        const vb = Number(r?.[variables[b]]);
        if (Number.isFinite(va) && Number.isFinite(vb)) {
          xa.push(va); xb.push(vb);
        }
      }
      let r = 1;
      if (xa.length > 1) {
        if (method === "pearson") {
          r = ss.sampleCorrelation(xa, xb);
        } else {
          const ra = rankWithTies(xa);
          const rb = rankWithTies(xb);
          r = ss.sampleCorrelation(ra, rb);
        }
      }
      Z[a][b] = r;
      Z[b][a] = r;
    }
  }
  return { labels: variables, z: Z };
}
