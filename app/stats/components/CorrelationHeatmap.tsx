// app/stats/components/CorrelationHeatmap.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  CorrMethod,
  correlation,
  fdrBH,
  toNum,
  fmt,
} from './stats-utils';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

type Props = {
  data: any[];                 // масив рядків таблиці
  numericCols?: string[];      // якщо не передати — визначимо автоматично
  defaultMethod?: CorrMethod;  // 'pearson' | 'spearman'
};

export default function CorrelationHeatmap({
  data,
  numericCols,
  defaultMethod = 'pearson',
}: Props) {
  const [method, setMethod] = React.useState<CorrMethod>(defaultMethod);
  const [showNums, setShowNums] = React.useState(true);
  const [useFDR, setUseFDR] = React.useState(true);
  const [alpha, setAlpha] = React.useState(0.05);

  const cols =
    numericCols ??
    inferNumericColumns(data).slice(0, 40); // безпека: не більше 40 для відмалювання

  const { Z, R, P, Q } = React.useMemo(() => {
    const m = cols.length;
    const Z: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
    const R: number[][] = Array.from({ length: m }, () => Array(m).fill(NaN));
    const P: number[][] = Array.from({ length: m }, () => Array(m).fill(NaN));

    // зберемо стовпці в масиви
    const series: number[][] = cols.map((c) =>
      data.map((r) => toNum(r[c])).filter((v): v is number => v !== null)
    );

    // кореляції
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        if (i === j) {
          R[i][j] = 1;
          P[i][j] = 0;
          Z[i][j] = 1;
        } else if (j < i) {
          // симетрія — візьмемо з верхнього трикутника
          R[i][j] = R[j][i];
          P[i][j] = P[j][i];
          Z[i][j] = R[i][j];
        } else {
          const { r, p } = correlation(
            data.map((r) => r[cols[i]]),
            data.map((r) => r[cols[j]]),
            method
          );
          R[i][j] = r;
          P[i][j] = p;
          Z[i][j] = r;
        }
      }
    }

    // FDR
    let Q: number[][] = Array.from({ length: m }, () => Array(m).fill(NaN));
    if (useFDR) {
      const pList: number[] = [];
      for (let i = 0; i < m; i++)
        for (let j = i + 1; j < m; j++) pList.push(P[i][j]);
      const qList = fdrBH(pList);
      let k = 0;
      for (let i = 0; i < m; i++) {
        for (let j = i + 1; j < m; j++) {
          Q[i][j] = qList[k];
          Q[j][i] = qList[k];
          k++;
        }
        Q[i][i] = 0;
      }
    }
    return { Z, R, P, Q };
  }, [data, cols, method, useFDR]);

  // Анотації в клітинках
  const annotations =
    showNums
      ? buildAnnotations(cols, R, P, Q, useFDR, alpha)
      : [];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label title="Метод кореляції">
          <span className="mr-2">Метод:</span>
          <select
            className="border rounded px-2 py-1"
            value={method}
            onChange={(e) => setMethod(e.target.value as CorrMethod)}
          >
            <option value="pearson">Pearson</option>
            <option value="spearman">Spearman (ранги)</option>
          </select>
        </label>

        <label title="Поріг значущості (для підсвітки зірочками)">
          <span className="ml-4 mr-2">α:</span>
          <input
            type="number"
            step="0.01"
            min={0.001}
            max={0.2}
            className="border rounded px-2 py-1 w-20"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
          />
        </label>

        <label title="Корекція множинних порівнянь Benjamini–Hochberg">
          <input
            type="checkbox"
            checked={useFDR}
            onChange={(e) => setUseFDR(e.target.checked)}
            className="mr-2 ml-4"
          />
          FDR (BH)
        </label>

        <label title="Показати числа у клітинках">
          <input
            type="checkbox"
            checked={showNums}
            onChange={(e) => setShowNums(e.target.checked)}
            className="mr-2 ml-4"
          />
          Показати значення
        </label>

        <span className="ml-4 text-sm text-gray-600" title="Пояснення">
          Наведи мишкою на клітинку: r, p, q(FDR). Зірочки: * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001.
        </span>
      </div>

      <Plot
        data={[
          {
            z: Z,
            x: cols,
            y: cols,
            type: 'heatmap',
            colorscale: 'RdBu',
            reversescale: true,
            zmin: -1,
            zmax: 1,
            colorbar: { title: 'r' },
            hovertemplate:
              '<b>%{x}</b> vs <b>%{y}</b><br>r=%{z:.3f}<br>p=%{customdata[0]:.3g}' +
              (useFDR ? '<br>q(FDR)=%{customdata[1]:.3g}' : '') +
              '<extra></extra>',
            customdata: zip2d(P, Q),
          } as any,
        ]}
        layout={{
          height: Math.min(120 + cols.length * 28, 900),
          margin: { l: 120, r: 20, t: 10, b: 130 },
          annotations,
          xaxis: { tickangle: -45 },
        }}
        config={{ displaylogo: false, responsive: true }}
      />
    </div>
  );
}

// ————— helpers —————
function inferNumericColumns(rows: any[]): string[] {
  if (!rows || !rows.length) return [];
  const cols = Object.keys(rows[0] ?? {});
  const ok: string[] = [];
  for (const c of cols) {
    // numeric if ≥ 70% значень парсяться як числа
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

function stars(p: number, alpha: number): string {
  if (!Number.isFinite(p)) return '';
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < alpha) return '*';
  return '';
}

function buildAnnotations(
  cols: string[],
  R: number[][],
  P: number[][],
  Q: number[][],
  useFDR: boolean,
  alpha: number
) {
  const ann: any[] = [];
  for (let i = 0; i < cols.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      const p = P[i][j];
      const q = useFDR ? Q[i][j] : NaN;
      const text = `${fmt(R[i][j])}${stars(p, alpha)}`;
      ann.push({
        x: cols[j],
        y: cols[i],
        text,
        showarrow: false,
        font: { size: 11, color: Math.abs(R[i][j]) > 0.6 ? '#fff' : '#111' },
      });
    }
  }
  return ann;
}

function zip2d(A: number[][], B: number[][]): number[][][] {
  const m = A.length;
  const out: number[][][] = Array.from({ length: m }, () => Array(m).fill([NaN, NaN]));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < m; j++)
      out[i][j] = [A?.[i]?.[j] ?? NaN, B?.[i]?.[j] ?? NaN];
  return out;
}
