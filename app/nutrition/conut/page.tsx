"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────────── helpers ───────────── */
function sanitizeDecimalInput(s: string) {
  return s.replace(/[^\d.,]/g, ""); // дозволяємо цифри, кому й крапку
}
function toNum(s: string): number | null {
  if (!s.trim()) return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
}

/* CONUT: шкали балів */
function albuminScore(alb: number) {
  // г/л
  if (alb >= 35) return 0;
  if (alb >= 30) return 2;
  if (alb >= 25) return 4;
  return 6;
}
function lymphScore(lymph: number) {
  // ×10^9/л
  if (lymph >= 1.6) return 0;
  if (lymph >= 1.2) return 1;
  if (lymph >= 0.8) return 2;
  return 3;
}
function cholScore(chol: number) {
  // ммоль/л
  if (chol >= 4.6) return 0;
  if (chol >= 3.6) return 1;
  if (chol >= 2.6) return 2;
  return 3;
}

function conutInterpretation(score: number) {
  // класична інтерпретація CONUT
  if (score <= 1) return { label: "Норма", tone: "green" as const };
  if (score <= 4) return { label: "Легкий дефіцит", tone: "yellow" as const };
  if (score <= 8) return { label: "Помірний дефіцит", tone: "orange" as const };
  return { label: "Виражений дефіцит", tone: "red" as const };
}
const pill = (t: "green" | "yellow" | "orange" | "red") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

const LS_KEY = "conut_form_v2";

/* ───────────── page ───────────── */
export default function ConutPage() {
  // зберігаємо як РЯДКИ → поле може бути порожнім
  const [albStr, setAlbStr] = useState("");
  const [lymphStr, setLymphStr] = useState("");
  const [cholStr, setCholStr] = useState("");

  const [score, setScore] = useState<number | null>(null);
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // відновлення з localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.albStr === "string") setAlbStr(v.albStr);
        if (typeof v.lymphStr === "string") setLymphStr(v.lymphStr);
        if (typeof v.cholStr === "string") setCholStr(v.cholStr);
      }
    } catch {}
  }, []);
  // збереження
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ albStr, lymphStr, cholStr }));
  }, [albStr, lymphStr, cholStr]);

  // парсинг
  const alb = toNum(albStr);     // г/л
  const lymph = toNum(lymphStr); // ×10^9/л
  const chol = toNum(cholStr);   // ммоль/л

  // валідація (реалістичні діапазони)
  const albOk = alb != null && inRange(alb, 10, 60);
  const lymphOk = lymph != null && inRange(lymph, 0.1, 6);
  const cholOk = chol != null && inRange(chol, 1, 12);
  const ready = albOk && lymphOk && cholOk;

  // авто-розрахунок
  useEffect(() => {
    if (ready) {
      const s =
        albuminScore(alb as number) +
        lymphScore(lymph as number) +
        cholScore(chol as number);
      setScore(s);
      if (!scrolledOnce.current) {
        resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledOnce.current = true;
      }
    } else {
      setScore(null);
    }
  }, [alb, lymph, chol, ready]);

  // прогрес
  const progress = useMemo(
    () => [albStr, lymphStr, cholStr].filter((s) => s.trim()).length,
    [albStr, lymphStr, cholStr]
  );

  const onReset = () => {
    setAlbStr("");
    setLymphStr("");
    setCholStr("");
    setScore(null);
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (score == null) return;
    const it = conutInterpretation(score);
    const text = `CONUT: ${score} — ${it.label} (альбумін ${alb} г/л, лімфоцити ${lymph}×10^9/л, холестерин ${chol} ммоль/л)`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(text);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-2">CONUT (Controlling Nutritional Status)</h1>
      <p className="text-gray-600 mb-4">
        Введіть альбумін, кількість лімфоцитів і загальний холестерин — бал
        розрахується автоматично. Десятковий роздільник — «,» або «.».
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(progress / 3) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6 space-y-4">
        <div>
          <label className="block mb-1 font-semibold">
            Альбумін (г/л)
          </label>
          <input
            inputMode="decimal"
            placeholder="напр., 37.5"
            value={albStr}
            onChange={(e) => setAlbStr(sanitizeDecimalInput(e.target.value))}
            className={`p-2 rounded-lg border w-full ${albStr && !albOk ? "border-red-400" : ""}`}
          />
          <p className="text-xs text-gray-500 mt-1">Допустимо: 10–60 г/л.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">
              Лімфоцити (×10^9/л)
            </label>
            <input
              inputMode="decimal"
              placeholder="напр., 1.4"
              value={lymphStr}
              onChange={(e) => setLymphStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${lymphStr && !lymphOk ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Допустимо: 0.1–6.0 ×10^9/л.</p>
          </div>
          <div>
            <label className="block mb-1 font-semibold">
              Загальний холестерин (ммоль/л)
            </label>
            <input
              inputMode="decimal"
              placeholder="напр., 4.2"
              value={cholStr}
              onChange={(e) => setCholStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${cholStr && !cholOk ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Допустимо: 1–12 ммоль/л.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200"
          >
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={score == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              score != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={score != null ? "Скопіювати результат" : "Заповніть усі поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-xl md:text-2xl font-bold">
            CONUT:&nbsp;<span className="font-mono">{score ?? "—"}</span>
          </div>

          {score != null ? (
            <div className="mt-3 inline-flex items-center gap-2">
              {(() => {
                const it = conutInterpretation(score);
                return <span className={`px-3 py-1 rounded-full ${pill(it.tone)}`}>{it.label}</span>;
              })()}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-600">
              Введіть усі три показники для автоматичного розрахунку.
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Результат довідковий і не замінює консультацію лікаря.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивних шкал
        </Link>
      </div>
    </div>
  );
}
