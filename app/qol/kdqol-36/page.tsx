"use client";

import React, { useMemo, useState } from "react";

/** =========================
 *  УТИЛІТИ: шкали / кольори
 *  ========================= */
type Polarity = "pos" | "neg"; // pos = більше — краще; neg = більше — гірше
type DomainKey = "SYMPTOMS" | "EFFECTS" | "BURDEN" | "SF12" | "GENERAL";

const LIKERT = ["Завжди", "Часто", "Іноді", "Рідко", "Ніколи"] as const;
type Likert = (typeof LIKERT)[number];

/** Бали 0..100 для відповідей (для 'pos') */
const BASE_POINTS: Record<Likert, number> = {
  Завжди: 100,
  Часто: 75,
  Іноді: 50,
  Рідко: 25,
  Ніколи: 0,
};

/** Перетворення відповіді в 0..100 з урахуванням полярності */
function to100(answer: Likert | undefined, polarity: Polarity) {
  if (!answer) return null;
  const p = BASE_POINTS[answer];
  return polarity === "pos" ? p : 100 - p;
}

/** Інтерпретація балів 0..100 */
function bandLabel(score: number | null) {
  if (score === null) return "—";
  if (score >= 80) return "Високий рівень QoL";
  if (score >= 60) return "Добрий";
  if (score >= 40) return "Помірний";
  if (score >= 20) return "Низький";
  return "Дуже низький";
}
function bandTone(score: number | null) {
  if (score === null) return "bg-gray-100 text-gray-700";
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-lime-100 text-lime-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  if (score >= 20) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

/** =========================
 *  ПИТАННЯ KDQOL-36 (спрощене відображення, 0–100 кращий стан)
 *  ========================= */
// 12 «симптомів/проблем»: частота скарг — гірше (neg)
const Q_SYMPTOMS = [
  "Свербіж шкіри",
  "Біль у м’язах або судоми",
  "Набряки ніг/гомілок",
  "Порушення сну",
  "Втомлюваність",
  "Нудота",
  "Задишка",
  "Запаморочення",
  "Слабкість",
  "Сухість шкіри",
  "Біль у попереку",
  "Зниження апетиту",
].map((text, i) => ({
  id: `S${i + 1}`,
  domain: "SYMPTOMS" as DomainKey,
  text,
  polarity: "neg" as Polarity,
}));

// 8 «впливів ХХН на щоденність»: більше обмежує — гірше (neg)
const Q_EFFECTS = [
  "Обмежує фізичну активність",
  "Заважає роботі або навчанні",
  "Погіршує соціальну активність",
  "Впливає на сімейні обов’язки",
  "Погіршує настрій",
  "Зменшує інтерес до хобі",
  "Викликає тривогу щодо майбутнього",
  "Зменшує життєву енергію",
].map((text, i) => ({
  id: `E${i + 1}`,
  domain: "EFFECTS" as DomainKey,
  text,
  polarity: "neg" as Polarity,
}));

// 4 «тягар хвороби нирок»: більше тягаря — гірше (neg)
const Q_BURDEN = [
  "Відчуття, що лікування займає занадто багато часу",
  "Почуття залежності від лікування",
  "Стрес через хворобу нирок",
  "Побоювання прогресування/ускладнень",
].map((text, i) => ({
  id: `B${i + 1}`,
  domain: "BURDEN" as DomainKey,
  text,
  polarity: "neg" as Polarity,
}));

// 12 питань для зведеного «SF-12» (тут — проксі з тих самих шкал, щоб не вимагати окремого опитника)
const Q_SF12 = [
  "Складно виконувати помірні навантаження",
  "Обмеження в підйомі сходами",
  "Біль заважає повсякденній активності",
  "Емоційні труднощі обмежують активність",
  "Проблеми з концентрацією",
  "Низький рівень життєвої енергії",
  "Негативні емоції (смуток, тривога)",
  "Порушення сну через стан здоров’я",
  "Соціальні обмеження через здоров’я",
  "Труднощі в самообслуговуванні",
  "Відчуття загального нездужання",
  "Складно підтримувати темп дня",
].map((text, i) => ({
  id: `F${i + 1}`,
  domain: "SF12" as DomainKey,
  text,
  polarity: "neg" as Polarity,
}));

// Загальне самооцінювання (1 пункт). Тут трактуємо «Завжди (почуваюся чудово) … Ніколи» як pos.
const Q_GENERAL = [
  {
    id: "G1",
    domain: "GENERAL" as DomainKey,
    text: "Загальна самооцінка здоров’я (краще — ближче до «Завжди»)",
    polarity: "pos" as Polarity,
  },
];

const ITEMS = [...Q_SYMPTOMS, ...Q_EFFECTS, ...Q_BURDEN, ...Q_SF12, ...Q_GENERAL];

/** Для блоків справа — назви та склади підшкал */
const DOMAINS: Record<
  DomainKey,
  { title: string; ids: string[] }
> = {
  SYMPTOMS: { title: "Symptoms/Problems", ids: Q_SYMPTOMS.map((q) => q.id) },
  EFFECTS: { title: "Effects of Kidney Disease", ids: Q_EFFECTS.map((q) => q.id) },
  BURDEN: { title: "Burden of Kidney Disease", ids: Q_BURDEN.map((q) => q.id) },
  SF12: { title: "SF-12 (зведений)", ids: Q_SF12.map((q) => q.id) },
  GENERAL: { title: "Загальна оцінка здоров’я", ids: Q_GENERAL.map((q) => q.id) },
};

/** =========================
 *  КОМПОНЕНТ КОНТРОЛЮ ВІДПОВІДЕЙ
 *  ========================= */
type AnswerMap = Record<string, Likert | undefined>;

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-4 py-2 text-sm transition " +
        (active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
      }
    >
      {children}
    </button>
  );
}

/** =========================
 *  ГОЛОВНА СТОРІНКА
 *  ========================= */
export default function KDQOL36Page() {
  const [answers, setAnswers] = useState<AnswerMap>({}); // порожньо на старті

  // Мапа параметрів по питаннях
  const itemMap = useMemo(() => {
    const map: Record<string, (typeof ITEMS)[number]> = {};
    for (const q of ITEMS) map[q.id] = q;
    return map;
  }, []);

  // Розрахунок субшкал
  const domainScores = useMemo(() => {
    const result: Record<DomainKey, { score: number | null; answered: number; total: number }> =
      {} as any;

    (Object.keys(DOMAINS) as DomainKey[]).forEach((dk) => {
      const ids = DOMAINS[dk].ids;
      const vals: number[] = [];
      ids.forEach((id) => {
        const a = answers[id];
        const q = itemMap[id];
        const v = to100(a, q.polarity);
        if (v !== null) vals.push(v);
      });
      const score = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      result[dk] = { score, answered: vals.length, total: ids.length };
    });

    return result;
  }, [answers, itemMap]);

  const resetAll = () => setAnswers({});

  const copySummary = async () => {
    const lines: string[] = [];
    (Object.keys(DOMAINS) as DomainKey[]).forEach((dk) => {
      const { title } = DOMAINS[dk];
      const { score } = domainScores[dk];
      lines.push(`${title}: ${score === null ? "—" : score.toFixed(1)} / 100 (${bandLabel(score)})`);
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {}
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold">
        KDQOL-36 (Якість життя при ХХН)
      </h1>
      <p className="mb-8 text-gray-600">
        Десятковий роздільник — «,» або «.»; поля спочатку порожні. Оцінка в шкалі 0–100
        (вище — кращий стан).
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ЛІВА КОЛОНКА — ПИТАННЯ */}
        <div className="space-y-6">
          {/* Блоки за підшкалами, щоб легше орієнтуватись */}
          <Section title="Симптоми / Проблеми (12)">
            {Q_SYMPTOMS.map((q, idx) => (
              <QuestionRow
                key={q.id}
                index={idx + 1}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))}
              />
            ))}
          </Section>

          <Section title="Вплив ХХН на щоденне життя (8)">
            {Q_EFFECTS.map((q, idx) => (
              <QuestionRow
                key={q.id}
                index={idx + 1}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))}
              />
            ))}
          </Section>

          <Section title="Тягар хвороби нирок (4)">
            {Q_BURDEN.map((q, idx) => (
              <QuestionRow
                key={q.id}
                index={idx + 1}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))}
              />
            ))}
          </Section>

          <Section title="SF-12 (зведений проксі з 12 пунктів)">
            {Q_SF12.map((q, idx) => (
              <QuestionRow
                key={q.id}
                index={idx + 1}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))}
              />
            ))}
          </Section>

          <Section title="Загальна самооцінка здоров’я (1)">
            {Q_GENERAL.map((q, idx) => (
              <QuestionRow
                key={q.id}
                index={idx + 1}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))}
              />
            ))}

            <div className="mt-2 flex gap-2">
              <button
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={resetAll}
              >
                Скинути
              </button>
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={copySummary}
              >
                Копіювати підсумок
              </button>
            </div>
          </Section>
        </div>

        {/* ПРАВА КОЛОНКА — ПІДСУМОК */}
        <aside className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="mb-3 text-lg font-semibold">Підсумок підшкал</div>

            {(Object.keys(DOMAINS) as DomainKey[]).map((dk) => {
              const { title } = DOMAINS[dk];
              const block = domainScores[dk];
              return (
                <div key={dk} className="mb-3 rounded-xl border p-3 last:mb-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{title}</span>
                    <span className="font-mono text-lg">
                      {block.score === null ? "—" : block.score.toFixed(1)}
                      <span className="ml-1 text-sm text-gray-500">/ 100</span>
                    </span>
                  </div>

                  {/* Інтерпретація — ВИЩЕ за службовий рядок */}
                  <div className="mt-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${bandTone(
                        block.score
                      )}`}
                    >
                      {bandLabel(block.score)}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-gray-600">
                    Заповнено: {block.answered}/{block.total}
                  </div>
                </div>
              );
            })}

            {/* Нейтральний дисклеймер */}
            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              Результат є довідковим і не замінює консультацію лікаря.
            </div>
          </div>

          {/* Додаткова примітка про спрощення */}
          <div className="rounded-2xl border bg-amber-50 p-4 text-xs text-amber-800">
            Ця реалізація відображає KDQOL-36 у форматі 0–100 з миттєвим перерахунком
            та узгодженою полярністю питань (вище — кращий стан). Для офіційного звітування
            окремі заклади можуть використовувати власні протоколи перерахунку підшкал.
          </div>
        </aside>
      </div>
    </div>
  );
}

/** =========================
 *  ДОПОМІЖНІ КОМПОНЕНТИ
 *  ========================= */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function QuestionRow({
  index,
  q,
  value,
  onChange,
}: {
  index: number;
  q: { id: string; text: string; polarity: Polarity };
  value?: Likert;
  onChange: (v: Likert) => void;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 font-medium">
        {index}. {q.text}
      </div>
      <div className="flex flex-wrap gap-2">
        {LIKERT.map((opt) => (
          <Pill key={opt} active={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </Pill>
        ))}
      </div>
    </div>
  );
}
