'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ========== БАЗОВІ УТИЛІТИ ДАНИХ ========== */
type Row = Record<string, any>;

function isFiniteNum(v: any) {
  const x = typeof v === 'string' ? v.replace(',', '.') : v;
  return Number.isFinite(Number(x));
}
function toNum(v: any) {
  const x = typeof v === 'string' ? v.replace(',', '.') : v;
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

/* ========== ОПИСОВА СТАТИСТИКА ========== */
function mean(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / (arr.length - 1 || 1));
}
function quantile(sorted: number[], q: number) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 >= sorted.length) return sorted[base];
  return sorted[base] + (sorted[base + 1] - sorted[base]) * rest;
}

const palette = {
  header: '#f7f8fb',
  zebra: '#fafafa',
  border: '#e6e8ee',
  grid: '#eef2f7',
  stickyShadow: 'rgba(0,0,0,0.06)',
};

const wrapBox: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
  border: `1px solid ${palette.border}`,
  borderRadius: 8,
};

const tableBox: React.CSSProperties = {
  width: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
};

function buildCellStyles(compact: boolean) {
  const pad = compact ? '6px 8px' : '9px 12px';
  const font = compact ? 12.5 : 13.5;
  const base: React.CSSProperties = {
    padding: pad,
    fontSize: font,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: '1px solid #eef0f4',
    background: '#fff',
  };
  const th: React.CSSProperties = {
    ...base,
    background: palette.header,
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    zIndex: 2,
    textAlign: 'center',
  };
  const td: React.CSSProperties = { ...base, fontVariantNumeric: 'tabular-nums' };
  const tdStrong: React.CSSProperties = { ...td, fontWeight: 600 };
  const stickyFirst: React.CSSProperties = {
    position: 'sticky',
    left: 0,
    zIndex: 3,
    background: '#fff',
    boxShadow: `2px 0 0 ${palette.stickyShadow}`,
    textAlign: 'left',
  };
  return { th, td, tdStrong, stickyFirst };
}

function ScrollHint({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const key = 'descTableHintSeen';
    if (sessionStorage.getItem(key) === '1') return;
    const el = targetRef.current;
    if (!el) return;
    const need = el.scrollWidth > el.clientWidth + 4;
    setVisible(need);
    const onScroll = () => {
      if (el.scrollLeft > 24) {
        setVisible(false);
        sessionStorage.setItem(key, '1');
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [targetRef]);
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        padding: '8px 12px',
        fontSize: 12,
        color: '#4b5563',
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, #fff 50%)',
        pointerEvents: 'none',
      }}
    >
      Прокрутіть →
    </div>
  );
}

function DescribeTable({ data, numericCols }: { data: Row[]; numericCols: string[] }) {
  const [compact, setCompact] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    return numericCols.map((col) => {
      const vals = data.map((r) => toNum(r[col])).filter((x) => Number.isFinite(x)) as number[];
      const n = vals.length;
      if (!n) return { col, n: 0, meanSd: '—', medQ: '—', minMax: '—' };
      const sorted = [...vals].sort((a, b) => a - b);
      const m = mean(vals);
      const s = sd(vals);
      const med = quantile(sorted, 0.5);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const fmt = (x: number) =>
        Number.isFinite(x) ? (Math.abs(x) >= 1000 ? x.toFixed(0) : x.toFixed(2)) : '—';
      return {
        col,
        n,
        meanSd: `${fmt(m)} ± ${fmt(s)}`,
        medQ: `${fmt(med)} (${fmt(q1)}–${fmt(q3)})`,
        minMax: `${fmt(min)}–${fmt(max)}`,
      };
    });
  }, [data, numericCols]);

  const { th, td, tdStrong, stickyFirst } = buildCellStyles(compact);
  const firstColW = 250;
  const colW = 180;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '6px 0 10px' }}>
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13.5 }}>
          <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
          Компактний режим
        </label>
        <span style={{ fontSize: 12.5, color: '#6b7280' }}>
          Заголовок та перша колонка — липкі. Наведіть курсор на заголовок, щоб побачити повну
          назву.
        </span>
      </div>

      <div ref={scrollRef} style={wrapBox}>
        <ScrollHint targetRef={scrollRef} />
        <table style={tableBox}>
          <colgroup>
            <col style={{ width: firstColW }} />
            <col style={{ width: 90 }} />
            <col style={{ width: colW }} />
            <col style={{ width: colW }} />
            <col style={{ width: colW }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...th, ...stickyFirst }} title="Назва змінної">
                Змінна
              </th>
              <th style={th} title="Кількість валідних значень">
                n
              </th>
              <th style={th} title="Середнє ± стандартне відхилення">
                Mean ± SD
              </th>
              <th style={th} title="Медіана (Q1–Q3)">
                Median (Q1–Q3)
              </th>
              <th style={th} title="Мінімум–Максимум">
                Min–Max
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.col} style={{ background: i % 2 ? palette.zebra : '#fff' }}>
                <td style={{ ...tdStrong, ...stickyFirst }} title={r.col}>
                  {r.col}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>{r.n || '—'}</td>
                <td style={{ ...td, textAlign: 'center' }}>{r.meanSd}</td>
                <td style={{ ...td, textAlign: 'center' }}>{r.medQ}</td>
                <td style={{ ...td, textAlign: 'center' }}>{r.minMax}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== КОРЕЛЯЦІЯ (Pearson / Spearman) з p-значеннями ========== */
// Лог-Гамма для неповної бета (Lanczos)
function lgamma(z: number) {
  const p = [
    676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x) - Math.log(z);
}

function betacf(a: number, b: number, x: number) {
  const MAXIT = 200;
  const EPS = 3e-7;
  const FPMIN = 1e-30;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1, m2 = 2; m <= MAXIT; m++, m2 += 2) {
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function betai(a: number, b: number, x: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}
// Двостороннє p для t (df = n-2)
function pvalFromT(t: number, df: number) {
  const x = df / (df + t * t);
  // двостороннє
  return betai(df / 2, 0.5, x);
}

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const ax = xs[i] - mx;
    const ay = ys[i] - my;
    num += ax * ay;
    dx += ax * ax;
    dy += ay * ay;
  }
  const r = num / Math.sqrt(dx * dy);
  const df = n - 2;
  let p = NaN;
  if (Number.isFinite(r) && n >= 3) {
    const t = r * Math.sqrt(df / Math.max(1e-12, 1 - r * r));
    p = pvalFromT(Math.abs(t), df);
  }
  return { r, p, n };
}

function rank(vals: number[]) {
  const idx = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(vals.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
    const avg = (i + j + 2) / 2; // 1-based
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avg;
    i = j + 1;
  }
  return ranks;
}
function spearman(xs: number[], ys: number[]) {
  const rx = rank(xs);
  const ry = rank(ys);
  return pearson(rx, ry); // p з t-розподілу — добрий апроks для n>=10
}

// Колір для r [-1..1]
function colorForR(r: number | null) {
  if (r === null || !Number.isFinite(r)) return '#f5f5f5';
  // інтерполяція від синього (-1) через білий (0) до червоного (+1)
  const t = (r + 1) / 2; // 0..1
  const c1 = { r: 37, g: 99, b: 235 };   // синій  #2563eb
  const c0 = { r: 255, g: 255, b: 255 }; // білий
  const c2 = { r: 239, g: 68, b: 68 };   // червоний #ef4444
  const mix = (a: any, b: any, u: number) => Math.round(a + (b - a) * u);
  const mid = {
    r: mix(c1.r, c0.r, t),
    g: mix(c1.g, c0.g, t),
    b: mix(c1.b, c0.b, t),
  };
  const out = {
    r: mix(mid.r, c2.r, t),
    g: mix(mid.g, c2.g, t),
    b: mix(mid.b, c2.b, t),
  };
  return `rgb(${out.r},${out.g},${out.b})`;
}

function CorrelationHeatmap({
  data,
  cols,
}: {
  data: Row[];
  cols: string[];
}) {
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');

  const matrix = useMemo(() => {
    const ncol = cols.length;
    const M: { r: number | null; p: number | null; n: number }[][] = [];
    for (let i = 0; i < ncol; i++) {
      M[i] = [];
      for (let j = 0; j < ncol; j++) {
        if (i === j) {
          M[i][j] = { r: 1, p: 0, n: data.length };
          continue;
        }
        const xs: number[] = [];
        const ys: number[] = [];
        for (const row of data) {
          const a = toNum(row[cols[i]]);
          const b = toNum(row[cols[j]]);
          if (Number.isFinite(a) && Number.isFinite(b)) {
            xs.push(a); ys.push(b);
          }
        }
        if (xs.length < 3) {
          M[i][j] = { r: null, p: null, n: xs.length };
          continue;
        }
        const res = method === 'pearson' ? pearson(xs, ys) : spearman(xs, ys);
        M[i][j] = { r: res.r, p: res.p, n: res.n };
      }
    }
    return M;
  }, [data, cols, method]);

  const cell = (i: number, j: number) => {
    const v = matrix[i][j];
    const r = v.r;
    const p = v.p;
    const n = v.n;
    const bg = colorForR(r);
    const fmtR = (x: number | null) =>
      x === null || !Number.isFinite(x) ? '—' : (Math.abs(x) >= 0.995 ? x.toFixed(2) : x.toFixed(2));
    const fmtP = (x: number | null) =>
      x === null || !Number.isFinite(x) ? '—' : x < 0.0001 ? '<0.0001' : x.toFixed(4);
    return (
      <div
        key={`${i}-${j}`}
        title={`r=${fmtR(r)}; p=${fmtP(p)}; n=${n}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          borderRight: `1px solid ${palette.grid}`,
          borderBottom: `1px solid ${palette.grid}`,
          height: 36,
          fontSize: 11.5,
          fontWeight: 600,
          color: (r ?? 0) > 0.6 || (r ?? 0) < -0.6 ? '#111827' : '#111827',
          userSelect: 'none',
        }}
      >
        {fmtR(r)}{' '}
        <span style={{ fontWeight: 400, marginLeft: 4, color: '#374151' }}>
          ({fmtP(p)}, {n})
        </span>
      </div>
    );
  };

  const topScroll = useRef<HTMLDivElement>(null);

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <strong>Кореляційна матриця</strong>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            background: '#fff',
          }}
          title="Метод кореляції"
        >
          <option value="pearson">Pearson (r)</option>
          <option value="spearman">Spearman (ρ)</option>
        </select>
        <span style={{ fontSize: 12.5, color: '#6b7280' }}>
          У клітинці: <em>r</em> (p-value, n). Колір — сила/знак зв’язку.
        </span>
      </div>

      <div
        ref={topScroll}
        style={{
          width: '100%',
          overflow: 'auto',
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
        }}
      >
        {/* шапка з назвами колонок */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${cols.length}, 120px)`,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            background: palette.header,
            borderBottom: `1px solid ${palette.grid}`,
          }}
        >
          <div
            style={{
              position: 'sticky',
              left: 0,
              zIndex: 2,
              background: palette.header,
              boxShadow: `2px 0 0 ${palette.stickyShadow}`,
              fontWeight: 600,
              padding: '8px 10px',
            }}
          >
            Змінні
          </div>
          {cols.map((c) => (
            <div
              key={`h-${c}`}
              title={c}
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                padding: '8px 6px',
                textAlign: 'center',
                borderRight: `1px solid ${palette.grid}`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* тіло матриці */}
        {cols.map((ri, i) => (
          <div
            key={`row-${ri}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${cols.length}, 120px)`,
            }}
          >
            <div
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 1,
                background: '#fff',
                boxShadow: `2px 0 0 ${palette.stickyShadow}`,
                borderBottom: `1px solid ${palette.grid}`,
                padding: '8px 10px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: 600,
              }}
              title={ri}
            >
              {ri}
            </div>
            {cols.map((_, j) => cell(i, j))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== ОСНОВНА ВКЛАДКА ДАНИХ ========== */

export default function DataTab() {
  const [tableData, setTableData] = useState<Row[]>([]);
  const [showTable, setShowTable] = useState(false);

  const cols = useMemo<string[]>(() => {
    if (!tableData.length) return [];
    return Object.keys(tableData[0] || {});
  }, [tableData]);

  const numericCols = useMemo(() => {
    if (!tableData.length) return [];
    const keys = Object.keys(tableData[0] || {});
    return keys.filter((k) => {
      let seen = 0, good = 0;
      for (const r of tableData) {
        if (r[k] !== null && r[k] !== undefined && r[k] !== '') {
          seen++;
          if (isFiniteNum(r[k])) good++;
        }
        if (seen >= 12) break;
      }
      return good >= Math.max(4, Math.floor(seen * 0.6));
    });
  }, [tableData]);

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const text = await file.text();
      const first = text.split(/\r?\n/)[0] || '';
      const cand = first.split(';').length > first.split(',').length ? ';' : ',';
      const delimiter = text.includes(';') && text.includes(',') ? cand : (text.includes(';') ? ';' : ',');
      const rows = text
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) =>
          line
            .split(delimiter)
            .map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'))
        );
      if (!rows.length) return;
      const header = rows[0];
      const data: Row[] = rows.slice(1).map((r) => {
        const obj: Row = {};
        header.forEach((h, i) => (obj[h || `col_${i + 1}`] = r[i] ?? ''));
        return obj;
      });
      setTableData(data);
      setShowTable(true);
      return;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(ws, { raw: true, defval: '' });
      setTableData(json);
      setShowTable(true);
      return;
    }
    alert('Підтримуються .csv, .xlsx, .xls');
  }

  // Демо-дані
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function makeDemo() {
    const N = 80;
    const out: Row[] = [];
    for (let i = 0; i < N; i++) {
      const cls = i < N / 2 ? 'A' : 'B';
      const x = cls === 'A' ? randn() * 1.0 + 8 : randn() * 1.2 + 30;
      const y = cls === 'A' ? randn() * 0.8 + 5 : randn() * 1.1 + 11;
      const uAlb = Math.abs(randn() * 6 + 22);
      const uCrea = Math.abs(randn() * 5 + 8);
      out.push({
        ID: i + 1,
        стать: i % 2,
        вік: Math.round(Math.abs(randn() * 7 + 32)),
        uUmod: Number(x.toFixed(2)),
        uUmod24: Number((Math.abs(x * 2.2)).toFixed(2)),
        uAlb: Number(uAlb.toFixed(2)),
        uCrea: Number(uCrea.toFixed(2)),
        ScoreX: Number((x + randn()).toFixed(2)),
        ScoreY: Number((y + randn()).toFixed(2)),
        class: cls,
      });
    }
    setTableData(out);
    setShowTable(true);
  }

  function addEmptyRow() {
    const obj: Row = {};
    cols.forEach((k) => (obj[k] = ''));
    setTableData((p) => [...p, obj]);
  }
  function addColumn() {
    const name = prompt('Назва нового стовпчика:');
    if (!name) return;
    setTableData((p) => p.map((r) => ({ ...r, [name]: '' })));
  }

  return (
    <div style={{ padding: '8px 0 16px' }}>
      <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>Дані & Описова статистика</h2>
      <p style={{ margin: '2px 0 10px', color: '#4b5563' }}>
        Завантажте CSV/Excel або створіть демо-набір. Далі — редагуйте таблицю, переглядайте описову
        статистику та кореляції (з p-значеннями).
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <label style={{ display: 'inline-block' }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <span
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              cursor: 'pointer',
              background: '#fff',
            }}
          >
            Вибрати файл
          </span>
        </label>

        <button
          onClick={makeDemo}
          style={{
            padding: '8px 12px',
            border: '1px solid #2563eb',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
          }}
        >
          Створити демо-дані
        </button>

        <button
          onClick={() => setShowTable((s) => !s)}
          disabled={!tableData.length}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: 8,
            opacity: tableData.length ? 1 : 0.6,
          }}
        >
          {showTable ? 'Сховати таблицю' : 'Показати/редагувати таблицю'}
        </button>

        <button
          onClick={addEmptyRow}
          disabled={!tableData.length}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: 8,
            opacity: tableData.length ? 1 : 0.6,
          }}
        >
          Додати порожній рядок
        </button>

        <button
          onClick={addColumn}
          disabled={!tableData.length}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: 8,
            opacity: tableData.length ? 1 : 0.6,
          }}
        >
          Додати стовпчик
        </button>
      </div>

      {tableData.length > 0 && (
        <div style={{ marginTop: 10, color: '#1f2937' }}>
          <strong>Числові колонки:</strong>{' '}
          {numericCols.length ? numericCols.join(', ') : '— не знайдено'}
        </div>
      )}

      {/* Описова */}
      {tableData.length > 0 && (
        <>
          <h3 style={{ margin: '14px 0 6px', fontSize: 16 }}>Описова статистика</h3>
          <DescribeTable data={tableData} numericCols={numericCols} />
        </>
      )}

      {/* Кореляція */}
      {tableData.length > 0 && numericCols.length >= 2 && (
        <CorrelationHeatmap data={tableData} cols={numericCols} />
      )}

      {/* Таблиця редагування */}
      {showTable && tableData.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, margin: '0 0 6px' }}>Попередній перегляд / ручне редагування</h3>
          <div
            style={{
              maxHeight: 360,
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c}
                      style={{
                        padding: '8px 10px',
                        fontWeight: 600,
                        borderBottom: '1px solid #e5e7eb',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                      }}
                      title={c}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((r, ri) => (
                  <tr key={ri} style={{ background: ri % 2 ? '#fafafa' : '#fff' }}>
                    {cols.map((c) => (
                      <td key={c} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <input
                          value={r[c] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTableData((prev) => {
                              const cp = [...prev];
                              cp[ri] = { ...cp[ri], [c]: val };
                              return cp;
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tableData.length === 0 && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px dashed #d1d5db',
            background: '#fafafa',
            color: '#4b5563',
          }}
        >
          Дані відсутні. Завантажте CSV/XLSX або створіть демо-набір — і нижче автоматично
          з’являться описи, кореляції та heatmap.
        </div>
      )}
    </div>
  );
}
