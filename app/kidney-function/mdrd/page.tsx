'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

type Sex = 'Жіноча' | 'Чоловіча';
type Unit = 'мкмоль/л' | 'мг/дл';

/* ===== Утиліти для числового вводу (уніфіковані) ===== */
function sanitizeDecimalInput(s: string): string {
  let v = s.replace(/[^\d.,]/g, '');
  const parts = v.split(/[.,]/);
  if (parts.length > 1) v = parts[0] + '.' + parts.slice(1).join('');
  return v;
}
function normalizeOnBlur(s: string): string {
  if (!s) return '';
  let v = s.replace(',', '.');
  if (v.startsWith('00')) v = v.replace(/^0+/, '0');
  if (/^\d+$/.test(v)) return String(parseInt(v, 10));
  if (/^\./.test(v)) v = '0' + v;
  return v;
}
function toNumberOrNaN(s: string): number {
  if (!s) return NaN;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}
function mgdlFrom(value: number, unit: Unit) {
  return unit === 'мкмоль/л' ? value / 88.4 : value;
}

/* ===== Формула MDRD (IDMS, без расового множника) =====
   eGFR (мл/хв/1.73м²) = 175 × (Scr, мг/дл)^(-1.154) × (Age)^(-0.203) × (0.742 якщо female)
*/
function mdrdEgfr(age: number, sex: Sex, scrMgDl: number) {
  const sexFactor = sex === 'Жіноча' ? 0.742 : 1;
  return 175 * Math.pow(scrMgDl, -1.154) * Math.pow(age, -0.203) * sexFactor;
}

/* ===== Інтерпретація G-стадій (як у CKD-EPI) ===== */
function interpretGFR(gfr: number) {
  if (gfr >= 90)   return { stage: 'G1', range: '≥90',   text: 'нормальна або висока',    chip: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
  if (gfr >= 60)   return { stage: 'G2', range: '60–89', text: 'злегка знижена',          chip: 'bg-lime-50 text-lime-900 border-lime-200' };
  if (gfr >= 45)   return { stage: 'G3a',range: '45–59', text: 'помірно знижена',         chip: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
  if (gfr >= 30)   return { stage: 'G3b',range: '30–44', text: 'помірно–тяжко знижена',   chip: 'bg-orange-50 text-orange-900 border-orange-200' };
  if (gfr >= 15)   return { stage: 'G4', range: '15–29', text: 'тяжко знижена',           chip: 'bg-red-50 text-red-900 border-red-200' };
  return                { stage: 'G5', range: '<15',   text: 'ниркова недостатність',   chip: 'bg-rose-50 text-rose-900 border-rose-200' };
}

export default function MDRDPage() {
  const [sex, setSex] = useState<Sex>('Жіноча');
  const [ageStr, setAgeStr] = useState('');
  const [unit, setUnit] = useState<Unit>('мкмоль/л');
  const [scrStr, setScrStr] = useState('');

  const [result, setResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const age = ageStr ? parseInt(ageStr, 10) : NaN;
  const scr = toNumberOrNaN(scrStr);
  const scrMgDl = mgdlFrom(scr, unit);

  const canCalc = useMemo(
    () => Number.isFinite(age) && age > 0 && Number.isFinite(scr) && scr > 0,
    [age, scr]
  );

  function handleCalc(e: React.FormEvent) {
    e.preventDefault();
    if (!canCalc) return;
    const egfr = mdrdEgfr(age, sex, scrMgDl);
    setResult(Number(egfr.toFixed(0))); // MDRD зазвичай округлюють до цілого
  }

  async function copy() {
    if (result == null) return;
    const i = interpretGFR(result);
    const text = `eGFR (MDRD): ${result} мл/хв/1.73м² — ${i.stage} (${i.range}) — ${i.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  // При зміні вводу — ховаємо попередній результат
  React.useEffect(() => { setResult(null); }, [sex, ageStr, unit, scrStr]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-center text-4xl font-bold tracking-tight mb-8">
          Калькулятор eGFR — MDRD
        </h1>

        <form onSubmit={handleCalc} className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 p-6 sm:p-8 space-y-6">
          <div>
            <label className="block font-semibold mb-2">Стать:</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Жіноча</option>
              <option>Чоловіча</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">Вік (років):</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Напр., 60"
              value={ageStr}
              onChange={(e) => setAgeStr(e.target.value.replace(/\D/g, '').slice(0, 3))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Креатинін:</label>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder={unit === 'мкмоль/л' ? 'мкмоль/л (наприкл., 88)' : 'мг/дл (наприкл., 1,0)'}
                value={scrStr}
                onChange={(e) => setScrStr(sanitizeDecimalInput(e.target.value))}
                onBlur={() => setScrStr((v) => normalizeOnBlur(v))}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-36 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>мкмоль/л</option>
                <option>мг/дл</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Десятковий роздільник — «,» або «.». Поле може бути порожнім.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canCalc}
            className={`w-full rounded-xl px-4 py-3 text-white font-semibold shadow-lg transition
              ${canCalc ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}
            `}
          >
            Розрахувати
          </button>

          {!canCalc && (
            <p className="text-xs text-slate-500 -mt-4">
              Введіть вік та креатинін.
            </p>
          )}
        </form>

        {result !== null && (() => {
          const i = interpretGFR(result);
          return (
            <div className="mt-6 rounded-xl border p-4 shadow-sm bg-white/70">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-2xl">
                  <span className="font-bold">eGFR:</span>{' '}
                  <span className="font-mono">{result}</span> мл/хв/1.73м²
                </div>
                <button
                  onClick={copy}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {copied ? 'Скопійовано ✓' : 'Копіювати'}
                </button>
              </div>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${i.chip}`}
              >
                <span className="font-bold">{i.stage}</span>
                <span className="opacity-80">({i.range}) — {i.text}</span>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                * MDRD менш точна при eGFR &gt; 60 мл/хв/1.73м²; за можливості використовуйте CKD-EPI.
                Результат довідковий і не замінює консультацію лікаря.
              </p>
            </div>
          );
        })()}

        <div className="mt-8">
          <Link href="/kidney-function" className="text-slate-600 hover:text-blue-700">
            ← Назад до функції нирок
          </Link>
        </div>
      </div>
    </div>
  );
}
