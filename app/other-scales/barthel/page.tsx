"use client";

import React, { useMemo, useState, useRef } from "react";
import Link from "next/link";

/** ─────────────────────────  Модель шкали Barthel  ───────────────────────── **/

type Option = { label: string; points: number };
type Item = { label: string; options: Option[] };

/* 10 пунктів із офіційними вагами */
const ITEMS: Item[] = [
  { label: "Їжа", options: [
      { label: "Без сторонньої допомоги", points: 10 },
      { label: "З мінімальною допомогою", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Купання", options: [
      { label: "Без сторонньої допомоги", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Гігієна (обличчя, зуби)", options: [
      { label: "Без сторонньої допомоги", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Одягання", options: [
      { label: "Без сторонньої допомоги", points: 10 },
      { label: "З частковою допомогою", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Контроль дефекації", options: [
      { label: "Контроль повний", points: 10 },
      { label: "Частковий", points: 5 },
      { label: "Відсутній", points: 0 },
    ] },
  { label: "Контроль сечовипускання", options: [
      { label: "Контроль повний", points: 10 },
      { label: "Частковий", points: 5 },
      { label: "Відсутній", points: 0 },
    ] },
  { label: "Туалет", options: [
      { label: "Без сторонньої допомоги", points: 10 },
      { label: "З мінімальною допомогою", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Переміщення з ліжка на стілець", options: [
      { label: "Без допомоги", points: 15 },
      { label: "З мінімальною допомогою", points: 10 },
      { label: "Значна допомога", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Пересування", options: [
      { label: "Без допомоги", points: 15 },
      { label: "З мінімальною допомогою", points: 10 },
      { label: "Значна допомога", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
  { label: "Сходи", options: [
      { label: "Без сторонньої допомоги", points: 10 },
      { label: "З мінімальною допомогою", points: 5 },
      { label: "Не здатний", points: 0 },
    ] },
];

/** Інтерпретація */
function interpret(score: number) {
  if (score === 100) return { label: "Повна незалежність", tone: "bg-green-100 text-green-800" };
  if (score >= 91) return { label: "Легка залежність", tone: "bg-lime-100 text-lime-800" };
  if (score >= 61) return { label: "Помірна залежність", tone: "bg-yellow-100 text-yellow-800" };
  if (score >= 21) return { label: "Виражена залежність", tone: "bg-orange-100 text-orange-800" };
  return { label: "Повна залежність", tone: "bg-red-100 text-red-800" };
}

/** ─────────────────────────────  Компонент  ───────────────────────────── **/

export default function BarthelPage() {
  // null = не заповнено
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(ITEMS.length).fill(null)
  );
  const [highlightMissing, setHighlightMissing] = useState(false);

  const answered = useMemo(() => answers.filter(v => v !== null).length, [answers]);
  const total = useMemo(
    () =>
      answers.reduce((sum, val, idx) => {
        if (val === null) return sum;
        return sum + ITEMS[idx].options[val].points;
      }, 0),
    [answers]
  );
  const interp = interpret(total);
  const progress = Math.round((answered / ITEMS.length) * 100);

  function select(idx: number, optIdx: number) {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = optIdx;
      return next;
    });
  }

  function reset() {
    setAnswers(Array(ITEMS.length).fill(null));
    setHighlightMissing(false);
  }

  async function copy() {
    const text = `Barthel: ${total}/100 — ${interp.label}`;
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Шкала Barthel — повсякденна активність
      </h1>
      <p className="mt-2 text-gray-600">
        Поля спочатку порожні. Вибір оновлює підрахунок миттєво.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Ліва колонка — анкета */}
        <section className="rounded-2xl border bg-white p-4 md:p-6">
          {/* Компактний індикатор зверху */}
          <div className="mb-4 flex items-center justify-between">
            <div className="font-medium text-gray-700">
              Заповнено: {answered} / {ITEMS.length}
            </div>
            <div className="flex-1 ml-4 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
                aria-label={`Прогрес ${progress}%`}
              />
            </div>
          </div>

          <div className="space-y-5">
            {ITEMS.map((item, idx) => {
              const missing = answers[idx] === null && highlightMissing;
              return (
                <fieldset
                  key={idx}
                  className={`rounded-xl border p-4 transition ${missing ? "ring-2 ring-red-300" : ""}`}
                >
                  <legend className="px-1 text-sm font-semibold text-gray-800">
                    {idx + 1}. {item.label}
                  </legend>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.options.map((opt, i) => {
                      const checked = answers[idx] === i;
                      return (
                        <label key={i}>
                          <input
                            type="radio"
                            className="peer sr-only"
                            name={`item-${idx}`}
                            checked={checked}
                            onChange={() => select(idx, i)}
                          />
                          <span
                            className={`inline-flex select-none items-center rounded-full border px-3 py-1 text-sm transition
                              ${checked
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            {opt.label} {opt.points !== 0 ? `(+${opt.points})` : "(0)"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setHighlightMissing(true)}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              title="Підсвітити незаповнені пункти"
            >
              Підсвітити незаповнені
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Скинути
            </button>
          </div>
        </section>

        {/* Права колонка — sticky ПРОГРЕС + результати */}
        <aside className="space-y-6">
          {/* ВЕЛИКИЙ, ПОМІТНИЙ ПРОГРЕС-БАР */}
          <div className="sticky top-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Заповнено: {answered} / {ITEMS.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {answered < ITEMS.length && (
              <p className="mt-3 text-xs text-amber-700">
                Є незаповнені пункти — підсвітіть їх кнопкою нижче анкети.
              </p>
            )}
          </div>

          {/* Результат */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-medium text-gray-700">Результат</div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-4xl font-extrabold tabular-nums">
                {total} <span className="text-gray-500 text-2xl">/ 100</span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${interp.tone}`}>
                  {interp.label}
                </span>
              </div>

              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
                <li>0–20 — повна залежність</li>
                <li>21–60 — виражена залежність</li>
                <li>61–90 — помірна залежність</li>
                <li>91–99 — легка залежність</li>
                <li>100 — повна незалежність</li>
              </ul>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={copy}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Копіювати
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMissing(true)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Перевірити заповнення
                </button>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Результат є довідковим і не замінює консультацію лікаря.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <Link href="/other-scales" className="text-gray-600 hover:text-blue-700">
          ← Назад до інших шкал
        </Link>
      </div>
    </div>
  );
}
