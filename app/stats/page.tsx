"use client";

import DataTab from './DataTab';
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import DescribeTable from "./components/DescribeTable";
import CorrelationHeatmap from "./components/CorrelationHeatmap";

// ...
<DataTab onDataChange={(rows)=>{/* якщо треба – прокинути дані в інші блоки */}} />


// Plotly лише на клієнті
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Row = { x1: number; x2: number; y: number; time?: number; status?: number };

// ========== Утиліти ==========
function linspace(a: number, b: number, n: number) {
  const dx = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * dx);
}
function mean2(xs: number[], ys: number[]) {
  const n = xs.length || 1;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  return [mx, my];
}
function cov2(xs: number[], ys: number[]) {
  const n = xs.length;
  const [mx, my] = mean2(xs, ys);
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const c = Math.max(1, n - 1);
  return [
    [sxx / c, sxy / c],
    [sxy / c, syy / c],
  ] as number[][];
}
function inv2(m: number[][]) {
  const [a, b] = m[0];
  const [c, d] = m[1];
  const det = a * d - b * c;
  const eps = 1e-12;
  const k = 1 / (det || eps);
  return [
    [d * k, -b * k],
    [-c * k, a * k],
  ];
}
function mul2(A: number[][], v: number[]) {
  return [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
}
function dot2(a: number[], b: number[]) {
  return a[0] * b[0] + a[1] * b[1];
}
function eig2(S: number[][]) {
  // власні значення 2x2
  const a = S[0][0],
    b = S[0][1],
    c = S[1][0],
    d = S[1][1];
  const tr = a + d;
  const det = a * d - b * c;
  const s = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + s;
  const l2 = tr / 2 - s;
  // власні вектори
  const v1 =
    Math.abs(b) > Math.abs(a - l1)
      ? [1, (l1 - a) / b]
      : [b / (l1 - d), 1]; // будь-яка пропорція
  const n1 = Math.hypot(v1[0], v1[1]) || 1;
  const ev1 = [v1[0] / n1, v1[1] / n1];

  const v2 =
    Math.abs(b) > Math.abs(a - l2)
      ? [1, (l2 - a) / b]
      : [b / (l2 - d), 1];
  const n2 = Math.hypot(v2[0], v2[1]) || 1;
  const ev2 = [v2[0] / n2, v2[1] / n2];

  return { vals: [l1, l2], vecs: [ev1, ev2] };
}
function ellipseTrace(mx: number, my: number, S: number[][], name: string) {
  const { vals, vecs } = eig2(S);
  const t = linspace(0, 2 * Math.PI, 100);
  // 95% (~2σ) масштаб
  const scale = 2.0;
  const a = Math.sqrt(Math.max(vals[0], 1e-9)) * scale;
  const b = Math.sqrt(Math.max(vals[1], 1e-9)) * scale;
  const u = vecs[0];
  const v = vecs[1];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const px = mx + a * Math.cos(t[i]) * u[0] + b * Math.sin(t[i]) * v[0];
    const py = my + a * Math.cos(t[i]) * u[1] + b * Math.sin(t[i]) * v[1];
    xs.push(px);
    ys.push(py);
  }
  return {
    x: xs,
    y: ys,
    mode: "lines",
    name,
    line: { width: 2 },
    hoverinfo: "skip",
  } as any;
}

// простий псевдовипадковий (для відтворюваності)
function randn(seedRef: { s: number }) {
  seedRef.s = (seedRef.s * 1664525 + 1013904223) % 4294967296;
  const u1 = (seedRef.s + 1) / 4294967297;
  seedRef.s = (seedRef.s * 1664525 + 1013904223) % 4294967296;
  const u2 = (seedRef.s + 1) / 4294967297;
  const r = Math.sqrt(-2 * Math.log(u1 + 1e-12));
  const th = 2 * Math.PI * u2;
  return r * Math.cos(th);
}

// ========== Демо-дані ==========
// 2 фічі + бінарний клас + time/status для Каплана–Майєра
function makeDemo(nPerClass = 80, seed = 123456): Row[] {
  const s = { s: seed >>> 0 };
  const out: Row[] = [];

  // class 0
  for (let i = 0; i < nPerClass; i++) {
    const x1 = 0.2 + 1.0 * randn(s);
    const x2 = 0.1 + 1.0 * randn(s);
    // виживаність: повільніша (кращий прогноз)
    const time = Math.max(0.1, 8 + 3 * randn(s));
    const status = Math.random() < 0.8 ? 1 : 0;
    out.push({ x1, x2, y: 0, time, status });
  }
  // class 1
  for (let i = 0; i < nPerClass; i++) {
    const x1 = 2.2 + 1.0 * randn(s);
    const x2 = 2.0 + 1.0 * randn(s);
    // виживаність: швидша подія (гірший прогноз)
    const time = Math.max(0.1, 5 + 2 * randn(s));
    const status = Math.random() < 0.85 ? 1 : 0;
    out.push({ x1, x2, y: 1, time, status });
  }
  return out;
}

// ========== LDA (2D) ==========
function ldaModel(rows: Row[]) {
  const x0: number[] = [],
    y0: number[] = [],
    x1: number[] = [],
    y1: number[] = [];
  rows.forEach((r) => {
    if (r.y === 0) {
      x0.push(r.x1);
      y0.push(r.x2);
    } else {
      x1.push(r.x1);
      y1.push(r.x2);
    }
  });
  const n0 = x0.length,
    n1 = x1.length;
  if (n0 < 2 || n1 < 2) return null;

  const mu0 = mean2(x0, y0);
  const mu1 = mean2(x1, y1);
  const S0 = cov2(x0, y0);
  const S1 = cov2(x1, y1);
  // pooled covariance
  const Sp = [
    [
      ((n0 - 1) * S0[0][0] + (n1 - 1) * S1[0][0]) / (n0 + n1 - 2),
      ((n0 - 1) * S0[0][1] + (n1 - 1) * S1[0][1]) / (n0 + n1 - 2),
    ],
    [
      ((n0 - 1) * S0[1][0] + (n1 - 1) * S1[1][0]) / (n0 + n1 - 2),
      ((n0 - 1) * S0[1][1] + (n1 - 1) * S1[1][1]) / (n0 + n1 - 2),
    ],
  ];
  const iSp = inv2(Sp);
  const w = mul2(iSp, [mu1[0] - mu0[0], mu1[1] - mu0[1]]);
  // поріг при рівних пріорах
  const c = 0.5 * dot2(w, [mu0[0] + mu1[0], mu0[1] + mu1[1]]);
  return { mu0, mu1, S0, S1, Sp, iSp, w, c };
}
function ldaScore(model: ReturnType<typeof ldaModel>, r: Row) {
  if (!model) return 0;
  return dot2(model.w, [r.x1, r.x2]);
}
function ldaPredict(model: ReturnType<typeof ldaModel>, r: Row) {
  if (!model) return 0;
  return ldaScore(model, r) > model.c ? 1 : 0;
}

// ========== ROC / PR ==========
function rocPrCurves(labels: number[], scores: number[]) {
  const idx = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const L = idx.map((i) => labels[i]);
  const S = idx.map((i) => scores[i]);
  const P = L.reduce((s, v) => s + (v === 1 ? 1 : 0), 0);
  const N = L.length - P;

  let tp = 0,
    fp = 0;
  const rocX: number[] = [0],
    rocY: number[] = [0];
  const prP: number[] = [],
    prR: number[] = [];

  for (let i = 0; i < L.length; i++) {
    if (L[i] === 1) tp++;
    else fp++;
    rocX.push(N ? fp / N : 0);
    rocY.push(P ? tp / P : 0);
    const prec = tp / Math.max(1, tp + fp);
    const rec = P ? tp / P : 0;
    prP.push(prec);
    prR.push(rec);
  }
  // AUC ROC (trapezoids)
  let auc = 0;
  for (let i = 1; i < rocX.length; i++) {
    const dx = rocX[i] - rocX[i - 1];
    auc += dx * (rocY[i] + rocY[i - 1]) / 2;
  }
  // AP (approx integral PR)
  let ap = 0;
  for (let i = 1; i < prR.length; i++) {
    const dr = prR[i] - prR[i - 1];
    ap += prP[i] * dr;
  }
  return { rocX, rocY, prP, prR, auc, ap };
}

// ========== Logistic (Newton–Raphson, 2 фічі + константа) ==========
function fitLogistic(rows: Row[], iters = 12) {
  if (rows.length < 3) return { beta: [0, 0, 0] };
  const X = rows.map((r) => [1, r.x1, r.x2]); // 3 параметри
  const y = rows.map((r) => r.y);
  let b = [0, 0, 0];
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  for (let t = 0; t < iters; t++) {
    const p = X.map((row) => sig(row[0] * b[0] + row[1] * b[1] + row[2] * b[2]));
    // градієнт
    const g = [0, 0, 0];
    for (let i = 0; i < X.length; i++) {
      const w = y[i] - p[i];
      g[0] += w * X[i][0];
      g[1] += w * X[i][1];
      g[2] += w * X[i][2];
    }
    // Гессіан (3x3)
    const H = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let i = 0; i < X.length; i++) {
      const w = p[i] * (1 - p[i]);
      for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) H[a][c] -= w * X[i][a] * X[i][c];
    }
    // Розвʼязуємо H * delta = g (3x3 Гаусс)
    const A = [
      [H[0][0], H[0][1], H[0][2], g[0]],
      [H[1][0], H[1][1], H[1][2], g[1]],
      [H[2][0], H[2][1], H[2][2], g[2]],
    ];
    for (let i = 0; i < 3; i++) {
      // півод
      let piv = i;
      for (let r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
      [A[i], A[piv]] = [A[piv], A[i]];
      const s = A[i][i] || 1e-9;
      for (let c = i; c < 4; c++) A[i][c] /= s;
      for (let r = 0; r < 3; r++)
        if (r !== i) {
          const f = A[r][i];
          for (let c = i; c < 4; c++) A[r][c] -= f * A[i][c];
        }
    }
    const delta = [A[0][3], A[1][3], A[2][3]];
    b = [b[0] + delta[0], b[1] + delta[1], b[2] + delta[2]];
    if (Math.hypot(delta[0], delta[1], delta[2]) < 1e-6) break;
  }
  return { beta: b };
}
function logisticScore(beta: number[], r: Row) {
  return 1 / (1 + Math.exp(-(beta[0] + beta[1] * r.x1 + beta[2] * r.x2)));
}

// ========== Kaplan–Meier ==========
function kmCurve(times: number[], status: number[]) {
  // status: 1=подія, 0=цензор
  const idx = times.map((_, i) => i).sort((a, b) => times[a] - times[b]);
  let atRisk = times.length;
  let surv = 1;
  const xs: number[] = [0];
  const ys: number[] = [1];

  let i = 0;
  while (i < idx.length) {
    const t = times[idx[i]];
    // скільки подій саме в цей час
    let di = 0,
      ci = 0;
    while (i < idx.length && times[idx[i]] === t) {
      if (status[idx[i]] === 1) di++;
      else ci++;
      i++;
    }
    if (atRisk > 0) surv *= (atRisk - di) / atRisk;
    xs.push(t);
    ys.push(ys[ys.length - 1]); // горизонтальний сегмент
    xs.push(t);
    ys.push(surv); // крок вниз
    atRisk -= di + ci;
  }
  return { x: xs, y: ys };
}

// ========== Компонент ==========
export default function StatsPage() {
  const [tab, setTab] = useState<"LDA" | "ML">("LDA");
  const [rows, setRows] = useState<Row[]>([]);
  const [showRegions, setShowRegions] = useState(true);
  const [showEllipses, setShowEllipses] = useState(true);

  const createDemo = () => {
    const seed = (Date.now() & 0xffffffff) >>> 0;
    setRows(makeDemo(90, seed));
  };
  const reset = () => setRows([]);

  // LDA модель
  const lda = useMemo(() => ldaModel(rows), [rows]);

  // дані для LDA scatter
  const ldaScatter = useMemo(() => {
    if (rows.length === 0) return [];
    const x0: number[] = [],
      y0: number[] = [],
      x1: number[] = [],
      y1: number[] = [];
    rows.forEach((r) => {
      (r.y === 0 ? x0 : x1).push(r.x1);
      (r.y === 0 ? y0 : y1).push(r.x2);
    });
    const traces: any[] = [
      {
        x: x0,
        y: y0,
        mode: "markers",
        type: "scattergl",
        name: "Class 0",
        marker: { size: 7, opacity: 0.85 },
      },
      {
        x: x1,
        y: y1,
        mode: "markers",
        type: "scattergl",
        name: "Class 1",
        marker: { size: 7, opacity: 0.85 },
      },
    ];
    if (showEllipses && lda) {
      const e0 = ellipseTrace(lda.mu0[0], lda.mu0[1], lda.S0, "Ellipse 0");
      const e1 = ellipseTrace(lda.mu1[0], lda.mu1[1], lda.S1, "Ellipse 1");
      traces.push(e0, e1);
    }
    if (showRegions && lda) {
      // decision regions heatmap
      const xs = rows.map((r) => r.x1);
      const ys = rows.map((r) => r.x2);
      const xMin = Math.min(...xs) - 1,
        xMax = Math.max(...xs) + 1;
      const yMin = Math.min(...ys) - 1,
        yMax = Math.max(...ys) + 1;
      const NX = 100,
        NY = 100;
      const X = linspace(xMin, xMax, NX);
      const Y = linspace(yMin, yMax, NY);
      const Z: number[][] = [];
      for (let j = 0; j < NY; j++) {
        const row: number[] = [];
        for (let i = 0; i < NX; i++) {
          const sc = dot2(lda.w, [X[i], Y[j]]) - lda.c;
          row.push(sc);
        }
        Z.push(row);
      }
      traces.unshift({
        x: X,
        y: Y,
        z: Z,
        type: "contour",
        showscale: false,
        contours: { coloring: "heatmap", showlines: false },
        opacity: 0.25,
        hoverinfo: "skip",
        name: "regions",
      } as any);
    }
    return traces;
  }, [rows, lda, showEllipses, showRegions]);

  // ROC/PR + Logistic + KM
  const rocpr = useMemo(() => {
    if (!lda || rows.length === 0) return null;
    const scores = rows.map((r) => ldaScore(lda, r));
    const labels = rows.map((r) => r.y);
    return rocPrCurves(labels, scores);
  }, [rows, lda]);

  const logistic = useMemo(() => {
    if (rows.length === 0) return null;
    return fitLogistic(rows);
  }, [rows]);

  const km = useMemo(() => {
    if (rows.length === 0) return null;
    const g0 = rows.filter((r) => r.y === 0 && r.time != null && r.status != null);
    const g1 = rows.filter((r) => r.y === 1 && r.time != null && r.status != null);
    if (g0.length < 2 || g1.length < 2) return null;
    const c0 = kmCurve(
      g0.map((r) => r.time!),
      g0.map((r) => r.status!)
    );
    const c1 = kmCurve(
      g1.map((r) => r.time!),
      g1.map((r) => r.status!)
    );
    return { c0, c1 };
  }, [rows]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Клінічна статистика — автоаналіз
        </h1>
        {/* Вкладка Дані & Описова (завантаження, ручна таблиця, описова статистика) */}
        <DataTab />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setTab("LDA")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d0d0d0",
              background: tab === "LDA" ? "#2557e0" : "white",
              color: tab === "LDA" ? "white" : "#222",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            LDA
          </button>
          <button
            onClick={() => setTab("ML")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d0d0d0",
              background: tab === "ML" ? "#2557e0" : "white",
              color: tab === "ML" ? "white" : "#222",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ROC/PR • Logistic • KM
          </button>
        </div>
      </div>

      <p style={{ marginTop: 8, color: "#555" }}>
        Створіть демо-набір або підставте власні дані — і подивіться LDA з decision-regions та еліпсами коварації.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={createDemo}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d0d0d0",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Створити демо-дані
        </button>
        <button
          onClick={reset}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d0d0d0",
            cursor: "pointer",
          }}
        >
          Скинути
        </button>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid #f0c2c2",
            background: "#fff5f5",
            color: "#c0392b",
          }}
        >
          Дані відсутні. Натисніть “Створити демо-дані”.
        </div>
      ) : tab === "LDA" ? (
        <div style={{ border: "1px solid #eaeaea", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} />
              Decision-regions
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={showEllipses} onChange={(e) => setShowEllipses(e.target.checked)} />
              Еліпси коварації (≈95%)
            </label>
          </div>
          <Plot
            data={ldaScatter as any}
            layout={{
              height: 540,
              margin: { l: 50, r: 10, t: 10, b: 45 },
              xaxis: { title: "x1" },
              yaxis: { title: "x2" },
              legend: { orientation: "h" },
            }}
            config={{ displaylogo: false, responsive: true }}
            style={{ width: "100%", height: "540px" }}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* ROC / PR */}
          <div style={{ border: "1px solid #eaeaea", borderRadius: 12, padding: 12 }}>
            <h3 style={{ margin: "0 0 8px 2px" }}>ROC і PR</h3>
            <Plot
              data={
                rocpr
                  ? ([
                      {
                        x: rocpr.rocX,
                        y: rocpr.rocY,
                        type: "scatter",
                        mode: "lines",
                        name: `ROC (AUC = ${rocpr.auc.toFixed(3)})`,
                      },
                      {
                        x: [0, 1],
                        y: [0, 1],
                        type: "scatter",
                        mode: "lines",
                        name: "random",
                        line: { dash: "dash" },
                      },
                    ] as any)
                  : []
              }
              layout={{
                height: 260,
                margin: { l: 50, r: 10, t: 10, b: 40 },
                xaxis: { title: "FPR" },
                yaxis: { title: "TPR", range: [0, 1] },
                legend: { orientation: "h" },
              }}
              config={{ displaylogo: false, responsive: true }}
            />
            <Plot
              data={
                rocpr
                  ? ([
                      {
                        x: rocpr.prR,
                        y: rocpr.prP,
                        type: "scatter",
                        mode: "lines",
                        name: `PR (AP = ${rocpr.ap.toFixed(3)})`,
                      },
                    ] as any)
                  : []
              }
              layout={{
                height: 260,
                margin: { l: 50, r: 10, t: 10, b: 40 },
                xaxis: { title: "Recall", range: [0, 1] },
                yaxis: { title: "Precision", range: [0, 1] },
                legend: { orientation: "h" },
              }}
              config={{ displaylogo: false, responsive: true }}
            />
          </div>

          {/* Logistic */}
          <div style={{ border: "1px solid #eaeaea", borderRadius: 12, padding: 12 }}>
            <h3 style={{ margin: "0 0 8px 2px" }}>Логістична регресія (2 фічі)</h3>
            <div style={{ marginBottom: 8, color: "#333" }}>
              {logistic ? (
                <div>
                  β₀ = <b>{logistic.beta[0].toFixed(3)}</b>, β₁ ={" "}
                  <b>{logistic.beta[1].toFixed(3)}</b>, β₂ ={" "}
                  <b>{logistic.beta[2].toFixed(3)}</b>
                </div>
              ) : (
                "недостатньо даних"
              )}
            </div>
            <Plot
              data={
                logistic
                  ? ([
                      {
                        x: rows.map((r) => logisticScore(logistic.beta, r)),
                        y: rows.map((r) => r.y),
                        type: "histogram2d",
                        nbinsx: 30,
                        nbinsy: 2,
                        colorscale: "Blues",
                        name: "score vs class",
                      },
                    ] as any)
                  : []
              }
              layout={{
                height: 250,
                margin: { l: 50, r: 10, t: 10, b: 40 },
                xaxis: { title: "Logistic score (p)" },
                yaxis: { title: "Клас", tickvals: [0, 1] },
              }}
              config={{ displaylogo: false, responsive: true }}
            />
          </div>

          {/* KM */}
          <div style={{ gridColumn: "1 / span 2", border: "1px solid #eaeaea", borderRadius: 12, padding: 12 }}>
            <h3 style={{ margin: "0 0 8px 2px" }}>Каплан–Майєр (за класом)</h3>
            <Plot
              data={
                km
                  ? ([
                      {
                        x: km.c0.x,
                        y: km.c0.y,
                        type: "scatter",
                        mode: "lines",
                        name: "Class 0",
                      },
                      {
                        x: km.c1.x,
                        y: km.c1.y,
                        type: "scatter",
                        mode: "lines",
                        name: "Class 1",
                      },
                    ] as any)
                  : []
              }
              layout={{
                height: 330,
                margin: { l: 50, r: 10, t: 10, b: 45 },
                xaxis: { title: "Час" },
                yaxis: { title: "S(t)", range: [0, 1] },
                legend: { orientation: "h" },
              }}
              config={{ displaylogo: false, responsive: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
