'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';

/** ========= Вікові пороги eGFR (мл/хв/1.73м²) у МІСЯЦЯХ ========= */
const AGE_EGFR_BANDS: { maxMonths: number; lowerLimit: number; label: string }[] = [
  { maxMonths: 1,   lowerLimit: 25, label: '0–1 міс' },
  { maxMonths: 3,   lowerLimit: 40, label: '1–3 міс' },
  { maxMonths: 6,   lowerLimit: 55, label: '3–6 міс' },
  { maxMonths: 12,  lowerLimit: 70, label: '6–12 міс' },
  { maxMonths: 24,  lowerLimit: 80, label: '12–24 міс' },
  { maxMonths: 60,  lowerLimit: 90, label: '2–5 років' },
];

type Formula = 'Schwartz (2009)' | 'Uemura (2022)' | 'Filler (2005)';
type Unit = 'мкмоль/л' | 'мг/дл';
type Sex = 'Дівчина' | 'Хлопець';

const UMOL_PER_MGDL = 88.4;

/* ==================== Утиліти ==================== */
function sanitizeDecimalInput(s: string): string {
  let v = s.replace(/[^\d.,]/g, '');
  const parts = v.split(/[.,]/);
  if (parts.length > 1) v = parts[0] + '.' + parts.slice(1).join('');
  return v;
}
function normalizeOnBlur(s: string): string {
  if (!s) return '';
  let v = s.replace(',', '.');
  if (v.startsWith('.')) v = '0' + v;
  if (/^\d+$/.test(v)) return String(parseInt(v, 10));
  return v;
}
function toNum(s: string): number {
  if (!s) return NaN;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function toMgdl(value: number, unit: Unit) {
  return unit === 'мкмоль/л' ? value / UMOL_PER_MGDL : value;
}

/* ================ Формули eGFR ================ */
function egfrHeightBased(heightCm: number, scrMgdl: number, K: number) {
  return (K * heightCm) / scrMgdl;
}
function K_schwartz(ageYears: number, sex: Sex) {
  if (ageYears < 1) return 0.45;
  if (sex === 'Хлопець' && ageYears >= 13) return 0.7;
  return 0.55;
}
const K_uemura = 0.413;
const K_filler = 0.516;

/* =========== Інтерпретація =========== */
function kdigoChip(gfr: number) {
  if (gfr >= 90)   return { badge: 'G1 (≥90)',   text: 'нормальна/висока',        chip: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
  if (gfr >= 60)   return { badge: 'G2 (60–89)', text: 'злегка знижена',          chip: 'bg-lime-50 text-lime-900 border-lime-200' };
  if (gfr >= 45)   return { badge: 'G3a (45–59)',text: 'помірно знижена',         chip: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
  if (gfr >= 30)   return { badge: 'G3b (30–44)',text: 'помірно–тяжко знижена',   chip: 'bg-orange-50 text-orange-900 border-orange-200' };
  if (gfr >= 15)   return { badge: 'G4 (15–29)', text: 'тяжко знижена',           chip: 'bg-red-50 text-red-900 border-red-200' };
  return                { badge: 'G5 (<15)',    text: 'ниркова недостатність',   chip: 'bg-rose-50 text-rose-900 border-rose-200' };
}
function pickAgeBand(months: number) {
  return AGE_EGFR_BANDS.find(b => months <= b.maxMonths) || null;
}
function interpretWithAge(gfr: number, ageYears: number) {
  const months = Math.round(ageYears * 12);
  const band = pickAgeBand(months);
  if (band) {
    const LL = band.lowerLimit;
    const warn = LL * 0.8;
    if (gfr >= LL)    return { mode: 'age' as const, badge: `У нормі (≥${LL})`,     text: `відповідає віку — ${band.label}`, chip: 'bg-emerald-50 text-emerald-900 border-emerald-200', band };
    if (gfr >= warn)  return { mode: 'age' as const, badge: `Нижче очікуваного`,    text: `оцініть у динаміці — поріг ≥${LL} (${band.label})`, chip: 'bg-yellow-50 text-yellow-900 border-yellow-200', band };
    return                  { mode: 'age' as const, badge: `Суттєво нижче`,         text: `поріг віку ≥${LL} (${band.label})`, chip: 'bg-rose-50 text-rose-900 border-rose-200', band };
  }
  return { mode: 'kdigo' as const, ...kdigoChip(gfr), band: null as any };
}

/* ======= Обчислення віку з дати народження ======= */
function diffYearsMonths(dobISO: string) {
  if (!dobISO) return { years: 0, months: 0, ok: false };
  const dob = new Date(dobISO + 'T00:00:00');
  const now = new Date();
  if (isNaN(dob.getTime()) || dob > now) return { years: 0, months: 0, ok: false };

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  if (dayDiff < 0) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, ok: true };
}

/* =================== Компонент =================== */
export default function PediatricEGFR() {
  const [formula, setFormula] = useState<Formula>('Schwartz (2009)');
  const [sex, setSex] = useState<Sex>('Дівчина');

  // Новий спосіб вводу віку: два поля + необовʼязкова дата народження
  const [ageYearsStr, setAgeYearsStr] = useState('');
  const [ageMonthsStr, setAgeMonthsStr] = useState('');
  const [dob, setDob] = useState('');

  const yearsInt = Number.isFinite(parseInt(ageYearsStr)) ? parseInt(ageYearsStr) : NaN;
  const monthsIntRaw = Number.isFinite(parseInt(ageMonthsStr)) ? parseInt(ageMonthsStr) : NaN;
  const monthsInt = Number.isFinite(monthsIntRaw) ? Math.min(Math.max(monthsIntRaw, 0), 11) : NaN;
  const ageYears = Number.isFinite(yearsInt) && Number.isFinite(monthsInt) ? yearsInt + monthsInt / 12 : NaN;

  // Якщо ввели ДН — автозаповнюємо роки/місяці
  useEffect(() => {
    const { years, months, ok } = diffYearsMonths(dob);
    if (ok) {
      setAgeYearsStr(String(years));
      setAgeMonthsStr(String(months));
    }
  }, [dob]);

  const [heightStr, setHeightStr] = useState('');
  const [scrStr, setScrStr] = useState('');
  const [unit, setUnit] = useState<Unit>('мкмоль/л');

  const height = toNum(heightStr);
  const scr = toNum(scrStr);
  const scrMgdl = toMgdl(scr, unit);

  const valid = useMemo(
    () =>
      Number.isFinite(ageYears) && ageYears >= 0 &&
      Number.isFinite(height) && height > 20 && height < 230 &&
      Number.isFinite(scr) && scr > 0,
    [ageYears, height, scr]
  );

  const [result, setResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setResult(null); setCopied(false); }, [formula, sex, ageYearsStr, ageMonthsStr, dob, heightStr, scrStr, unit]);

  function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    let K: number;
    if (formula.startsWith('Schwartz')) K = K_schwartz(ageYears, sex);
    else if (formula.startsWith('Uemura')) K = K_uemura;
    else K = K_filler;

    const egfr = egfrHeightBased(height, scrMgdl, K);
    setResult(Number.isFinite(egfr) ? Number(egfr.toFixed(1)) : null);
  }

  async function copyResult() {
    if (result == null) return;
    const i = interpretWithAge(result, ageYears);
    const ageTxt = i.mode === 'age' && i.band ? `; вікова норма ≥${i.band.lowerLimit} (${i.band.label})` : '';
    const txt = `eGFR (педіатр.) = ${result} мл/хв/1.73м² — ${i.badge} — ${i.text}${ageTxt} [${formula}]`;
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function onUnitChange(next: Unit) {
    if (!scrStr) { setUnit(next); return; }
    const val = toNum(scrStr);
    if (!Number.isFinite(val)) { setUnit(next); return; }
    if (unit === next) return;
    const converted = next === 'мг/дл' ? (val / UMOL_PER_MGDL) : (val * UMOL_PER_MGDL);
    const formatted = next === 'мг/дл' ? converted.toFixed(2) : Math.round(converted).toString();
    setScrStr(formatted);
    setUnit(next);
  }

  const interp = result != null && Number.isFinite(ageYears) ? interpretWithAge(result, ageYears) : null;
  const monthsTotalPreview = Number.isFinite(ageYears) ? Math.round(ageYears * 12) : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-8">
          Педіатричний калькулятор ШКФ (роки + місяці)
        </h1>

        <form onSubmit={calc} className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 p-6 sm:p-8 space-y-6">
          <div>
            <label className="block font-semibold mb-2">Формула:</label>
            <select
              value={formula}
              onChange={(e) => setFormula(e.target.value as Formula)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Schwartz (2009)</option>
              <option>Uemura (2022)</option>
              <option>Filler (2005)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Стать:</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Дівчина</option>
                <option>Хлопець</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Дата народження (необов’язково):</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Якщо виберете дату — поля років і місяців підставляться автоматично.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-2">Вік:</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    placeholder="роки"
                    value={ageYearsStr}
                    onChange={(e) => setAgeYearsStr(e.target.value.replace(/[^\d]/g, ''))}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      Number.isFinite(yearsInt) ? 'border-slate-300 focus:ring-blue-500' : 'border-rose-300 focus:ring-rose-400'
                    }`}
                  />
                  <span className="text-sm text-slate-600">роки</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    placeholder="місяці (0–11)"
                    value={ageMonthsStr}
                    onChange={(e) => setAgeMonthsStr(e.target.value.replace(/[^\d]/g, ''))}
                    onBlur={() => setAgeMonthsStr(v => {
                      if (!v) return v;
                      const n = parseInt(v);
                      if (!Number.isFinite(n)) return '';
                      return String(Math.min(Math.max(n, 0), 11));
                    })}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      Number.isFinite(monthsInt) ? 'border-slate-300 focus:ring-blue-500' : 'border-rose-300 focus:ring-rose-400'
                    }`}
                  />
                  <span className="text-sm text-slate-600">місяців</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Number.isFinite(ageYears)
                  ? <>≈ <b>{ageYears.toFixed(2)}</b> року ({monthsTotalPreview} міс.)</>
                  : 'Укажіть роки та місяці (місяців 0–11).'}
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-2">Зріст (см):</label>
              <input
                inputMode="decimal"
                placeholder="напр., 110"
                value={heightStr}
                onChange={(e) => setHeightStr(sanitizeDecimalInput(e.target.value))}
                onBlur={() => setHeightStr(v => normalizeOnBlur(v))}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                  Number.isFinite(height) && height > 20 && height < 230 ? 'border-slate-300 focus:ring-blue-500' : 'border-rose-300 focus:ring-rose-400'
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">Вкажіть зріст у сантиметрах.</p>
            </div>

            <div>
              <label className="block font-semibold mb-2">Креатинін:</label>
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  placeholder={unit === 'мкмоль/л' ? 'напр., 40' : 'напр., 0.45'}
                  value={scrStr}
                  onChange={(e) => setScrStr(sanitizeDecimalInput(e.target.value))}
                  onBlur={() => setScrStr(v => normalizeOnBlur(v))}
                  className={`flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    Number.isFinite(scr) && scr > 0 ? 'border-slate-300 focus:ring-blue-500' : 'border-rose-300 focus:ring-rose-400'
                  }`}
                />
                <select
                  value={unit}
                  onChange={(e) => onUnitChange(e.target.value as Unit)}
                  className="w-36 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>мкмоль/л</option>
                  <option>мг/дл</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1">Десятковий роздільник — «,» або «.».</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!valid}
            className={`w-full rounded-xl px-4 py-3 text-white font-semibold shadow-lg transition
              ${valid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}
            `}
          >
            Розрахувати
          </button>

          {!valid && (
            <p className="text-xs text-rose-600 -mt-3">
              Перевірте коректність віку (роки + 0–11 міс), зросту та креатиніну.
            </p>
          )}
        </form>

        {result != null && interp && (
          <div className="mt-6 rounded-xl border p-4 shadow-sm bg-white/70">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-2xl">
                <span className="font-bold">eGFR:</span>{' '}
                <span className="font-mono">{result}</span> мл/хв/1.73м²
              </div>
              <button
                onClick={copyResult}
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                {copied ? 'Скопійовано ✓' : 'Копіювати'}
              </button>
            </div>

            <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${interp.chip}`}>
              <span className="font-bold">{interp.badge}</span>
              <span className="opacity-80">— {interp.text}</span>
            </div>

            {interp.mode === 'age' && interp.band && (
              <p className="text-xs text-slate-600 mt-3">
                Вікова норма: <span className="font-semibold">≥ {interp.band.lowerLimit} мл/хв/1.73м²</span> ({interp.band.label}). 
                Пороги редагуються у <code>AGE_EGFR_BANDS</code>.
              </p>
            )}

            {interp.mode === 'kdigo' && (
              <p className="text-xs text-slate-600 mt-3">
                Інтерпретація за KDIGO (G-стадії). Результат довідковий і не замінює консультацію лікаря.
              </p>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Формула: {formula}. Для Schwartz коефіцієнт K: 0.45 (&lt;1р), 0.55 (дівчата та хлопці &lt;13р), 0.70 (хлопці ≥13р).
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link href="/kidney-function" className="text-slate-600 hover:text-blue-700">
            ← Назад до функції нирок
          </Link>
        </div>
      </div>
    </div>
  );
}
