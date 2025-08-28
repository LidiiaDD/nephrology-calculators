'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Score = 0 | 1 | 2 | 3;
type Ans = Score | null;

/** ДЕФОЛТНІ тексти пунктів GAD-7 (UA) */
const DEFAULT_TEXTS = [
  'Відчуття нервозності, тривоги або “на межі зриву”',
  'Нездатність зупинити або контролювати хвилювання',
  'Надмірне занепокоєння щодо різних справ',
  'Складність розслабитися',
  'Неспокійність, неможливість всидіти на місці',
  'Легко дратуєтесь або стаєте нетерплячими',
  'Відчуття страху, що може статися щось жахливе',
] as const;

/** ДЕФОЛТНІ підписи для варіантів відповіді */
const DEFAULT_OPTION_LABELS = [
  'Ніколи',
  'Кілька днів',
  'Більше ніж половину днів',
  'Майже щодня',
] as const;

/** Мапа рівнів тяжкості → стилі/пояснення */
function severityMeta(total: number) {
  if (total >= 15)
    return {
      label: 'Виражена тривога',
      badge: 'bg-red-100 text-red-800 ring-red-200',
      border: 'border-red-300',
      bg: 'bg-red-50',
      advice: 'Потрібна клінічна оцінка та, ймовірно, направлення/лікування.',
    };
  if (total >= 10)
    return {
      label: 'Помірна тривога',
      badge: 'bg-orange-100 text-orange-800 ring-orange-200',
      border: 'border-orange-300',
      bg: 'bg-orange-50',
      advice: 'Бажана клінічна оцінка; розглянути втручання.',
    };
  if (total >= 5)
    return {
      label: 'Легка тривога',
      badge: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
      border: 'border-yellow-300',
      bg: 'bg-yellow-50',
      advice: 'Спостереження, коротке консультування, самодопомога.',
    };
  return {
    label: 'Мінімальна/відсутня',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    advice: 'Зазвичай специфічне втручання не потрібне.',
  };
}

export default function GAD7Page() {
  /** відповіді (7 пунктів), спочатку порожні */
  const [answers, setAnswers] = useState<Ans[]>(Array(7).fill(null));
  /** тексти пунктів/варіантів — завжди показуємо; при наявності items.local тихо підміняємо */
  const [itemTexts, setItemTexts] = useState<readonly string[]>(DEFAULT_TEXTS);
  const [optionLabels, setOptionLabels] =
    useState<readonly string[]>(DEFAULT_OPTION_LABELS);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('./items.local'); // опційний локальний файл
        if (Array.isArray((mod as any).G_TEXTS) && (mod as any).G_TEXTS.length >= 7) {
          setItemTexts((mod as any).G_TEXTS);
        }
        if (
          Array.isArray((mod as any).OPTION_LABELS) &&
          (mod as any).OPTION_LABELS.length >= 4
        ) {
          setOptionLabels((mod as any).OPTION_LABELS);
        }
      } catch {
        /* файлу може не бути — це ок */
      }
    })();
  }, []);

  const total = useMemo(
    () => answers.reduce<number>((s, v) => s + (v ?? 0), 0),
    [answers]
  );
  const meta = severityMeta(total);
  const unanswered = useMemo(
    () => answers.filter((a) => a === null).length,
    [answers]
  );

  const onPick = (idx: number, val: Score) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[idx] = val;
      return next;
    });
  };

  const onReset = () => setAnswers(Array(7).fill(null));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">GAD-7 — шкала генералізованої тривоги</h1>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Скинути відповіді
        </button>
      </header>

      {/* Результат — кольорова картка (як в інших анкетах) */}
      <section
        className={`mb-8 rounded-2xl border ${meta.border} ${meta.bg} p-5`}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">Сума балів</div>
            <div className="text-5xl font-semibold leading-none">{total}</div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1 ring-inset ${meta.badge}`}
            >
              {meta.label}
            </div>
            <div className="mt-1 text-sm text-gray-700">{meta.advice}</div>
            {unanswered > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Не відповіли на {unanswered} з 7 пунктів.
              </div>
            )}
          </div>
        </div>

        {/* прогрес-бар до 21 */}
        <div className="mt-4 h-2 w-full rounded-full bg-white/60">
          <div
            className="h-2 rounded-full bg-black/20 transition-[width]"
            style={{ width: `${(total / 21) * 100}%` }}
            aria-hidden
          />
        </div>
      </section>

      {/* Пункти опитувальника */}
      <div className="space-y-5">
        {itemTexts.slice(0, 7).map((text, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50/40"
          >
            <div className="mb-3 flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <p className="text-base font-medium">{text}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((v) => {
                const checked = answers[i] === (v as Score);
                return (
                  <label
                    key={v}
                    className={`cursor-pointer select-none rounded-lg border px-3 py-2 text-sm transition
                    ${
                      checked
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={v}
                      className="sr-only"
                      checked={checked}
                      onChange={() => onPick(i, v as Score)}
                    />
                    {optionLabels[v as 0 | 1 | 2 | 3]} <span className="opacity-70">({v})</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-8 text-sm text-gray-500">
        Інтерпретація: 0–4 мінімальна, 5–9 легка, 10–14 помірна, 15–21 виражена тривога.
      </footer>
    </div>
  );
}
