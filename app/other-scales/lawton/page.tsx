"use client";

import React, { useMemo, useRef, useState } from "react";

/** Lawton IADL — 8 пунктів, true=самостійно (1 бал), false=потребує допомоги (0), null=пусто */
const ITEMS = [
  "Вміння користуватися телефоном",
  "Покупки",
  "Приготування їжі",
  "Прибирання",
  "Прання",
  "Користування транспортом",
  "Ведення фінансів",
  "Прийом ліків",
] as const;

type Answer = boolean | null;

function interpret(score: number) {
  if (score === 8) return { label: "Повна незалежність", tone: "bg-green-100 text-green-800" };
  if (score >= 5) return { label: "Помірна залежність", tone: "bg-amber-100 text-amber-800" };
  return { label: "Виражена залежність", tone: "bg-red-100 text-red-800" };
}

export default function LawtonIADLPage() {
  const [answers, setAnswers] = useState<Answer[]>(
    Array(ITEMS.length).fill(null)
  );
  const [highlight, setHighlight] = useState(false);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  const completed = useMemo(() => answers.filter(a => a !== null).length, [answers]);
  const score = useMemo(() => answers.filter(a => a === true).length, [answers]);
  const progress = Math.round((completed / ITEMS.length) * 100);
  const firstEmpty = useMemo(() => answers.findIndex(a => a === null), [answers]);
  const interp = interpret(score);

  const setAnswer = (idx: number, val: boolean) =>
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });

  const goFirstEmpty = () => {
    if (firstEmpty < 0) return;
    const el = refs.current[firstEmpty];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-red-300");
    setTimeout(() => el?.classList.remove("ring-2", "ring-red-300"), 1200);
  };

  const resetAll = () => {
    setAnswers(Array(ITEMS.length).fill(null));
    setHighlight(false);
  };

  const copyResult = async () => {
    const lines = [
      "Lawton IADL:",
      ...ITEMS.map((q, i) => `${i + 1}. ${q}: ${answers[i] === null ? "—" : answers[i] ? "самостійно" : "потребує допомоги"}`),
      `Сумарний бал: ${score} / 8`,
      `Інтерпретація: ${interp.label}`,
    ];
    try { await navigator.clipboard.writeText(lines.join("\n")); } catch {}
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Lawton IADL — індекс інструментальної повсякденної активності
      </h1>
      <p className="mt-2 text-gray-600">
        Поля спочатку порожні. Оберіть <b>Самостійно</b> або <b>Потребує допомоги</b> для кожного пункту. Підрахунок і прогрес оновлюються миттєво.
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Ліва колонка */}
        <section className="space-y-4">
          {/* Мобільний прогрес-бар (видно лише на мобільних) */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm md:hidden">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Заповнено: {completed} / {ITEMS.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {ITEMS.map((label, idx) => {
            const val = answers[idx];
            const missing = val === null && highlight;
            return (
              <div
                key={idx}
                ref={(el) => (refs.current[idx] = el)}
                className={`rounded-2xl border p-4 transition ${missing ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"}`}
              >
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {idx + 1}
                  </span>
                  <p className="font-medium text-gray-900">{label}</p>
                  {missing && (
                    <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      не заповнено
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswer(idx, true)}
                    aria-pressed={val === true}
                    className={`rounded-full border px-3 py-2 text-sm transition
                      ${val === true
                        ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Самостійно
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(idx, false)}
                    aria-pressed={val === false}
                    className={`rounded-full border px-3 py-2 text-sm transition
                      ${val === false
                        ? "border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Потребує допомоги / не виконує
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3">
            {completed < ITEMS.length && (
              <button
                onClick={() => { setHighlight(true); goFirstEmpty(); }}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700"
              >
                До першого незаповненого
              </button>
            )}
            <button
              onClick={resetAll}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 hover:bg-gray-50"
            >
              Скинути
            </button>
          </div>
        </section>

        {/* Права колонка */}
        <aside className="space-y-6">
          {/* Sticky прогрес-бар (лише md+) */}
          <div className="sticky top-6 hidden rounded-2xl border bg-white p-5 shadow-sm md:block">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Заповнено: {completed} / {ITEMS.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            {completed < ITEMS.length && (
              <p className="mt-3 text-xs text-amber-700">
                Є незаповнені пункти — натисніть «До першого незаповненого».
              </p>
            )}
          </div>

          {/* Результат */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Результат</h2>

            <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Сумарний бал</span>
              <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-sm text-indigo-700">
                {score} / 8
              </span>
            </div>

            <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Інтерпретація</span>
              <span className={`rounded-md px-2 py-1 text-sm ${interp.tone}`}>{interp.label}</span>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={copyResult}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Копіювати
              </button>
              <button
                onClick={() => { setHighlight(true); goFirstEmpty(); }}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Перевірити заповнення
              </button>
            </div>

            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Результат є довідковим і не замінює консультацію лікаря.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
