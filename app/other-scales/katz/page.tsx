"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type Tone = "success" | "warning" | "danger";
type Answer = "indep" | "dep" | null;

const ITEMS = [
  { id: 1, label: "Купання" },
  { id: 2, label: "Одягання" },
  { id: 3, label: "Туалет" },
  { id: 4, label: "Мобільність (пересаджування/переміщення)" },
  { id: 5, label: "Контроль дефекації" },
  { id: 6, label: "Контроль сечовипускання" },
  { id: 7, label: "Харчування" },
] as const;

export default function KatzADLPage() {
  const [answers, setAnswers] = useState<Answer[]>(
    Array(ITEMS.length).fill(null)
  );

  const answered = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );
  const score = useMemo(
    () => answers.filter((a) => a === "indep").length,
    [answers]
  );
  const progress = Math.round((answered / ITEMS.length) * 100);

  const klass = useMemo<{ tag: string; tone: Tone }>(() => {
    if (score >= 6) return { tag: "Повна незалежність", tone: "success" };
    if (score >= 4) return { tag: "Помірна залежність", tone: "warning" };
    return { tag: "Виражена залежність", tone: "danger" };
  }, [score]);

  function setAnswer(idx: number, value: Answer) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function resetForm() {
    setAnswers(Array(ITEMS.length).fill(null));
  }

  async function copyResult() {
    const lines = ITEMS.map((it, i) => {
      const a = answers[i];
      const t =
        a === "indep"
          ? "самостійно"
          : a === "dep"
          ? "потребує допомоги / не виконує"
          : "—";
      return `${i + 1}. ${it.label}: ${t}`;
    });
    const txt =
      `Katz ADL (базова ПДА)\n` +
      `Бал: ${score} / ${ITEMS.length}\n` +
      `Клас: ${klass.tag}\n\n` +
      lines.join("\n");
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Katz ADL — індекс базової повсякденної активності
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Поля спочатку порожні. Для кожного пункту оберіть варіант відповіді.
        Підрахунок і прогрес оновлюються миттєво.
      </p>

      {/* Верхній прогрес */}
      <div className="mt-6 rounded-2xl border p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>
            Заповнено: {answered} / {ITEMS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Ліва колонка — питання */}
        <section className="space-y-4">
          {ITEMS.map((q, idx) => {
            const val = answers[idx];
            const isEmpty = val === null;
            return (
              <div
                key={q.id}
                data-card="adl-item"
                className={`rounded-2xl border p-4 transition ${
                  isEmpty ? "border-amber-300 bg-amber-50/40" : "border-gray-200"
                }`}
              >
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 font-medium text-gray-700">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-800">{q.label}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswer(idx, "indep")}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      val === "indep"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    aria-pressed={val === "indep"}
                  >
                    Самостійно
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(idx, "dep")}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      val === "dep"
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    aria-pressed={val === "dep"}
                  >
                    Потребує допомоги / не виконує
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Скинути
            </button>
          </div>
        </section>

        {/* Права колонка — результат */}
        <section className="space-y-4">
          <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Результат</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Сумарний бал</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {score} / {ITEMS.length}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Заповнено</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {answered} / {ITEMS.length}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Badge tone={klass.tone}>{klass.tag}</Badge>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>6–7 балів — повна незалежність.</li>
              <li>4–5 балів — помірна залежність.</li>
              <li>0–3 бали — виражена залежність.</li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyResult}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Копіювати
              </button>
              <a
                href="#check"
                onClick={(e) => {
                  e.preventDefault();
                  const firstEmpty = answers.findIndex((a) => a === null);
                  if (firstEmpty >= 0) {
                    const cards = document.querySelectorAll(
                      "[data-card='adl-item']"
                    );
                    const el = cards[firstEmpty] as HTMLElement | undefined;
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Перевірити заповнення
              </a>
            </div>

            <div className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Результат є довідковим і не замінює консультацію лікаря.
            </div>
          </div>

          <div className="rounded-2xl border p-4 text-xs text-gray-600">
            Джерело: Katz S. <i>Studies of illness in the aged</i>. JAMA, 1963
            (адаптована українська версія інтерфейсу).
          </div>
        </section>
      </div>

      <div className="mt-8">
        <Link
          href="/other-scales"
          className="text-gray-600 underline-offset-4 hover:text-blue-700 hover:underline"
        >
          ← Назад до інших шкал
        </Link>
      </div>
    </div>
  );
}

/** Маленький компонент бейджа для інтерпретації */
function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  const map: Record<Tone, string> = {
    success: "bg-green-100 text-green-800 ring-green-200",
    warning: "bg-amber-100 text-amber-800 ring-amber-200",
    danger: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ring-1 ${map[tone]}`}
    >
      {children}
    </span>
  );
}
