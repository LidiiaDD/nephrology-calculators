'use client';

import React, { useMemo, useState } from 'react';

type Option = { label: string; points: number };
type Item = { id: string; title: string; options: Option[] };

/**
 * Barthel Index (0–100)
 * Класична шкала: 10 пунктів.
 * Можеш змінити тексти/бали під свою локальну версію — логіка універсальна.
 */
const ITEMS: Item[] = [
  {
    id: 'feeding',
    title: 'Харчування (їжа та напої)',
    options: [
      { label: 'Повністю залежний/а', points: 0 },
      { label: 'Потрібна допомога (нарізати/намазати/налити)', points: 5 },
      { label: 'Самостійно', points: 10 },
    ],
  },
  {
    id: 'bathing',
    title: 'Гігієна тіла / купання',
    options: [
      { label: 'Потребує допомоги', points: 0 },
      { label: 'Самостійно', points: 5 },
    ],
  },
  {
    id: 'grooming',
    title: 'Догляд за собою (гоління, волосся, зуби тощо)',
    options: [
      { label: 'Потребує допомоги', points: 0 },
      { label: 'Самостійно', points: 5 },
    ],
  },
  {
    id: 'dressing',
    title: 'Одягання / роздягання',
    options: [
      { label: 'Повністю залежний/а', points: 0 },
      { label: 'Потрібна допомога', points: 5 },
      { label: 'Самостійно', points: 10 },
    ],
  },
  {
    id: 'bowels',
    title: 'Контроль дефекації',
    options: [
      { label: 'Нетримання (регулярно)', points: 0 },
      { label: 'Епізодичні “промахи”', points: 5 },
      { label: 'Континентний/а', points: 10 },
    ],
  },
  {
    id: 'bladder',
    title: 'Контроль сечовипускання',
    options: [
      { label: 'Нетримання (регулярно)', points: 0 },
      { label: 'Епізодичні “промахи” або катетер з доглядом', points: 5 },
      { label: 'Континентний/а', points: 10 },
    ],
  },
  {
    id: 'toilet',
    title: 'Користування туалетом',
    options: [
      { label: 'Залежний/а', points: 0 },
      { label: 'Потрібна деяка допомога', points: 5 },
      { label: 'Самостійно', points: 10 },
    ],
  },
  {
    id: 'transfer',
    title: 'Переміщення: ліжко ↔ крісло',
    options: [
      { label: 'Нездатний/а безпечно сидіти/переміститись', points: 0 },
      { label: 'Потрібна значна допомога (2 особи/підіймач)', points: 5 },
      { label: 'Потрібна невелика допомога або нагляд', points: 10 },
      { label: 'Самостійно', points: 15 },
    ],
  },
  {
    id: 'mobility',
    title: 'Мобільність по рівній поверхні',
    options: [
      { label: 'Нерухомий/а або <50 м', points: 0 },
      { label: 'Самостійно у візку (в т.ч. повороти/кути)', points: 5 },
      { label: 'Ходьба з допомогою однієї особи/засобу', points: 10 },
      { label: 'Самостійна ходьба (допоміжні засоби дозволені)', points: 15 },
    ],
  },
  {
    id: 'stairs',
    title: 'Сходи',
    options: [
      { label: 'Не може користуватись сходами', points: 0 },
      { label: 'Потрібна допомога/нагляд', points: 5 },
      { label: 'Самостійно', points: 10 },
    ],
  },
];

/** Класифікація за сумою балів Barthel */
function classify(total: number) {
  if (total <= 20) return { level: 'Повна залежність', color: '#fecaca' };
  if (total <= 60) return { level: 'Виражена залежність', color: '#fde68a' };
  if (total <= 90) return { level: 'Помірна залежність', color: '#fef3c7' };
  if (total < 100) return { level: 'Легка залежність', color: '#d9f99d' };
  return { level: 'Незалежність (100)', color: '#bbf7d0' };
}

export default function BarthelPage() {
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(ITEMS.length).fill(null)
  );

  const total = useMemo(
    () =>
      answers.reduce<number>((sum, val, idx) => {
        if (val == null) return sum;
        const pts = ITEMS[idx]?.options?.[val]?.points ?? 0;
        return sum + pts;
      }, 0),
    [answers]
  );

  const done = useMemo(() => answers.filter((v) => v != null).length, [answers]);
  const summary = classify(total);

  const reset = () => setAnswers(Array(ITEMS.length).fill(null));

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Шкала Barthel (0–100)</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Оберіть відповідь у кожному пункті. Тексти опцій показуються завжди. Підсумок рахується автоматично.
      </p>

      <section
        style={{
          padding: 12,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          marginBottom: 16,
          background: summary.color,
        }}
      >
        <strong>Проміжний підсумок:</strong>{' '}
        {done}/{ITEMS.length} · <strong>{total} балів</strong> — {summary.level}
      </section>

      {ITEMS.map((it, idx) => (
        <fieldset
          key={it.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>
            {idx + 1}. {it.title}
          </legend>

          <div>
            {it.options.map((opt, i) => {
              const name = `q-${idx}`;
              const checked = answers[idx] === i;
              return (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    marginBottom: 6,
                    borderRadius: 8,
                    border: checked
                      ? '1px solid #60a5fa'
                      : '1px solid #e5e7eb',
                    background: checked ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name={name}
                    value={i}
                    checked={checked}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[idx] = val;
                        return next;
                      });
                    }}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  <span
                    title="Бали"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      opacity: 0.7,
                    }}
                  >
                    {opt.points} б.
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginTop: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Очистити відповіді
        </button>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: summary.color,
            fontWeight: 600,
          }}
        >
          Підсумок: {total} — {summary.level}
        </div>

        <small style={{ opacity: 0.7 }}>
          * Категорії: 0–20 повна, 21–60 виражена, 61–90 помірна, 91–99 легка залежність, 100 — незалежність.
        </small>
      </div>
    </main>
  );
}
