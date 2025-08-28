"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";

/** --- Дані анкети (українська локалізація) --- */
type Option = { label: string; score: 0 | 1 | 2 };

const SECTIONS = [
  {
    title: "Мʼязова сила / перенесення",
    items: [
      {
        q: "Наскільки важко підняти та перенести ~5 кг (наприклад, пакет продуктів)?",
        options: [
          { label: "Без труднощів", score: 0 },
          { label: "Трохи важко", score: 1 },
          { label: "Важко / не можу", score: 2 },
        ] as Option[],
      },
    ],
  },
  {
    title: "Рухливість та повсякденна активність",
    items: [
      {
        q: "Яка у вас швидкість ходьби у повсякденні?",
        options: [
          { label: "Звичайна, без труднощів", score: 0 },
          { label: "Повільніша, але самостійно", score: 1 },
          { label: "Дуже повільно / не можу", score: 2 },
        ] as Option[],
      },
      {
        q: "Чи важко вам вставати зі стільця або з ліжка?",
        options: [
          { label: "Без труднощів", score: 0 },
          { label: "Трохи важко", score: 1 },
          { label: "Дуже важко / не можу", score: 2 },
        ] as Option[],
      },
      {
        q: "Наскільки важко підніматися по сходах?",
        options: [
          { label: "Без труднощів", score: 0 },
          { label: "Трохи важко", score: 1 },
          { label: "Дуже важко / не можу", score: 2 },
        ] as Option[],
      },
    ],
  },
  {
    title: "Падіння",
    items: [
      {
        q: "Як часто ви падали за останній рік?",
        options: [
          { label: "Ніколи", score: 0 },
          { label: "1–3 рази", score: 1 },
          { label: "4+ разів", score: 2 },
        ] as Option[],
      },
    ],
  },
] as const;

type Answer = 0 | 1 | 2 | null;

/** ——— Допоміжні компоненти ——— */
function Badge({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "green" | "red" | "yellow" | "blue";
  children: React.ReactNode;
}) {
  const palettes = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${palettes[tone]}`}
    >
      {children}
    </span>
  );
}

/** ——— Сторінка ——— */
export default function Page() {
  // Плоский список питань для керування станом
  const flatQuestions = useMemo(
    () => SECTIONS.flatMap((s) => s.items.map((it) => it.q)),
    []
  );

  const [answers, setAnswers] = useState<Answer[]>(
    Array(flatQuestions.length).fill(null)
  );

  const radiosRefs = useRef<Array<HTMLDivElement | null>>([]);

  const answeredCount = answers.filter((v) => v !== null).length;
  const progress = Math.round((answeredCount / answers.length) * 100);

  // ✅ фікс типів: акумулятор number
  const totalScore = useMemo(
    () =>
      answers.reduce<number>((sum, v) => {
        return sum + (v ?? 0);
      }, 0),
    [answers]
  );

  const sarcFPositive = totalScore >= 4;

  function interpret(score: number) {
    if (score >= 4) {
      return {
        label: "Високий ризик саркопенії (SARC-F ≥ 4)",
        tone: "red" as const,
        tips:
          "Позитивний скринінг. Розгляньте детальну оцінку м’язової маси/сили та фізичної функції (EWGSOP2): HGS, SPPB/4-метрів, DXA/БІА; корекцію харчування та фізичної активності.",
      };
    }
    return {
      label: "Низький ризик (SARC-F < 4)",
      tone: "green" as const,
      tips:
        "Негативний скринінг. За наявності клінічних підозр можна додатково оцінити силу стискання кисті чи швидкість ходьби.",
    };
  }

  const interp = interpret(totalScore);

  function choose(idx: number, score: 0 | 1 | 2) {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = score;
      return copy;
    });
  }

  function resetAll() {
    setAnswers(Array(flatQuestions.length).fill(null));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToFirstMissing() {
    const first = answers.findIndex((v) => v === null);
    if (first >= 0 && radiosRefs.current[first]) {
      radiosRefs.current[first]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      radiosRefs.current[first]?.classList.add("ring-2", "ring-amber-400");
      setTimeout(
        () =>
          radiosRefs.current[first]?.classList.remove(
            "ring-2",
            "ring-amber-400"
          ),
        1500
      );
    }
  }

  async function copySummary() {
    const txt =
      `SARC-F: сумарний бал = ${totalScore} / 10\n` +
      `Інтерпретація: ${interp.label}\n` +
      `Пояснення: сила/перенесення, швидкість ходьби, вставання зі стільця, сходи, падіння. Граничне значення ≥4.`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано у буфер обміну.");
    } catch {
      alert("Не вдалося скопіювати. Спробуйте вручну.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        SARC-F — швидкий скринінг саркопенії
      </h1>
      <p className="mt-2 text-gray-600">
        Поля спочатку порожні. Оберіть одну відповідь у кожному пункті.
        Результат і прогрес оновлюються миттєво.
      </p>

      {/* Прогрес */}
      <div className="rounded-xl border p-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>
            Заповнено: {answeredCount} / {answers.length}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-blue-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Карта результату */}
      <div className="mt-6 rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Результат</h2>
          <Badge tone={sarcFPositive ? "red" : "green"}>
            {sarcFPositive ? "Позитивний скринінг" : "Негативний скринінг"}
          </Badge>
        </div>

        <div className="mt-3 rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-600">Сумарний бал</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {totalScore} <span className="text-lg text-gray-500">/ 10</span>
          </div>
          <div className="mt-2">
            <Badge tone={interp.tone}>{interp.label}</Badge>
          </div>
          <p className="mt-3 text-sm text-gray-600">{interp.tips}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={copySummary}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
            >
              Копіювати
            </button>
            <button
              onClick={scrollToFirstMissing}
              className="rounded-xl bg-amber-100 px-4 py-2 text-amber-800 hover:bg-amber-200"
            >
              Перевірити заповнення
            </button>
            <button
              onClick={resetAll}
              className="rounded-xl bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
              Скинути все
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-amber-50 p-3 text-xs text-amber-900">
          Результат є довідковим і не замінює консультацію лікаря. Інструмент
          відтворює загальноприйняту шкалу SARC-F (5 пунктів, кожен 0–2; cut-off ≥4).
        </div>
      </div>

      {/* Питання */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Ліва колонка — секції з питаннями */}
        <div className="space-y-6">
          {SECTIONS.map((sec, secIdx) => (
            <section key={secIdx} className="rounded-2xl border p-4">
              <h3 className="text-base font-semibold">{sec.title}</h3>
              <div className="mt-3 space-y-4">
                {sec.items.map((item, i) => {
                  const qIndex =
                    SECTIONS.slice(0, secIdx).reduce(
                      (acc, s) => acc + s.items.length,
                      0
                    ) + i;
                  const selected = answers[qIndex];

                  return (
                    <div
                      key={qIndex}
                      // ✅ ref-колбек повертає void
                      ref={(el) => {
                        radiosRefs.current[qIndex] = el;
                      }}
                      className={`rounded-xl p-3 transition ${
                        selected === null ? "bg-amber-50" : "bg-white"
                      }`}
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <span className="mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {qIndex + 1}
                        </span>
                        <p className="font-medium">{item.q}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map((opt, oi) => (
                          <label
                            key={oi}
                            className={`cursor-pointer select-none rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 ${
                              selected === opt.score
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q${qIndex}`}
                              className="sr-only"
                              checked={selected === opt.score}
                              onChange={() => choose(qIndex, opt.score)}
                            />
                            <span className="mr-2 font-semibold">{opt.score}</span>
                            <span className="text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {selected === null && (
                        <div className="mt-2 text-xs text-amber-700">
                          Оберіть відповідь — пункт ще не зараховано в підсумок.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Права колонка — коротка пам’ятка */}
        <aside className="space-y-4">
          <div className="rounded-2xl border p-4">
            <h4 className="font-semibold">Про шкалу</h4>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 leading-6">
              <li>5 пунктів, кожен оцінюється в 0–2 бали.</li>
              <li>
                Порогове значення <b>≥ 4</b> — позитивний скринінг
                (підозра на саркопенію).
              </li>
              <li>
                Рекомендовано подальше обстеження (EWGSOP2): сила кисті,
                швидкість ходьби, SPPB/Timed Up &amp; Go, оцінка м’язової маси.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border p-4">
            <h4 className="font-semibold">Навігація</h4>
            <Link href="/other-scales" className="text-sm text-gray-600 hover:text-blue-700">
              ← Назад до інших шкал
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
