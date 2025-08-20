"use client";

import React, { useMemo, useRef, useState } from "react";

/** ─────────────────────────  КРИТЕРІЇ КРИХКОСТІ  ─────────────────────────
 * Відмітьте "Так", якщо дефіцит ПРИСУТНІЙ, "Ні" — якщо відсутній.
 * Порожні пункти підсвічуються й враховуються у прогресі заповнення.
 */

const CRITERIA = [
  "Слабкість / зниження сили хвата",
  "Сповільнення при ходьбі",
  "Втрата ваги за останній рік",
  "Втомлюваність / зниження витривалості",
  "Мало фізичної активності",
  "Складнощі з підйомом зі стільця",
  "Поганий апетит",
  "Порушення рівноваги",
  "Проблеми з пам’яттю чи увагою",
  "Залежність від сторонньої допомоги у щоденній активності",
] as const;

type Answer = boolean | null; // true=дефіцит є, false=немає, null=не заповнено

/** Інтерпретація (пороги як у вашій версії) */
function interpret(count: number) {
  if (count <= 2) return { label: "Мінімальні/немає ознак крихкості", tone: "bg-green-100 text-green-800" };
  if (count <= 4) return { label: "Префрейл — проміжна крихкість", tone: "bg-amber-100 text-amber-800" };
  return { label: "Синдром крихкості (frailty)", tone: "bg-red-100 text-red-800" };
}

export default function FrailtyIndexPage() {
  const [answers, setAnswers] = useState<Answer[]>(
    Array(CRITERIA.length).fill(null)
  );
  const [highlightMissing, setHighlightMissing] = useState(false);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  const totalDeficits = useMemo(
    () => answers.filter((a) => a === true).length,
    [answers]
  );
  const completed = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );
  const progress = Math.round((completed / CRITERIA.length) * 100);
  const firstEmpty = useMemo(
    () => answers.findIndex((a) => a === null),
    [answers]
  );
  const interp = interpret(totalDeficits);

  const setAnswer = (idx: number, val: boolean) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });

  const goFirstEmpty = () => {
    if (firstEmpty < 0) return;
    const el = refs.current[firstEmpty];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetAll = () => {
    setAnswers(Array(CRITERIA.length).fill(null));
    setHighlightMissing(false);
  };

  const copyResult = async () => {
    const lines = [
      "Frailty Index — зведення:",
      `Дефіцитів: ${totalDeficits} / ${CRITERIA.length}`,
      `Клас: ${interp.label}`,
      "",
      "Перелік відмічених дефіцитів:",
      ...CRITERIA.map((c, i) => `${answers[i] ? "✓" : "—"} ${c}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {}
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Frailty Index — індекс крихкості (10 критеріїв)
      </h1>
      <p className="mt-2 text-gray-600">
        Для кожного критерію оберіть <b>Так</b> (дефіцит є) або <b>Ні</b> (дефіциту немає).
        Поля спочатку порожні; результат і прогрес оновлюються миттєво.
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Ліва колонка — критерії */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Заповнено: {completed} / {CRITERIA.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {CRITERIA.map((label, idx) => {
            const val = answers[idx];
            const missing = val === null && highlightMissing;
            return (
              <div
                key={idx}
                ref={(el) => (refs.current[idx] = el)}
                className={`rounded-2xl border p-4 transition ${
                  missing ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"
                }`}
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
                    Так (дефіцит є)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(idx, false)}
                    aria-pressed={val === false}
                    className={`rounded-full border px-3 py-2 text-sm transition
                      ${val === false
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Ні (дефіциту немає)
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3">
            {completed < CRITERIA.length && (
              <button
                onClick={() => { setHighlightMissing(true); goFirstEmpty(); }}
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

        {/* Права колонка — sticky прогрес + результати */}
        <aside className="space-y-6">
          <div className="sticky top-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Заповнено: {completed} / {CRITERIA.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {completed < CRITERIA.length && (
              <p className="mt-3 text-xs text-amber-700">
                Є незаповнені пункти — натисніть «До першого незаповненого».
              </p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Результат</h2>

            <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Кількість дефіцитів</span>
              <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-sm text-indigo-700">
                {totalDeficits} / {CRITERIA.length}
              </span>
            </div>

            <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Клас</span>
              <span className={`rounded-md px-2 py-1 text-sm ${interp.tone}`}>
                {interp.label}
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={copyResult}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Копіювати
              </button>
              <button
                onClick={() => { setHighlightMissing(true); goFirstEmpty(); }}
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
