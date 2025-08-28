// app/stats/components/DescribeTable.tsx
'use client';

import React from 'react';
import { mean, std, quantile, toNum, fmt } from './stats-utils';

type Props = {
  data: any[];
  numericCols?: string[];
};

export default function DescribeTable({ data, numericCols }: Props) {
  const cols = React.useMemo(
    () => numericCols ?? inferNumericColumns(data),
    [data, numericCols]
  );

  const rows = React.useMemo(() => {
    return cols.map((c) => {
      const vals: number[] = [];
      let missing = 0;
      for (const r of data) {
        const v = toNum(r[c]);
        if (v === null) missing++;
        else vals.push(v);
      }
      const n = vals.length;
      const m = mean(vals);
      const s = std(vals);
      const med = quantile(vals, 0.5);
      const q1 = quantile(vals, 0.25);
      const q3 = quantile(vals, 0.75);
      const mn = quantile(vals, 0);
      const mx = quantile(vals, 1);
      const missPct = data.length ? (missing / data.length) * 100 : 0;
      return {
        var: c,
        n,
        meanSd: `${fmt(m)} ± ${fmt(s)}`,
        medIqr: `${fmt(med)} (${fmt(q1)}–${fmt(q3)})`,
        minMax: `${fmt(mn)}–${fmt(mx)}`,
        miss: `${fmt(missPct, 1)}%`,
      };
    });
  }, [cols, data]);

  if (!data?.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Описова статистика</h3>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Змінна</th>
              <th className="p-2">n</th>
              <th className="p-2">Mean ± SD</th>
              <th className="p-2">Median (Q1–Q3)</th>
              <th className="p-2">Min–Max</th>
              <th className="p-2">% пропусків</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.var} className="border-t">
                <td className="p-2">{r.var}</td>
                <td className="p-2 text-center">{r.n}</td>
                <td className="p-2 text-center">{r.meanSd}</td>
                <td className="p-2 text-center">{r.medIqr}</td>
                <td className="p-2 text-center">{r.minMax}</td>
                <td className="p-2 text-center">{r.miss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Підказка: клацни “Створити демо-дані” або завантаж CSV/XLSX, потім переходь до
        кореляцій та моделей. Mean/SD та квартилі рахуються лише за валідними числовими значеннями.
      </p>
    </div>
  );
}

// ——— helpers ———

function inferNumericColumns(rows: any[]): string[] {
  if (!rows || !rows.length) return [];
  const cols = Object.keys(rows[0] ?? {});
  const ok: string[] = [];
  for (const c of cols) {
    let good = 0,
      seen = 0;
    for (const r of rows) {
      const v = toNum(r[c]);
      if (v !== null) {
        seen++;
        if (Number.isFinite(v)) good++;
      }
    }
    if (seen > 0 && good / seen >= 0.7) ok.push(c);
  }
  return ok;
}
