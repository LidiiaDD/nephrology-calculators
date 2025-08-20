"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  "1. Якість вашого сну за останній тиждень?",
  "2. Ваш емоційний стан (відчуття тривоги, напруги)?",
  "3. Відчуття втоми протягом дня?",
  "4. Ваш настрій за останній тиждень?",
  "5. Задоволеність спілкуванням із родиною?",
  "6. Задоволеність спілкуванням із друзями?",
  "7. Задоволеність роботою (або навчанням)?",
  "8. Здатність справлятись із щоденними справами?",
  "9. Відчуття підтримки з боку оточення?",
  "10. Задоволеність своїм фізичним станом?",
  "11. Частота негативних думок?",
  "12. Частота появи радості, задоволення?",
  "13. Наскільки часто вам хотілось уникати людей?",
  "14. Чи відчуваєте ви себе самотньо?",
  "15. Як часто ви турбуєтесь про своє здоровʼя?",
  "16. Загальна якість життя за останній тиждень?",
];

const OPTIONS = [
  { v: 0, label: "0 — Взагалі ні / Дуже добре" },
  { v: 1, label: "1 — Рідко / Добре" },
  { v: 2, label: "2 — Іноді / Посередньо" },
  { v: 3, label: "3 — Часто / Погано" },
  { v: 4, label: "4 — Постійно / Дуже погано" },
];

type Choice = "" | 0 | 1 | 2 | 3 | 4;

export default function Pdqli16Page() {
  const [answers, setAnswers] = useState<Choice[]>(
    Array<Choice>(QUESTIONS.length).fill("")
  );

  const answeredCount = useMemo(
    () => answers.filter((a) => a !== "").length,
    [answers]
  );
  const total = useMemo(
    () =>
      answers.reduce((acc, a) => (a === "" ? acc : acc + Number(a)), 0),
    [answers]
  );

  // класи для бейджів (як у наших інших калькуляторах)
  const BAND_STYLES: Record<
    "ok" | "mild" | "moderate" | "severe",
    { chip: string; text: string }
  > = {
    ok: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", text: "У межах норми" },
    mild: { chip: "bg-amber-50 text-amber-700 ring-amber-200", text: "Легкі порушення" },
    moderate: { chip: "bg-orange-50 text-orange-700 ring-orange-200", text: "Помірні порушення" },
    severe: { chip: "bg-red-50 text-red-700 ring-red-200", text: "Виражені порушення" },
  };

  const interp = useMemo(() => {
    // Чим ВИЩА сума — тим гірший стан
    if (total <= 16) {
      return {
        key: "ok" as const,
        advice:
          "Показники не свідчать про виражені порушення психоемоційного стану.",
      };
    }
    if (total <= 32) {
      return {
        key: "mild" as const,
        advice:
          "Є ознаки легких порушень. Доречно звернути увагу на сон, баланс навантажень, соціальну підтримку.",
      };
    }
    if (total <= 48) {
      return {
        key: "moderate" as const,
        advice:
          "Помірні порушення. Рекомендована консультація фахівця та індивідуальний план підтримки.",
      };
    }
    return {
      key: "severe" as const,
      advice:
        "Виражені порушення. Доцільно звернутися по професійну допомогу (психолог/психотерапевт) та обговорити стан із лікарем.",
    };
  }, [total]);

  const handleChoose = (idx: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value as Choice;
      return next;
    });
  };

  const handleReset = () => {
    setAnswers(Array<Choice>(QUESTIONS.length).fill(""));
  };

  const handleCopy = async () => {
    const text =
      `Анкета якості життя (16 пунктів)\n` +
      `Заповнено: ${answeredCount}/${QUESTIONS.length}\n` +
      `Сума балів: ${total} із 64\n` +
      `Інтерпретація: ${BAND_STYLES[interp.key].text}\n` +
      `Рекомендація: ${interp.advice}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Зведення скопійовано в буфер обміну.");
    } catch {
      alert("Не вдалося скопіювати.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Анкета оцінки якості життя пацієнтів з додіалізною ХХН
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Поля спочатку порожні. Оберіть одну відповідь у кожному пункті
          (0–4). Чим більше балів — тим гірший психоемоційний стан.
        </p>
      </header>

      {/* Прогрес */}
      <div className="mb-6 rounded-2xl border p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Заповнено: {answeredCount}/{QUESTIONS.length}
          </span>
          <span className="tabular-nums">{Math.round((answeredCount / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Питання */}
      <div className="space-y-4">
        {QUESTIONS.map((q, idx) => (
          <fieldset key={idx} className="rounded-2xl border p-4">
            <legend className="mb-3 font-medium">{q}</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {OPTIONS.map((opt) => {
                const id = `q${idx}-opt${opt.v}`;
                const selected = answers[idx] === opt.v;
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition ${
                      selected
                        ? "border-blue-500 ring-1 ring-blue-200 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`q-${idx}`}
                      className="h-4 w-4"
                      checked={selected}
                      onChange={() => handleChoose(idx, opt.v)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Результат — уніфікована біла картка */}
      <section className="mt-8 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Результат</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Копіювати
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Скинути
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Сума балів</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {total}
              <span className="text-base font-medium text-gray-500"> / 64</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Заповнено пунктів: {answeredCount}/{QUESTIONS.length}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Інтерпретація</div>
            <div
              className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${BAND_STYLES[interp.key].chip}`}
            >
              {BAND_STYLES[interp.key].text}
            </div>
            <p className="mt-2 text-sm text-gray-700">{interp.advice}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Результат є довідковим і не замінює консультацію лікаря.
        </p>
      </section>

      {/* Attribution — маленька сіра плашка як у решти */}
      <div className="mt-6 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
        Анкета створена на кафедрі нефрології та нирковозамісної терапії НУОЗ
        України імені П.&nbsp;Л.&nbsp;Шупика.
      </div>

      <div className="mt-6">
        <Link
          href="/mental"
          className="text-blue-700 underline-offset-4 hover:underline"
        >
          ← Назад до психоемоційних шкал
        </Link>
      </div>
    </div>
  );
}
