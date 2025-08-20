"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ----------------------------- Дані анкети ----------------------------- */

type Choice = { label: string; points: number };
type Q = { id: string; label: string; choices: Choice[]; required?: boolean };

const QUESTIONS: Q[] = [
  {
    id: "q1",
    label: "1. Зниження маси тіла за останні 6 місяців",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Так, <5%", points: 1 },
      { label: "Так, 5–10%", points: 2 },
      { label: "Так, >10%", points: 3 },
    ],
    required: true,
  },
  {
    id: "q2",
    label: "2. Зниження харчування останні 2 тижні",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Легке зниження", points: 1 },
      { label: "Помірне зниження", points: 2 },
      { label: "Виражене зниження", points: 3 },
    ],
    required: true,
  },
  {
    id: "q3",
    label: "3. Симптоми з боку ШКТ (≥2 тижні)",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Легкі (нудота, ↓апетит)", points: 1 },
      { label: "Помірні (нудота/діарея/блювання)", points: 2 },
      { label: "Виражені (неможливість їсти)", points: 3 },
    ],
    required: true,
  },
  {
    id: "q4",
    label: "4. Функціональний статус",
    choices: [
      { label: "Звичайний", points: 0 },
      { label: "Мінімально знижений", points: 1 },
      { label: "Обмеження активності", points: 2 },
      { label: "Постільний режим", points: 3 },
    ],
    required: true,
  },
  {
    id: "q5",
    label: "5. Підшкірна жирова клітковина",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Легке зменшення", points: 1 },
      { label: "Помірне зменшення", points: 2 },
      { label: "Виражене зменшення", points: 3 },
    ],
    required: true,
  },
  {
    id: "q6",
    label: "6. М’язова маса (дельти, квадрицепс тощо)",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Легке зменшення", points: 1 },
      { label: "Помірне зменшення", points: 2 },
      { label: "Виражене зменшення", points: 3 },
    ],
    required: true,
  },
  {
    id: "q7",
    label: "7. Набряки/асцит",
    choices: [
      { label: "Ні", points: 0 },
      { label: "Легкі (локальні, кілька кг)", points: 1 },
      { label: "Помірні (генералізовані, асцит)", points: 2 },
      { label: "Виражені (масивні, аназарка)", points: 3 },
    ],
    required: true,
  },
];

const INTERPRET = [
  { min: 0, max: 5, label: "A — Нормальний харчовий статус", color: "green" as const },
  { min: 6, max: 12, label: "B — Помірна недостатність харчування", color: "yellow" as const },
  { min: 13, max: 21, label: "C — Виражена недостатність харчування", color: "red" as const },
];

const pill = (c: "green" | "yellow" | "red") =>
  c === "green"
    ? "bg-green-100 text-green-900"
    : c === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : "bg-red-100 text-red-900";

const LS_KEY = "sga_full_v3";

/* ------------------------------ Компонент ------------------------------ */

export default function SGAFullPage() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  const resRef = useRef<HTMLDivElement | null>(null);
  const firstTimeComplete = useRef(false);

  // завантаження збережених відповідей
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.answers)) setAnswers(parsed.answers);
      }
    } catch {}
  }, []);

  // автозбереження
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ answers }));
  }, [answers]);

  const setAns = (i: number, v: number) =>
    setAnswers((prev) => {
      const copy = [...prev];
      copy[i] = v;
      return copy;
    });

  const requiredCount = QUESTIONS.length;
  const answeredCount = answers.filter((v) => v != null).length;
  const allAnswered = answeredCount === requiredCount;

  // підрахунок балів
  const total = useMemo(
    () =>
      answers.reduce((sum, v, idx) => (v == null ? sum : sum + QUESTIONS[idx].choices[v].points), 0),
    [answers]
  );

  const interp = useMemo(() => {
    const x = INTERPRET.find((i) => total >= i.min && total <= i.max);
    return x ?? { label: "Помилка оцінки", color: "red" as const };
  }, [total]);

  // авто-скрол, коли вперше все заповнено
  useEffect(() => {
    if (allAnswered && !firstTimeComplete.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      firstTimeComplete.current = true;
    }
  }, [allAnswered]);

  const onCopy = async () => {
    const text = `SGA (повна): ${total}/21 — ${interp.label}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано у буфер обміну.");
    } catch {
      alert(text);
    }
  };

  const onReset = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    firstTimeComplete.current = false;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-2">SGA — Subjective Global Assessment (повна)</h1>
      <p className="text-gray-600 mb-4">
        7 доменів, кожен оцінюється 0–3 бали. Заповніть усі пункти. Підсумок автоматично
        оновлюється нижче.
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {answeredCount} / {requiredCount}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(answeredCount / requiredCount) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow space-y-5">
        {QUESTIONS.map((q, idx) => {
          const sel = answers[idx];
          const missing = q.required && sel == null;
          return (
            <div key={q.id} className={missing ? "border-l-4 border-red-400 pl-3" : ""}>
              <div className="font-medium mb-2">{q.label}</div>
              <div className="flex flex-wrap gap-3">
                {q.choices.map((c, i) => (
                  <label key={i} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name={q.id}
                      checked={sel === i}
                      onChange={() => setAns(idx, i)}
                    />
                    <span className="text-sm">{c.label}</span>
                    <span className="text-xs text-gray-500">({c.points} б.)</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-3 pt-2">
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
            disabled={!allAnswered}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              allAnswered ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={allAnswered ? "Скопіювати результат" : "Заповніть усі пункти"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            Підсумок: <span className="font-mono">{total}</span> / 21
          </div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${pill(interp.color)}`}>{interp.label}</span>
          </div>
          {!allAnswered && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              Заповніть усі обовʼязкові пункти для коректної інтерпретації.
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
