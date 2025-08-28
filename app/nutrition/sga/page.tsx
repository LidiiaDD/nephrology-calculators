'use client';

import React, { useMemo, useState } from 'react';

type Choice = { label: string; points: number };
type Question = { id: string; text: string; choices: Choice[] };

/**
 * ⬇️ Демо-набір запитань SGA/PG-SGA.
 * Можеш змінити тексти/бали під свою методику — логіка підрахунку універсальна.
 */
const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Зміна маси за останній місяць',
    choices: [
      { label: 'Немає', points: 0 },
      { label: '≈1–5% від маси', points: 1 },
      { label: '≈5–10%', points: 2 },
      { label: '>10%', points: 3 },
    ],
  },
  {
    id: 'q2',
    text: 'Поточне харчування порівняно зі звичним',
    choices: [
      { label: 'Звичне живлення', points: 0 },
      { label: 'Трохи менше', points: 1 },
      { label: 'Суттєво менше', points: 2 },
      { label: 'Мінімальне/лише рідини', points: 3 },
    ],
  },
  {
    id: 'q3',
    text: 'Апетит',
    choices: [
      { label: 'Нормальний', points: 0 },
      { label: 'Знижений періодично', points: 1 },
      { label: 'Стійко знижений', points: 2 },
      { label: 'Відсутній', points: 3 },
    ],
  },
  {
    id: 'q4',
    text: 'Симптоми, що заважають прийому їжі (нудота, блювання, діарея, біль тощо)',
    choices: [
      { label: 'Немає', points: 0 },
      { label: 'Легкі/епізодичні', points: 1 },
      { label: 'Помірні', points: 2 },
      { label: 'Виражені/часті', points: 3 },
    ],
  },
  {
    id: 'q5',
    text: 'Рівень активності / функціональний статус',
    choices: [
      { label: 'Звична активність', points: 0 },
      { label: 'Легка слабкість', points: 1 },
      { label: 'Обмежена активність', points: 2 },
      { label: 'Переважно лежачий режим', points: 3 },
    ],
  },
  {
    id: 'q6',
    text: 'Наявність набряків / асциту',
    choices: [
      { label: 'Немає', points: 0 },
      { label: 'Легкі', points: 1 },
      { label: 'Помірні', points: 2 },
      { label: 'Виражені', points: 3 },
    ],
  },
  {
    id: 'q7',
    text: 'Втрата м’язової маси (клінічно)',
    choices: [
      { label: 'Немає', points: 0 },
      { label: 'Незначна', points: 1 },
      { label: 'Помірна', points: 2 },
      { label: 'Виражена', points: 3 },
    ],
  },
  {
    id: 'q8',
    text: 'Підшкірний жир (клінічно)',
    choices: [
      { label: 'Збережений', points: 0 },
      { label: 'Легке зменшення', points: 1 },
      { label: 'Помірне зменшення', points: 2 },
      { label: 'Виражене виснаження', points: 3 },
    ],
  },
];

/** Інтерпретація в стилі PG-SGA (можеш змінити пороги/тексти під свій протокол) */
function classify(total: number) {
  if (total >= 9) {
    return { level: 'КРИТИЧНО: потрібна термінова оцінка/втручання', color: '#fca5a5' }; // червонуватий
  }
  if (total >= 4) {
    return { level: 'Потрібна дієтологічна консультація', color: '#fde68a' }; // жовтий
  }
  if (total >= 2) {
    return { level: 'Освітня підтримка / менеджмент симптомів', color: '#fef3c7' }; // світло-жовтий
  }
  return { level: 'Рутинне спостереження', color: '#bbf7d0' }; // зеленкуватий
}

export default function SgaPage() {
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null)
  );

  const total = useMemo(
    () =>
      answers.reduce<number>((sum, v, idx) => {
        if (v == null) return sum;
        const choice = QUESTIONS[idx]?.choices?.[v];
        return sum + (choice?.points ?? 0);
      }, 0),
    [answers]
  );

  const completed = useMemo(
    () => answers.filter((v) => v != null).length,
    [answers]
  );

  const summary = classify(total);

  const reset = () =>
    setAnswers(Array(QUESTIONS.length).fill(null));

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        SGA / PG-SGA — оцінка харчового статусу
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Оберіть варіант для кожного пункту. Тексти опцій відображаються завжди.
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
        {completed}/{QUESTIONS.length} відповідей ·{' '}
        <strong>Бал: {total}</strong> · {summary.level}
      </section>

      {QUESTIONS.map((q, idx) => (
        <fieldset
          key={q.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>
            {idx + 1}. {q.text}
          </legend>

          <div>
            {q.choices.map((c, i) => {
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
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <span
                    title="Бали"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      opacity: 0.7,
                    }}
                  >
                    {c.points} б.
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
          Підсумок: {total} балів — {summary.level}
        </div>

        <small style={{ opacity: 0.7 }}>
          * Шаблон демонстраційний. Відкоригуй пороги/пункти під свій протокол.
        </small>
      </div>
    </main>
  );
}
