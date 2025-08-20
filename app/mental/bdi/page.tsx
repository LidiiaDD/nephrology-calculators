"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── Дані опитника ───────── */
const BDI_QUESTIONS: string[] = [
  "Сумний настрій",
  "Песимізм",
  "Почуття невдачі",
  "Незадоволення",
  "Відчуття провини",
  "Самозвинувачення",
  "Думки про покарання",
  "Незадоволення собою",
  "Суїцидальні думки",
  "Часте плачення",
  "Дратівливість",
  "Зниження інтересу",
  "Важко приймати рішення",
  "Відчуття неуспішності",
  "Зниження енергії",
  "Зміни сну",
  "Дратівливість (повторно)",
  "Зміни апетиту",
  "Зниження ваги",
  "Соматичні симптоми",
  "Зниження сексуального інтересу",
];

const OPTIONS = [
  { label: "0 — Відсутнє", points: 0 },
  { label: "1 — Легке", points: 1 },
  { label: "2 — Помірне", points: 2 },
  { label: "3 — Важке", points: 3 },
];

const pill = (tone: "green" | "yellow" | "orange" | "red") =>
  tone === "green"
    ? "bg-green-100 text-green-900"
    : tone === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : tone === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

const LS_KEY = "bdi_v3";

/* ───────── Компонент ───────── */
export default function BDIPage() {
  // null = відповідь не обрана; щоб поля не були заповнені за замовчуванням
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(BDI_QUESTIONS.length).fill(null)
  );
  const [touched, setTouched] = useState(false);

  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // Відновлення/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.answers)) setAnswers(parsed.answers);
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ answers }));
  }, [answers]);

  // Обробники
  const setAns = (idx: number, val: number) => {
    setTouched(true);
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const onReset = () => {
    setAnswers(Array(BDI_QUESTIONS.length).fill(null));
    setTouched(false);
    scrolledOnce.current = false;
  };

  const totalScore = useMemo(
    () =>
      answers.reduce((sum, v) => (v == null ? sum : sum + OPTIONS[v].points), 0),
    [answers]
  );

  const answeredCount = answers.filter((v) => v != null).length;
  const allAnswered = answeredCount === BDI_QUESTIONS.length;

  // Автоскрол, коли вперше все заповнили
  useEffect(() => {
    if (allAnswered && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [allAnswered]);

  // Інтерпретація
  function interpret(score: number) {
    if (score <= 13) return { label: "Відсутня або мінімальна депресія", tone: "green" as const };
    if (score <= 19) return { label: "Легка депресія", tone: "yellow" as const };
    if (score <= 28) return { label: "Помірна депресія", tone: "orange" as const };
    return { label: "Виражена депресія", tone: "red" as const };
  }
  const interp = interpret(totalScore);

  const onCopy = async () => {
    if (!allAnswered) return;
    const txt = `BDI-II: ${totalScore}/63 — ${interp.label}`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано у буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">BDI-II — Beck Depression Inventory</h1>
      <p className="text-gray-600 mb-4">
        Оберіть варіанти для кожного пункту (за останній тиждень). Підрахунок іде автоматично — результат нижче.
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>
            Заповнено: {answeredCount} / {BDI_QUESTIONS.length}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{
              width: `${(answeredCount / BDI_QUESTIONS.length) * 100 || 0}%`,
            }}
          />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-5">
        {BDI_QUESTIONS.map((q, idx) => {
          const sel = answers[idx];
          const missing = touched && sel == null;
          return (
            <div
              key={idx}
              className={missing ? "border-l-4 border-red-400 pl-3" : ""}
            >
              <div className="font-medium mb-2">
                {idx + 1}. {q}
              </div>
              <div className="flex flex-wrap gap-4">
                {OPTIONS.map((opt, i) => (
                  <label key={i} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q${idx}`}
                      checked={sel === i}
                      onChange={() => setAns(idx, i)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

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
            disabled={!allAnswered}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              allAnswered
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500"
            }`}
            title={
              allAnswered
                ? "Скопіювати підсумок"
                : "Заповніть усі пункти, щоб скопіювати"
            }
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            Сумарний бал BDI-II:&nbsp;
            <span className="font-mono">{totalScore}</span> / 63
          </div>

          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${pill(interp.tone)}`}>
              {interp.label}
            </span>
            {!allAnswered && (
              <span className="text-gray-500">
                (заповніть усі пункти для коректної інтерпретації)
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-gray-500">
            BDI-II — скринінговий інструмент і не є діагнозом. Якщо у вас або
            пацієнта є виражений дистрес чи думки про самопошкодження — зверніться по
            допомогу до фахівця або на локальну гарячу лінію підтримки.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/mental" className="text-gray-600 hover:text-blue-700">
          ← Назад до психоемоційного стану
        </Link>
      </div>
    </div>
  );
}
