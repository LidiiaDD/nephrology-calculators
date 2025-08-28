'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/* ───────── Дані опитника ───────── */
// 7 пунктів тривоги (HADS-A) + 7 пунктів депресії (HADS-D)
const HADS_QUESTIONS = [
  // HADS-A
  '1. Відчуваю напругу чи занепокоєння',
  '2. Маю відчуття страху без причини',
  '3. Сильно непокоюсь щодо дрібниць',
  '4. Відчуваю неспокій, не можу всидіти на місці',
  '5. Відчуваю раптове почуття паніки',
  '6. Відчуваю внутрішнє тремтіння',
  '7. Маю труднощі з розслабленням',
  // HADS-D
  '8. Втрачаю цікавість до речей',
  '9. Мені важко сміятись',
  '10. Я песимістично налаштований щодо майбутнього',
  '11. Важко отримати задоволення від речей',
  '12. Відчуваю себе сповільненим',
  '13. Мене не радують речі, які раніше радували',
  '14. Відчуваю себе пригніченим',
] as const;

const OPTIONS = [
  { label: '0 — Ніколи/дуже рідко', points: 0 },
  { label: '1 — Іноді', points: 1 },
  { label: '2 — Часто', points: 2 },
  { label: '3 — Дуже часто/постійно', points: 3 },
] as const;

type Tone = 'green' | 'yellow' | 'red';
const pill = (tone: Tone) =>
  tone === 'green'
    ? 'bg-green-100 text-green-900'
    : tone === 'yellow'
    ? 'bg-yellow-100 text-yellow-900'
    : 'bg-red-100 text-red-900';

const LS_KEY = 'hads_v3';

export default function HADSPage() {
  // null = відповідь не обрана (щоб поля були ПУСТІ на старті)
  const [answers, setAnswers] = useState<Array<number | null>>(
    Array(HADS_QUESTIONS.length).fill(null)
  );
  const [touched, setTouched] = useState(false);

  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  /* Відновлення / збереження стану */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.answers)) setAnswers(parsed.answers);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ answers }));
    } catch {
      /* ignore */
    }
  }, [answers]);

  const setAns = (idx: number, val: number) => {
    setTouched(true);
    setAnswers(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  /* Підрахунок підшкал */
  const hadsA = useMemo(
    () => answers.slice(0, 7).reduce<number>((sum, v) => sum + (v ?? 0), 0),
    [answers]
  );
  const hadsD = useMemo(
    () => answers.slice(7).reduce<number>((sum, v) => sum + (v ?? 0), 0),
    [answers]
  );

  const answeredCount = answers.filter(v => v != null).length;
  const allAnswered = answeredCount === HADS_QUESTIONS.length;

  /* Автопрокрутка до результату при першому повному заповненні */
  useEffect(() => {
    if (allAnswered && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrolledOnce.current = true;
    }
  }, [allAnswered]);

  /* Інтерпретації */
  function interpret(score: number) {
    if (score <= 7) return { label: 'Норма (0–7)', tone: 'green' as const };
    if (score <= 10) return { label: 'Прикордонний рівень (8–10)', tone: 'yellow' as const };
    return { label: 'Вірогідний клінічний рівень (11–21)', tone: 'red' as const };
  }
  const aInterp = interpret(hadsA);
  const dInterp = interpret(hadsD);

  /* Копіювання результату */
  const onCopy = async () => {
    if (!allAnswered) return;
    const txt = `HADS-A: ${hadsA}/21 — ${aInterp.label}; HADS-D: ${hadsD}/21 — ${dInterp.label}`;
    try {
      await navigator.clipboard.writeText(txt);
      alert('Скопійовано у буфер обміну.');
    } catch {
      alert(txt);
    }
  };

  const onReset = () => {
    setAnswers(Array(HADS_QUESTIONS.length).fill(null));
    setTouched(false);
    scrolledOnce.current = false;
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">HADS — Hospital Anxiety and Depression Scale</h1>
      <p className="text-gray-600 mb-4">
        Оберіть варіанти для кожного пункту (за останній тиждень). Підрахунок іде автоматично — дві підшкали:
        <b> HADS-A</b> (тривога) та <b>HADS-D</b> (депресія).
      </p>

      {/* Прогрес заповнення */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>
            Заповнено: {answeredCount} / {HADS_QUESTIONS.length}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(answeredCount / HADS_QUESTIONS.length) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Форма опитника */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-5">
        {HADS_QUESTIONS.map((q, idx) => {
          const sel = answers[idx];
          const missing = touched && sel == null;
          return (
            <div key={idx} className={missing ? 'border-l-4 border-red-400 pl-3' : ''}>
              <div className="font-medium mb-2">{q}</div>
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
              allAnswered ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500'
            }`}
            title={allAnswered ? 'Скопіювати підсумок' : 'Заповніть усі пункти, щоб скопіювати'}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            HADS-A:&nbsp;<span className="font-mono">{hadsA}</span> / 21
          </div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${pill(aInterp.tone)}`}>{aInterp.label}</span>
            {!allAnswered && (
              <span className="text-gray-500">(заповніть усі пункти для коректної інтерпретації)</span>
            )}
          </div>

          <div className="mt-4 text-lg md:text-xl font-bold">
            HADS-D:&nbsp;<span className="font-mono">{hadsD}</span> / 21
          </div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${pill(dInterp.tone)}`}>{dInterp.label}</span>
            {!allAnswered && (
              <span className="text-gray-500">(заповніть усі пункти для коректної інтерпретації)</span>
            )}
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Примітка: HADS виключає виражені соматичні симптоми й використовується як
            <b> скринінговий</b> інструмент; це не діагноз і потребує клінічного підтвердження.
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
