"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,-]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

const pill = (t: "green" | "yellow" | "red") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : "bg-red-100 text-red-900";

function urrBand(p: number) {
  if (p >= 65) return { label: "URR ≥65% (ціль досягнута)", tone: "green" as const };
  if (p >= 60) return { label: "URR 60–64% (погранично)", tone: "yellow" as const };
  return { label: "URR <60% (недостатньо)", tone: "red" as const };
}

const LS_KEY = "urr_v3";

/* ───────── page ───────── */
export default function URRPage() {
  // зберігаємо РЯДКИ → поля можуть бути порожні
  const [preStr, setPreStr] = useState("");
  const [postStr, setPostStr] = useState("");

  // відновлення/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setPreStr(v.preStr ?? "");
        setPostStr(v.postStr ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ preStr, postStr }));
  }, [preStr, postStr]);

  // парсинг + валідація
  const pre = toNum(preStr);   // ммоль/л
  const post = toNum(postStr); // ммоль/л

  const preOk = inRange(pre, 1, 50);
  const postOk = inRange(post, 0, 50) && (pre != null ? post! < pre! : true);
  const ready = preOk && postOk;

  // авто-розрахунок
  const urr = useMemo(() => {
    if (!ready) return null;
    const p = (1 - post! / pre!) * 100;
    return +p.toFixed(1);
  }, [ready, pre, post]);

  // автоскрол при першому валідному результаті
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (urr != null && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [urr]);

  // прогрес-бар (2 поля)
  const progress = useMemo(
    () => [preStr, postStr].filter((s) => (s ?? "").trim()).length,
    [preStr, postStr]
  );

  const onReset = () => {
    setPreStr("");
    setPostStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (urr == null) return;
    const band = urrBand(urr);
    const txt = `URR: ${urr}% — ${band.label}`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-2">URR — Urea Reduction Ratio</h2>
      <p className="text-gray-600 mb-4">
        Формула: <span className="font-mono">URR = (1 − post/pre) × 100%</span>.
        Поля можуть бути порожніми; десятковий роздільник — «,» або «.».
      </p>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 2</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 2) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Сечовина перед діалізом (ммоль/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 20.0"
              value={preStr}
              onChange={(e) => setPreStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${preStr && !preOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Сечовина після діалізу (ммоль/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 5.2"
              value={postStr}
              onChange={(e) => setPostStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${postStr && !postOk ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        {/* Діагностика введення */}
        {preStr && !preOk && (
          <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            Перевірте «перед діалізом»: очікуваний діапазон 1–50 ммоль/л.
          </div>
        )}
        {postStr && !postOk && (
          <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            «Після діалізу» має бути &lt; «перед діалізом» і в межах 0–50 ммоль/л.
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={urr == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              urr != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={urr != null ? "Скопіювати підсумок" : "Заповніть обидва поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            URR:&nbsp;<span className="font-mono">{urr != null ? urr.toFixed(1) : "—"}</span> %
          </div>

          {urr != null ? (
            <div className="mt-2 inline-flex items-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full ${pill(urrBand(urr).tone)}`}>{urrBand(urr).label}</span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-600">Введіть обидва значення для автоматичного розрахунку.</div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Примітка: URR корелює з адекватністю діалізу, але чутливий до часу забору проби, рециркуляції та інших факторів.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dialysis" className="text-gray-600 hover:text-blue-700">
          ← Назад до діалізу
        </Link>
      </div>
    </div>
  );
}
