"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── Дані DSI ───────── */
const SYMPTOMS = [
  "Свербіж шкіри",
  "Почервоніння/висипи",
  "Сухість шкіри",
  "Сухість у роті",
  "Нудота",
  "Блювання",
  "Втрачений апетит",
  "Зміна смаку",
  "Відрижка/печія",
  "Запор",
  "Діарея",
  "Біль у шлунку/животі",
  "М'язові спазми/судоми",
  "Біль у м'язах/суглобах",
  "Оніміння/поколювання рук чи ніг",
  "Слабкість у ногах",
  "Задишка",
  "Кашель",
  "Біль у грудях",
  "Головний біль",
  "Запаморочення/нестійкість",
  "Проблеми зі сном",
  "Пробудження вночі",
  "Нічні походи в туалет",
  "Втома/сонливість",
  "Почуття занепокоєння",
  "Дратівливість",
  "Сум, депресія",
  "Проблеми з пам'яттю",
  "Зниження статевого потягу",
];

const OPTIONS = [
  { value: 0, label: "0 — Немає" },
  { value: 1, label: "1 — Трохи турбує" },
  { value: 2, label: "2 — Помірно турбує" },
  { value: 3, label: "3 — Сильно турбує" },
  { value: 4, label: "4 — Дуже сильно турбує" },
];

const LS_KEY = "dsi_v3";

type Tone = "green" | "yellow" | "orange" | "red";
const pill = (t: Tone) =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

// Орієнтовне бандування за середнім балом (0–4)
function meanBand(mean: number): { label: string; tone: Tone } {
  if (mean < 1) return { label: "мінімальна вираженість", tone: "green" };
  if (mean < 2) return { label: "легка вираженість", tone: "yellow" };
  if (mean < 3) return { label: "помірна вираженість", tone: "orange" };
  return { label: "виражена симптоматика", tone: "red" };
}

/* ───────── Компонент ───────── */
export default function DSIPage() {
  // null = відповідь не обрана (щоб поля були ПУСТІ за замовчуванням)
  const [answers, setAnswers] = useState<Array<number | null>>(
    Array(SYMPTOMS.length).fill(null)
  );
  const [touched, setTouched] = useState(false);

  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // Відновлення / збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.answers) && parsed.answers.length === SYMPTOMS.length) {
          setAnswers(parsed.answers);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ answers }));
  }, [answers]);

  // Обробник вибору
  const setAns = (idx: number, val: number) => {
    setTouched(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Метрики
  const maxScore = SYMPTOMS.length * 4;
  const answeredCount = useMemo(() => answers.filter((v) => v != null).length, [answers]);
  const allAnswered = answeredCount === SYMPTOMS.length;

  const totalScore = useMemo(
    () =>
      answers.reduce<number>((s, v) => {
        return s + (v ?? 0);
      }, 0),
    [answers]
  );

  const presentCount = useMemo(
    () => answers.filter((v) => (v ?? 0) > 0).length,
    [answers]
  );

  const meanSeverity = useMemo(() => {
    if (!answeredCount) return null;
    return totalScore / answeredCount; // середній бал серед заповнених пунктів
  }, [totalScore, answeredCount]);

  const rankedTop3 = useMemo(() => {
    return answers
      .map((v, i) => ({ i, v: v ?? -1 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || a.i - b.i)
      .slice(0, 3)
      .map((x) => `${SYMPTOMS[x.i]} (${x.v})`);
  }, [answers]);

  // Автоскрол, коли вперше все заповнили
  useEffect(() => {
    if (allAnswered && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [allAnswered]);

  const onReset = () => {
    setAnswers(Array(SYMPTOMS.length).fill(null));
    setTouched(false);
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const parts: string[] = [];
    parts.push(`DSI: ${totalScore}/${maxScore}`);
    parts.push(`Заповнено: ${answeredCount}/${SYMPTOMS.length}`);
    parts.push(`Симптомів з балом >0: ${presentCount}`);
    if (meanSeverity != null) {
      const band = meanBand(meanSeverity);
      parts.push(`Середня вираженість: ${meanSeverity.toFixed(2)}/4 — ${band.label}`);
    }
    if (rankedTop3.length) parts.push(`Найбільш виражені: ${rankedTop3.join(", ")}`);
    const txt = parts.join("; ");
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано у буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  // Прогрес-бар
  const progressPct = (answeredCount / SYMPTOMS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-2">Dialysis Symptom Index (DSI)</h2>
      <p className="text-gray-600 mb-4">
        Оцініть, наскільки кожен симптом турбує за останній період (0 — немає, 4 — дуже сильно).
        Підрахунок іде автоматично — результат нижче.
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {answeredCount} / {SYMPTOMS.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressPct || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-5">
        {SYMPTOMS.map((q, idx) => {
          const sel = answers[idx];
          const missing = touched && sel == null;
          return (
            <div key={idx} className={missing ? "border-l-4 border-red-400 pl-3" : ""}>
              <div className="font-medium mb-2">{idx + 1}. {q}</div>
              <div className="flex flex-wrap gap-4">
                {OPTIONS.map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q${idx}`}
                      checked={sel === opt.value}
                      onChange={() => setAns(idx, opt.value)}
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
            className="rounded-xl px-5 py-2 font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            title="Скопіювати короткий підсумок"
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результати */}
      <div ref={resRef} className="mt-6 space-y-4" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            Сумарний бал:&nbsp;<span className="font-mono">{totalScore}</span> / {maxScore}
          </div>

          <div className="mt-2 text-sm text-gray-700">
            Заповнено пунктів: <span className="font-mono">{answeredCount}</span> / {SYMPTOMS.length} ·
            &nbsp;Симптомів з балом &gt; 0:&nbsp;<span className="font-mono">{presentCount}</span>
          </div>

          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span>Середня вираженість (0–4):</span>
            <span className="font-mono">{meanSeverity != null ? meanSeverity.toFixed(2) : "—"}</span>
            {meanSeverity != null && (
              <span className={`px-3 py-1 rounded-full ${pill(meanBand(meanSeverity).tone)}`}>
                {meanBand(meanSeverity).label}
              </span>
            )}
          </div>

          {rankedTop3.length > 0 && (
            <div className="mt-3 text-sm">
              ТОП-симптоми:&nbsp;
              <span className="font-mono">{rankedTop3.join(", ")}</span>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Примітка: бали DSI не є діагнозом; інтерпретуйте з урахуванням клінічного контексту та динаміки.
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
