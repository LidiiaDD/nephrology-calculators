"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

type G = "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5";
type A = "A1" | "A2" | "A3";
type Tone = "green" | "yellow" | "orange" | "red";

const KDIGO_MAP: Record<`${G}${A}`, "Низький ризик" | "Помірний ризик" | "Високий ризик" | "Дуже високий ризик"> = {
  G1A1: "Низький ризик",   G1A2: "Помірний ризик",   G1A3: "Високий ризик",
  G2A1: "Низький ризик",   G2A2: "Помірний ризик",   G2A3: "Високий ризик",
  G3aA1: "Помірний ризик", G3aA2: "Високий ризик",   G3aA3: "Дуже високий ризик",
  G3bA1: "Високий ризик",  G3bA2: "Дуже високий ризик", G3bA3: "Дуже високий ризик",
  G4A1: "Дуже високий ризик", G4A2: "Дуже високий ризик", G4A3: "Дуже високий ризик",
  G5A1: "Дуже високий ризик", G5A2: "Дуже високий ризик", G5A3: "Дуже високий ризик",
};

const toneOf = (risk: string): Tone =>
  risk.includes("Низький") ? "green" :
  risk.includes("Помірний") ? "yellow" :
  risk.includes("Високий ризик") && !risk.includes("Дуже") ? "orange" : "red";

const pill = (t: Tone) =>
  t === "green" ? "bg-green-100 text-green-900" :
  t === "yellow" ? "bg-yellow-100 text-yellow-900" :
  t === "orange" ? "bg-orange-100 text-orange-900" :
  "bg-red-100 text-red-900";

const cellBg = (t: Tone) =>
  t === "green" ? "bg-green-50" :
  t === "yellow" ? "bg-yellow-50" :
  t === "orange" ? "bg-orange-50" : "bg-red-50";

const LS_KEY = "kdigo_ckd_v3";

/* ───────── stage resolvers ───────── */
function gFromEgfr(egfr: number): G {
  if (egfr >= 90) return "G1";
  if (egfr >= 60) return "G2";
  if (egfr >= 45) return "G3a";
  if (egfr >= 30) return "G3b";
  if (egfr >= 15) return "G4";
  return "G5";
}
function aFromAcr(acr: number): A {
  if (acr < 30) return "A1";
  if (acr <= 300) return "A2";
  return "A3";
}

/* ───────── page ───────── */
export default function KDIGOPage() {
  type Mode = "values" | "stages";
  const [mode, setMode] = useState<Mode>("values");

  // values mode
  const [egfrStr, setEgfrStr] = useState("");
  const [acrStr, setAcrStr] = useState("");

  // stages mode (manual)
  const [gStage, setGStage] = useState<G | "">("");
  const [aStage, setAStage] = useState<A | "">("");

  // derived
  const egfr = toNum(egfrStr);
  const acr = toNum(acrStr);

  const egfrOk = inRange(egfr, 0, 200);
  const acrOk = inRange(acr, 0, 10000);

  const gAuto = egfrOk ? gFromEgfr(egfr!) : null;
  const aAuto = acrOk ? aFromAcr(acr!) : null;

  const G: G | null = mode === "values" ? (gAuto ?? null) : (gStage || null);
  const A: A | null = mode === "values" ? (aAuto ?? null) : (aStage || null);

  const risk = useMemo(() => (G && A ? KDIGO_MAP[`${G}${A}`] : null), [G, A]);
  const tone: Tone | null = risk ? toneOf(risk) : null;

  const progress = useMemo(() => {
    if (mode === "values") return (egfrOk ? 1 : 0) + (acrOk ? 1 : 0);
    return (gStage ? 1 : 0) + (aStage ? 1 : 0);
  }, [mode, egfrOk, acrOk, gStage, aStage]);

  // autosave/restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setMode(v.mode ?? "values");
        setEgfrStr(v.egfrStr ?? "");
        setAcrStr(v.acrStr ?? "");
        setGStage(v.gStage ?? "");
        setAStage(v.aStage ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ mode, egfrStr, acrStr, gStage, aStage }));
  }, [mode, egfrStr, acrStr, gStage, aStage]);

  // autoscroll when result ready
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (risk && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [risk]);

  // actions
  const onReset = () => {
    setEgfrStr("");
    setAcrStr("");
    setGStage("");
    setAStage("");
    scrolledOnce.current = false;
  };
  const onCopy = async () => {
    if (!risk || !G || !A) return;
    const parts = [`KDIGO: ${G} + ${A} — ${risk}`];
    if (mode === "values") {
      if (egfrOk) parts.push(`eGFR ${egfr} мл/хв/1.73 м²`);
      if (acrOk) parts.push(`ACR ${acr} мг/г`);
    }
    const txt = parts.join("; ");
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  // heatmap data
  const G_ROWS: G[] = ["G1", "G2", "G3a", "G3b", "G4", "G5"];
  const A_COLS: A[] = ["A1", "A2", "A3"];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">KDIGO — стадіювання ХХН за eGFR та альбумінурією</h1>
      <p className="text-gray-600 mb-4">
        Заповніть <b>eGFR</b> (мл/хв/1.73м²) і <b>ACR</b> (мг/г) або оберіть стадії G/A вручну — ризик визначиться автоматично.
        Десятковий роздільник — «,» або «.»
      </p>

      {/* mode toggle */}
      <div className="inline-flex rounded-xl overflow-hidden shadow mb-4">
        <button
          className={`px-4 py-2 font-medium ${mode === "values" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setMode("values")}
        >
          Ввести значення
        </button>
        <button
          className={`px-4 py-2 font-medium ${mode === "stages" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setMode("stages")}
        >
          Обрати стадії
        </button>
      </div>

      {/* progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 2</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 2) * 100 || 0}%` }} />
        </div>
      </div>

      {/* form */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        {mode === "values" ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">eGFR (мл/хв/1.73 м²)</label>
                <input
                  inputMode="decimal"
                  placeholder="напр., 58.4"
                  value={egfrStr}
                  onChange={(e) => setEgfrStr(sanitizeDecimal(e.target.value))}
                  className={`p-2 rounded-lg border w-full ${egfrStr && !egfrOk ? "border-red-400" : ""}`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Стадія: <span className="font-mono">{gAuto ?? "—"}</span>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-semibold">ACR (мг/г креатиніну)</label>
                <input
                  inputMode="decimal"
                  placeholder="напр., 120"
                  value={acrStr}
                  onChange={(e) => setAcrStr(sanitizeDecimal(e.target.value))}
                  className={`p-2 rounded-lg border w-full ${acrStr && !acrOk ? "border-red-400" : ""}`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Категорія альбумінурії: <span className="font-mono">{aAuto ?? "—"}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Стадія G (eGFR)</label>
              <select value={gStage} onChange={(e) => setGStage(e.target.value as G | "")} className="p-2 rounded-lg border w-full">
                <option value="">—</option>
                <option value="G1">G1 (≥90)</option>
                <option value="G2">G2 (60–89)</option>
                <option value="G3a">G3a (45–59)</option>
                <option value="G3b">G3b (30–44)</option>
                <option value="G4">G4 (15–29)</option>
                <option value="G5">G5 (&lt;15)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Категорія A (ACR, мг/г)</label>
              <select value={aStage} onChange={(e) => setAStage(e.target.value as A | "")} className="p-2 rounded-lg border w-full">
                <option value="">—</option>
                <option value="A1">A1 (&lt;30)</option>
                <option value="A2">A2 (30–300)</option>
                <option value="A3">A3 (&gt;300)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!risk}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              risk ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={risk ? "Скопіювати підсумок" : "Заповніть обидва поля/стадії"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* result */}
      <div ref={resRef} className="mt-6 space-y-4" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">Підсумок</div>
          <div className="mt-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Стадія G:</span>
              <span className="font-mono">{G ?? "—"}</span>
              <span className="text-gray-400">/</span>
              <span>Категорія A:</span>
              <span className="font-mono">{A ?? "—"}</span>
            </div>

            {mode === "values" && (
              <div className="mt-1 text-sm text-gray-700">
                {egfrOk ? <>eGFR: <span className="font-mono">{egfr}</span> мл/хв/1.73 м²</> : <>eGFR: —</>}{" "}
                • {acrOk ? <>ACR: <span className="font-mono">{acr}</span> мг/г</> : <>ACR: —</>}
              </div>
            )}

            <div className="mt-3 inline-flex items-center gap-2">
              <span className="font-semibold">Ризик:</span>
              <span className={`px-3 py-1 rounded-full ${risk ? pill(tone!) : "bg-gray-100 text-gray-500"}`}>
                {risk ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* mini heatmap */}
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg font-bold mb-3">KDIGO «heatmap»</div>
          <div className="overflow-x-auto">
            <table className="min-w-[420px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-500 px-2"> </th>
                  {(["A1","A2","A3"] as A[]).map((a) => (
                    <th key={a} className="text-xs text-gray-600 px-2 py-1"> {a} </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["G1","G2","G3a","G3b","G4","G5"] as G[]).map((g) => (
                  <tr key={g}>
                    <td className="text-xs text-gray-600 px-2 py-1">{g}</td>
                    {(["A1","A2","A3"] as A[]).map((a) => {
                      const r = KDIGO_MAP[`${g}${a}` as `${G}${A}`];
                      const t = toneOf(r);
                      const active = g === G && a === A;
                      return (
                        <td
                          key={a}
                          className={`text-xs px-2 py-2 rounded-lg text-center ${cellBg(t)} ${active ? "ring-2 ring-blue-500" : ""}`}
                        >
                          {r.replace(" ризик", "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Вісь G — за eGFR; вісь A — за ACR (мг/г). Комірка з синьою обводкою відповідає вашому поєднанню.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/ckd-classification" className="text-gray-600 hover:text-blue-700">
          ← Назад до класифікацій ХХН
        </Link>
      </div>
    </div>
  );
}
