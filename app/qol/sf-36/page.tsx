"use client";

import React, { useMemo, useRef, useState } from "react";

/* ------------------------- дрібні утиліти ------------------------- */
const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------- типи ------------------------- */
type Dom =
  | "PF" // Physical Functioning
  | "RP" // Role Physical
  | "BP" // Bodily Pain
  | "GH" // General Health
  | "VT" // Vitality
  | "SF" // Social Functioning
  | "RE" // Role Emotional
  | "MH" // Mental Health
  | "HC"; // Health Change (додаткова шкала)

type Item = {
  no: number;
  text: string;
  options: string[];
  map: number[]; // індекс відповіді → бал (0–100)
  domains: Dom[];
};

type Answers = Record<number, number | undefined>;

const DOM_LABELS: Record<Dom, string> = {
  PF: "PF — Функціонування (фіз.)",
  RP: "RP — Рольові обмеження (фіз.)",
  BP: "BP — Біль",
  GH: "GH — Загальне здоров’я",
  VT: "VT — Життєва активність",
  SF: "SF — Соціальне функціонування",
  RE: "RE — Рольові обмеження (емоц.)",
  MH: "MH — Психічне здоров’я",
  HC: "Зміна здоров’я за рік (HC)",
};

/* ------------------------- варіанти відповідей та мапінги ------------------------- */
// 3-рівн. (PF)
const PF_OPTS = ["Значно обмежений(а)", "Трохи обмежений(а)", "Не обмежений(а)"];
const MAP_PF = [0, 50, 100];

// Так/Ні для RP/RE (Так = проблема)
const YESNO = ["Так", "Ні"];
const MAP_YESNO_GOOD_NO = [0, 100];

// Інтерференція 5-рівн. (SF20, BP22)
const INTERF_5 = ["Зовсім ні", "Трохи", "Помірно", "Досить сильно", "Дуже сильно"];
const MAP_INTERF_5 = [100, 75, 50, 25, 0];

// Інтенсивність болю 6-рівн. (BP21)
const PAIN6 = ["Немає", "Дуже слабкий", "Слабкий", "Помірний", "Сильний", "Дуже сильний"];
const MAP_PAIN6 = [100, 80, 60, 40, 20, 0];

// Частота 6-рівн. (позитивні/негативні твердження)
const FREQ6 = ["Весь час", "Більшість часу", "Частину часу", "Декотрий час", "Мало часу", "Ніколи"];
const MAP_FREQ6_POS = [100, 80, 60, 40, 20, 0];
const MAP_FREQ6_NEG = [0, 20, 40, 60, 80, 100];

// Частота 5-рівн. негативна (SF32)
const FREQ5_NEG = ["Весь час", "Більшість часу", "Частину часу", "Іноді", "Ніколи"];
const MAP_FREQ5_NEG = [0, 25, 50, 75, 100];

// GH1 — загальна оцінка здоров’я
const GH1 = ["Відмінне", "Дуже добре", "Добре", "Посереднє", "Погане"];
const MAP_GH1 = [100, 75, 50, 25, 0];

// GH33–36 — «цілком вірно»…«цілком невірно»
const TRUE5 = ["Цілком вірно", "Переважно вірно", "Не знаю", "Переважно невірно", "Цілком невірно"];
const MAP_TRUE_POS = [100, 75, 50, 25, 0];
const MAP_TRUE_NEG = [0, 25, 50, 75, 100];

// HC2 — зміна здоров’я за рік
const HC2 = ["Набагато краще", "Дещо краще", "Приблизно так само", "Дещо гірше", "Набагато гірше"];
const MAP_HC2 = [100, 75, 50, 25, 0];

/* ------------------------- 36 пунктів ------------------------- */
const ITEMS: Item[] = [
  { no: 1, text: "Загалом ваше здоров’я", options: GH1, map: MAP_GH1, domains: ["GH"] },
  { no: 2, text: "Порівняно з роком тому ваше здоров’я", options: HC2, map: MAP_HC2, domains: ["HC"] },

  // PF 3–12
  ...[
    "Інтенсивні фізичні навантаження (біг, підняття важкого тощо)",
    "Помірні навантаження (перенесення сумок тощо)",
    "Підіймання по кількох поверхах",
    "Підіймання по одному прольоту",
    "Нахили / коліно",
    "Кілька кілометрів ходьби",
    "Кілометр ходьби",
    "Кілька сотень метрів",
    "Кілька десятків метрів",
    "Купання / одягання",
  ].map((t, i) => ({ no: 3 + i, text: t, options: PF_OPTS, map: MAP_PF, domains: ["PF"] as Dom[] })),

  // RP 13–16 (Так/Ні)
  ...[
    "Через фізичне здоров’я — скорочували час роботи",
    "Через фізичне здоров’я — виконали менше ніж хотіли",
    "Обмеження у видах роботи через фізичне здоров’я",
    "Працювали/діяли з меншими зусиллями",
  ].map((t, j) => ({ no: 13 + j, text: t, options: YESNO, map: MAP_YESNO_GOOD_NO, domains: ["RP"] as Dom[] })),

  // RE 17–19 (Так/Ні)
  ...[
    "Через емоційні проблеми — менше часу на роботу",
    "Менше досягнень через емоційні проблеми",
    "Не виконали роботу так старанно",
  ].map((t, j) => ({ no: 17 + j, text: t, options: YESNO, map: MAP_YESNO_GOOD_NO, domains: ["RE"] as Dom[] })),

  // SF 20 (інтерференція)
  { no: 20, text: "Наскільки проблеми зі здоров’ям заважали спілкуванню?", options: INTERF_5, map: MAP_INTERF_5, domains: ["SF"] },

  // Біль 21–22
  { no: 21, text: "Скільки було болю в тілі?", options: PAIN6, map: MAP_PAIN6, domains: ["BP"] },
  { no: 22, text: "Наскільки біль заважав звичній роботі?", options: INTERF_5, map: MAP_INTERF_5, domains: ["BP"] },

  // VT/MH 23–31
  { no: 23, text: "Відчували приплив сил (бадьорість)", options: FREQ6, map: MAP_FREQ6_POS, domains: ["VT"] },
  { no: 24, text: "Були дуже нервовими", options: FREQ6, map: MAP_FREQ6_NEG, domains: ["MH"] },
  { no: 25, text: "Почувалися пригніченими/у розпачі", options: FREQ6, map: MAP_FREQ6_NEG, domains: ["MH"] },
  { no: 26, text: "Були спокійними й урівноваженими", options: FREQ6, map: MAP_FREQ6_POS, domains: ["MH"] },
  { no: 27, text: "Мали багато енергії", options: FREQ6, map: MAP_FREQ6_POS, domains: ["VT"] },
  { no: 28, text: "Почувалися пригніченими/похмурими", options: FREQ6, map: MAP_FREQ6_NEG, domains: ["MH"] },
  { no: 29, text: "Почувалися виснаженими/знесиленими", options: FREQ6, map: MAP_FREQ6_NEG, domains: ["VT"] },
  { no: 30, text: "Були щасливими", options: FREQ6, map: MAP_FREQ6_POS, domains: ["MH"] },
  { no: 31, text: "Почувалися втомленими", options: FREQ6, map: MAP_FREQ6_NEG, domains: ["VT"] },

  // SF 32 (частота інтерференції)
  { no: 32, text: "Як часто здоров’я заважало соціальній активності?", options: FREQ5_NEG, map: MAP_FREQ5_NEG, domains: ["SF"] },

  // GH 33–36
  { no: 33, text: "Я хворію легше/частіше, ніж інші", options: TRUE5, map: MAP_TRUE_NEG, domains: ["GH"] },
  { no: 34, text: "Я так само здоровий(а), як і більшість людей", options: TRUE5, map: MAP_TRUE_POS, domains: ["GH"] },
  { no: 35, text: "Очікую, що здоров’я погіршиться", options: TRUE5, map: MAP_TRUE_NEG, domains: ["GH"] },
  { no: 36, text: "Моє здоров’я — відмінне", options: TRUE5, map: MAP_TRUE_POS, domains: ["GH"] },
];

/* ------------------------- PCS/MCS коефіцієнти (Ware, 1994) ------------------------- */
const DOMAIN_MEAN: Record<Dom, number> = {
  PF: 84.2,
  RP: 81.2,
  BP: 75.2,
  GH: 72.0,
  VT: 61.1,
  SF: 83.3,
  RE: 81.3,
  MH: 74.7,
  HC: 50,
};
const DOMAIN_SD: Record<Dom, number> = {
  PF: 22.9,
  RP: 33.0,
  BP: 23.7,
  GH: 20.9,
  VT: 20.9,
  SF: 22.7,
  RE: 32.3,
  MH: 18.0,
  HC: 10,
};
const PCS_W: Record<Dom, number> = {
  PF: 0.42402,
  RP: 0.35119,
  BP: 0.31754,
  GH: 0.24954,
  VT: 0.02877,
  SF: -0.00753,
  RE: -0.19206,
  MH: -0.22069,
  HC: 0,
};
const MCS_W: Record<Dom, number> = {
  PF: -0.22999,
  RP: -0.12329,
  BP: -0.09731,
  GH: -0.01571,
  VT: 0.23534,
  SF: 0.26876,
  RE: 0.43407,
  MH: 0.48581,
  HC: 0,
};

/* ========================= СТОРІНКА ========================= */
export default function SF36Page() {
  const [ans, setAns] = useState<Answers>({});
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = ITEMS.length;
  const filled = useMemo(() => Object.values(ans).filter((v) => v !== undefined).length, [ans]);
  const progress = Math.round((filled / total) * 100);

  const domainScores = useMemo(() => {
    const bucket: Record<Dom, number[]> = {
      PF: [],
      RP: [],
      BP: [],
      GH: [],
      VT: [],
      SF: [],
      RE: [],
      MH: [],
      HC: [],
    };
    for (const it of ITEMS) {
      const idx = ans[it.no];
      if (idx === undefined) continue;
      const score = it.map[idx];
      it.domains.forEach((d) => bucket[d].push(score));
    }
    const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN);
    const s: Record<Dom, number> = {
      PF: round1(mean(bucket.PF)),
      RP: round1(mean(bucket.RP)),
      BP: round1(mean(bucket.BP)),
      GH: round1(mean(bucket.GH)),
      VT: round1(mean(bucket.VT)),
      SF: round1(mean(bucket.SF)),
      RE: round1(mean(bucket.RE)),
      MH: round1(mean(bucket.MH)),
      HC: round1(mean(bucket.HC)),
    };
    return s;
  }, [ans]);

  const { PCS, MCS } = useMemo(() => {
    const doms: Dom[] = ["PF", "RP", "BP", "GH", "VT", "SF", "RE", "MH"];
    if (doms.some((d) => isNaN(domainScores[d]))) return { PCS: NaN, MCS: NaN };
    const z: Record<Dom, number> = {} as any;
    doms.forEach((d) => (z[d] = (domainScores[d] - DOMAIN_MEAN[d]) / DOMAIN_SD[d]));
    const pcsZ = doms.reduce((s, d) => s + z[d] * PCS_W[d], 0);
    const mcsZ = doms.reduce((s, d) => s + z[d] * MCS_W[d], 0);
    return { PCS: round1(50 + 10 * pcsZ), MCS: round1(50 + 10 * mcsZ) };
  }, [domainScores]);

  const firstEmpty = useMemo(
    () => ITEMS.find((i) => ans[i.no] === undefined)?.no,
    [ans]
  );

  const goFirstEmpty = () => {
    if (!firstEmpty) return;
    const el = refs.current[firstEmpty];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-red-300");
    setTimeout(() => el?.classList.remove("ring-2", "ring-red-300"), 1200);
  };

  const copyResult = async () => {
    const doms: Dom[] = ["PF", "RP", "BP", "GH", "VT", "SF", "RE", "MH"];
    const lines = [
      "SF-36:",
      ...doms.map((d) => `${DOM_LABELS[d]} = ${isNaN(domainScores[d]) ? "—" : domainScores[d].toFixed(1)}`),
      `PCS = ${isNaN(PCS) ? "—" : PCS.toFixed(1)}`,
      `MCS = ${isNaN(MCS) ? "—" : MCS.toFixed(1)}`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">SF-36 — 8 доменів + PCS/MCS</h1>
      <p className="mt-2 text-gray-600">
        Поля спочатку порожні. Заповніть усі 36 пунктів, щоб отримати шкали та зведені показники.
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Ліва колонка — анкета */}
        <div className="space-y-5">
          <Progress value={progress} filled={filled} total={total} />
          {ITEMS.map((it) => {
            const val = ans[it.no];
            const empty = val === undefined;
            return (
              <div
                key={it.no}
                ref={(el) => { refs.current[it.no] = el; }}
                className={cx(
                  "rounded-2xl border bg-white p-4 transition",
                  empty ? "border-red-300 bg-red-50/50" : "border-gray-200"
                )}
              >
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {it.no}
                  </span>
                  <p className="font-medium text-gray-900">{it.text}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {it.options.map((opt, idx) => {
                    const active = val === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAns((p) => ({ ...p, [it.no]: idx }))}
                        className={cx(
                          "rounded-full border px-3 py-2 text-sm transition",
                          active
                            ? "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                            : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                        )}
                        aria-pressed={active}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {empty && <p className="mt-2 text-xs text-red-600">Будь ласка, оберіть відповідь.</p>}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3">
            {filled !== total && (
              <button
                onClick={goFirstEmpty}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700"
              >
                До першого незаповненого
              </button>
            )}
            <button
              onClick={() => setAns({})}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 hover:bg-gray-50"
            >
              Скинути
            </button>
          </div>
        </div>

        {/* Права колонка — результати */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Результати доменів (0–100)</h2>
              <button
                onClick={copyResult}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                disabled={filled === 0}
                title="Копіювати результати у буфер обміну"
              >
                Копіювати
              </button>
            </div>

            {(["PF", "RP", "BP", "GH", "VT", "SF", "RE", "MH"] as Dom[]).map((d) => (
              <Row key={d} label={DOM_LABELS[d]} value={domainScores[d]} />
            ))}

            {!isNaN(domainScores.HC) && (
              <div className="mt-3 text-xs text-gray-500">
                Додатково: <b>{DOM_LABELS.HC}</b> = {domainScores.HC}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Зведені показники (T-scores)</h2>
            <Row label="PCS — Фізичний композит" value={PCS} badge="indigo" />
            <Row label="MCS — Ментальний композит" value={MCS} badge="indigo" />
            {Number.isNaN(PCS) || Number.isNaN(MCS) ? (
              <p className="mt-3 text-sm text-amber-700">Заповніть усі 36 пунктів для розрахунку PCS/MCS.</p>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
            Результат є довідковим і не замінює консультацію лікаря. PCS/MCS розраховано за
            опублікованими коефіцієнтами (Ware, 1994; нормативи US). Для локальних нормативів
            інтерпретація може відрізнятись.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- підкомпоненти ------------------------- */
function Progress({ value, filled, total }: { value: number; filled: number; total: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
        <span>
          Заповнено: {filled} / {total}
        </span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge?: "indigo";
}) {
  const ok = !Number.isNaN(value);
  const badgeCls =
    badge === "indigo"
      ? ok
        ? "bg-indigo-50 text-indigo-700"
        : "bg-gray-100 text-gray-500"
      : ok
      ? "bg-emerald-50 text-emerald-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <span className={cx("rounded-md px-2 py-1 text-sm", badgeCls)}>
        {ok ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
