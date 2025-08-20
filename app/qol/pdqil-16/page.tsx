'use client';

import React, { useMemo, useState, useEffect } from 'react';

/** =========================
 *  PDQLI-16 — якість життя при перитонеальному діалізі
 *  =========================
 */

const PAGE_TITLE = 'PDQLI-16 — якість життя при перитонеальному діалізі';

// Варіанти відповіді (0 → 4)
const OPTIONS = [
  { label: 'Ніколи', value: 0 },
  { label: 'Рідко', value: 1 },
  { label: 'Іноді', value: 2 },
  { label: 'Часто', value: 3 },
  { label: 'Завжди', value: 4 },
];

// 16 запитань PDQLI-16
type Item = { id: string; label: string };
const ITEMS: Item[] = [
  { id: 'q1',  label: 'Чи відчуваєте ви втому протягом останнього тижня?' },
  { id: 'q2',  label: 'Чи обмежує здоров’я вашу активність (робота, навчання, дозвілля)?' },
  { id: 'q3',  label: 'Чи турбують вас болі під час перитонеального діалізу?' },
  { id: 'q4',  label: 'Чи впливає діаліз на якість сну?' },
  { id: 'q5',  label: 'Чи відчуваєте ви занепокоєння щодо результатів лікування?' },
  { id: 'q6',  label: 'Чи впливають обмеження дієти на ваше повсякденне життя?' },
  { id: 'q7',  label: 'Чи турбують вас набряки або зміни ваги?' },
  { id: 'q8',  label: 'Чи маєте ви труднощі із соціальними контактами?' },
  { id: 'q9',  label: 'Чи впливає лікування на стосунки у родині?' },
  { id: 'q10', label: 'Чи обмежує діаліз вашу подорож або пересування?' },
  { id: 'q11', label: 'Чи часто ви відчуваєте пригнічений настрій?' },
  { id: 'q12', label: 'Чи турбують вас шкірні чи інші ускладнення?' },
  { id: 'q13', label: 'Чи впливає діаліз на вашу сексуальну активність?' },
  { id: 'q14', label: 'Чи турбують вас зміни апетиту?' },
  { id: 'q15', label: 'Чи виникають у вас труднощі з дотриманням лікувального режиму?' },
  { id: 'q16', label: 'Чи вважаєте ви, що ваше життя змінилося через діаліз?' },
];

// Інтерпретація (адаптуйте за потреби)
function getInterpretation(total: number, max: number) {
  const p = (total / max) * 100;
  if (p <= 25) return { label: 'Норма / мінімальні порушення', tone: 'green' as const };
  if (p <= 50) return { label: 'Легкі порушення', tone: 'yellow' as const };
  if (p <= 75) return { label: 'Помірні порушення', tone: 'orange' as const };
  return { label: 'Виражені порушення', tone: 'red' as const };
}

/** =========================
 *  Утільні дрібниці (бейдж і кнопка)
 *  =========================
 */
function Badge({
  tone = 'gray',
  children,
}: {
  tone?: 'gray' | 'green' | 'yellow' | 'orange' | 'red' | 'blue';
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    green: 'bg-green-100 text-green-800 ring-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    orange: 'bg-orange-100 text-orange-800 ring-orange-200',
    red: 'bg-red-100 text-red-800 ring-red-200',
    blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Button({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 shadow-sm transition-colors',
    ghost:
      'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:outline-gray-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-sm transition-colors',
  };
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${styles[tone]} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

/** =========================
 *  Сторінка
 *  =========================
 */

type AnswerMap = Record<string, number | null>;

export default function Page() {
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.id, null]))
  );
  const [justSubmitted, setJustSubmitted] = useState(false);

  const maxPerItem = Math.max(...OPTIONS.map((o) => o.value)); // 4
  const maxScore = ITEMS.length * maxPerItem;                  // 64

  const completed = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );
  const progress = Math.round((completed / ITEMS.length) * 100);

  const totalScore = useMemo(() => {
    return ITEMS.reduce((sum, it) => {
      const raw = answers[it.id];
      return sum + (raw ?? 0);
    }, 0);
  }, [answers]);

  const interpretation = useMemo(
    () => getInterpretation(totalScore, maxScore),
    [totalScore, maxScore]
  );

  const unanswered = useMemo(
    () => ITEMS.filter((it) => answers[it.id] === null).map((it) => it.id),
    [answers]
  );

  useEffect(() => {
    if (!justSubmitted) return;
    if (unanswered.length > 0) {
      document.getElementById(unanswered[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setJustSubmitted(false);
  }, [justSubmitted, unanswered]);

  const setAnswer = (id: string, value: number) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const resetAll = () =>
    setAnswers(Object.fromEntries(ITEMS.map((i) => [i.id, null])));

  const copyResult = async () => {
    const text =
      `${PAGE_TITLE}\n` +
      `Заповнено: ${completed}/${ITEMS.length}\n` +
      `Сумарний бал: ${totalScore} із ${maxScore}\n` +
      `Інтерпретація: ${interpretation.label}`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Скопійовано у буфер обміну.');
    } catch {
      alert('Не вдалося скопіювати. Спробуйте вручну.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{PAGE_TITLE}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Поля спочатку <span className="font-medium">порожні</span>. Виберіть варіанти відповіді; прогрес і підсумок оновлюються автоматично.
      </p>

      {/* Прогрес-бар */}
      <div className="mt-6 rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Заповнено: {completed} / {ITEMS.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Ліва колонка — запитання */}
        <div className="space-y-4">
          {ITEMS.map((item, idx) => {
            const value = answers[item.id];
            const isEmpty = value === null;
            return (
              <div
                key={item.id}
                id={item.id}
                className={`rounded-2xl border p-4 transition-colors ${isEmpty ? 'border-rose-300 bg-rose-50/40' : 'border-gray-200 bg-white'}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="blue">{idx + 1}</Badge>
                  <div className="font-medium">{item.label}</div>
                  {isEmpty && <Badge tone="red">не заповнено</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {OPTIONS.map((opt) => {
                    const active = value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAnswer(item.id, opt.value)}
                        className={`rounded-xl px-3 py-2 text-sm ring-1 transition-colors
                          ${active
                            ? 'bg-blue-600 text-white ring-blue-600'
                            : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
                          }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Права колонка — підсумок */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Результат</h2>
              <Badge tone={interpretation.tone}>{interpretation.label}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Сумарний бал</div>
                <div className="mt-1 text-xl font-semibold">
                  {totalScore} <span className="text-gray-400">/ {maxScore}</span>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Заповнено</div>
                <div className="mt-1 text-xl font-semibold">
                  {completed} <span className="text-gray-400">/ {ITEMS.length}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={copyResult}>Копіювати</Button>
              <Button tone="ghost" onClick={() => { setJustSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Показати незаповнені
              </Button>
              <Button tone="danger" onClick={resetAll}>Скинути</Button>
            </div>

            {unanswered.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                Не заповнено: {unanswered.length} пункт(и). Натисніть «Показати незаповнені», щоб перейти до першого.
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
            Результат є довідковим і не замінює консультацію лікаря. За потреби адаптуйте пороги інтерпретації у функції
            <code className="rounded bg-white px-1 py-0.5 ring-1 ring-gray-200 ml-1">getInterpretation()</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
