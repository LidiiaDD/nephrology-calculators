// app/biomarkers/uacr/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------------- helpers ---------------- */
type Unit = 'mg/g' | 'mg/mmol';

const sanitizeDecimal = (s: string) => (s ?? '').replace(/[^\d.,-]/g, '');
const toNum = (s: string): number | null => {
  const t = (s ?? '').trim();
  if (!t) return null;
  const v = Number(t.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

const pillTone = {
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  bad: 'bg-rose-50 text-rose-800 ring-rose-200',
  muted: 'bg-slate-50 text-slate-600 ring-slate-200',
} as const;

const LS_KEY = 'nephro:uacr:v3';

/* Конверсії та інтерпретація:
   - Для режиму mg/g очікуємо: Альбумін — мг/л, Креатинін — мг/дл.
     UACR(mg/g) = Alb(mg/L) / [Crea(mg/dL) × 0.01] = Alb × 100 / Crea.
   - Для режиму mg/mmol очікуємо: Альбумін — мг/л, Креатинін — ммоль/л.
     UACR(mg/mmol) = Alb(mg/L) / Crea(mmol/L).
   - Перерахунок: mg/mmol × 8.84 ≈ mg/g; mg/g ÷ 8.84 ≈ mg/mmol.
*/
const MMOL_PER_G_CREAT = 8.84 as const;

function interpretByMgG(uacr_mg_g: number) {
  if (uacr_mg_g < 30) return { cat: 'A1', label: 'Норма (<30 mg/g)', tone: 'ok' as const };
  if (uacr_mg_g <= 300) return { cat: 'A2', label: 'Мікроальбумінурія (30–300 mg/g)', tone: 'warn' as const };
  return { cat: 'A3', label: 'Макроальбумінурія (>300 mg/g)', tone: 'bad' as const };
}

/* ---------------- icons ---------------- */
const ArrowLeft = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
       className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);
const Info = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
       className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8h.01M11 12h2v6h-2z" />
  </svg>
);

/* ---------------- page ---------------- */
export default function UACRPage() {
  const [unit, setUnit] = useState<Unit>('mg/g');

  // зберігаємо РЯДКИ → поля можуть бути порожні
  const [albStr, setAlbStr] = useState('');
  const [creaStr, setCreaStr] = useState('');

  // автозавантаження / автозбереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { unit?: Unit; albStr?: string; creaStr?: string };
        setUnit(v.unit ?? 'mg/g');
        setAlbStr(v.albStr ?? '');
        setCreaStr(v.creaStr ?? '');
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ unit, albStr, creaStr }));
    } catch {}
  }, [unit, albStr, creaStr]);

  // парсинг
  const alb = useMemo(() => toNum(albStr), [albStr]);   // мг/л
  const crea = useMemo(() => toNum(creaStr), [creaStr]); // мг/дл (для mg/g) або ммоль/л (для mg/mmol)

  // базова валідація (реалістично широкі діапазони)
  const albOk = inRange(alb, 0, 10000);
  const creaOk = unit === 'mg/g' ? inRange(crea, 1, 500) : inRange(crea, 0.1, 500);

  // розрахунок у вибраній одиниці
  const uacr = useMemo(() => {
    if (!albOk || !creaOk) return null;
    if (unit === 'mg/g') return (alb! * 100) / (crea as number);
    return alb! / (crea as number); // mg/mmol
  }, [unit, albOk, creaOk, alb, crea]);

  // показ у двох одиницях
  const uacr_mg_g = useMemo(() => (uacr == null ? null : unit === 'mg/g' ? uacr : uacr * MMOL_PER_G_CREAT), [uacr, unit]);
  const uacr_mg_mmol = useMemo(() => (uacr == null ? null : unit === 'mg/mmol' ? uacr : uacr / MMOL_PER_G_CREAT), [uacr, unit]);

  // інтерпретація
  const interp = useMemo(() => (uacr_mg_g != null ? interpretByMgG(uacr_mg_g) : null), [uacr_mg_g]);

  // автоскрол до результату
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (uacr != null && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrolledOnce.current = true;
    }
  }, [uacr]);

  // прогрес-бар (2 поля)
  const progress = useMemo(() => {
    let n = 0;
    if ((albStr ?? '').trim()) n++;
    if ((creaStr ?? '').trim()) n++;
    return n;
  }, [albStr, creaStr]);

  const onReset = () => {
    setAlbStr('');
    setCreaStr('');
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (uacr == null || uacr_mg_g == null || uacr_mg_mmol == null || !interp) return;
    const txt = `UACR: ${unit === 'mg/g' ? uacr.toFixed(1) : uacr.toFixed(2)} ${unit} — ${interp.cat} ${interp.label} (≈ ${uacr_mg_g.toFixed(1)} mg/g; ≈ ${uacr_mg_mmol.toFixed(2)} mg/mmol)`;
    try {
      await navigator.clipboard.writeText(txt);
      alert('Скопійовано в буфер обміну.');
    } catch {
      alert(txt);
    }
  };

  // тон зведеного блоку
  const tone = uacr == null ? 'muted' : interp?.tone ?? 'muted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:py-10">
        {/* Хедер */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              UACR — Альбумін/Креатинін у сечі
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Заповніть <b>альбумін</b> (мг/л) та <b>креатинін</b> у відповідних одиницях.
              Поля підтримують десяткові роздільники «,» та «.». Розрахунок — автоматичний.
            </p>
          </div>
          <Link
            href="/biomarkers"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft /> До біомаркерів
          </Link>
        </div>

        {/* Зведена інтерпретація */}
        <div className={`mb-6 rounded-2xl border ring-1 p-4 ${pillTone[tone]}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/60 p-2 text-inherit ring-1 ring-black/5">
              <Info />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase">Зведена інтерпретація</div>
              <div className="mt-1 text-base">
                {uacr == null ? 'Введіть обидва показники для розрахунку.' : `${interp!.cat}: ${interp!.label}`}
              </div>
              {uacr != null && (
                <div className="mt-1 text-sm opacity-80">
                  {unit === 'mg/g'
                    ? `UACR = ${uacr.toFixed(1)} mg/g (≈ ${uacr_mg_mmol!.toFixed(2)} mg/mmol)`
                    : `UACR = ${uacr.toFixed(2)} mg/mmol (≈ ${uacr_mg_g!.toFixed(1)} mg/g)`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Перемикач одиниць виводу */}
        <div className="mb-4 inline-flex overflow-hidden rounded-xl shadow">
          <button
            className={`px-4 py-2 text-sm font-medium ${unit === 'mg/g' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setUnit('mg/g')}
          >
            mg/g (KDIGO)
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${unit === 'mg/mmol' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setUnit('mg/mmol')}
          >
            mg/mmol
          </button>
        </div>

        {/* Прогрес */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>Заповнено: {progress} / 2</span>
            <span>{Math.round((progress / 2) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-600 transition-[width]" style={{ width: `${(progress / 2) * 100}%` }} />
          </div>
        </div>

        {/* Форма */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Альбумін у сечі <span className="text-xs text-gray-500">(мг/л)</span>
              </label>
              <input
                inputMode="decimal"
                placeholder="напр., 40"
                value={albStr}
                onChange={(e) => setAlbStr(sanitizeDecimal(e.target.value))}
                className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  albStr && !albOk ? 'border-rose-300' : 'border-gray-200 focus:border-blue-500'
                }`}
                aria-invalid={albStr && !albOk || undefined}
              />
              <div className="mt-1 text-xs text-gray-500">Допустимо: 0–10000 мг/л.</div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Креатинін у сечі{' '}
                <span className="text-xs text-gray-500">({unit === 'mg/g' ? 'мг/дл' : 'ммоль/л'})</span>
              </label>
              <input
                inputMode="decimal"
                placeholder={unit === 'mg/g' ? 'напр., 120 (мг/дл)' : 'напр., 12 (ммоль/л)'}
                value={creaStr}
                onChange={(e) => setCreaStr(sanitizeDecimal(e.target.value))}
                className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  creaStr && !creaOk ? 'border-rose-300' : 'border-gray-200 focus:border-blue-500'
                }`}
                aria-invalid={creaStr && !creaOk || undefined}
              />
              <div className="mt-1 text-xs text-gray-500">
                {unit === 'mg/g'
                  ? 'Для mg/g: UACR = Альбумін(мг/л) × 100 / Креатинін(мг/дл).'
                  : 'Для mg/mmol: UACR = Альбумін(мг/л) / Креатинін(ммоль/л).'}
              </div>
            </div>
          </div>

          {/* Дії */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCopy}
              disabled={uacr == null}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                uacr != null ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}
              title={uacr != null ? 'Скопіювати підсумок' : 'Заповніть обидва поля коректно'}
            >
              Копіювати результат
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Очистити
            </button>
          </div>
        </div>

        {/* Дисклеймери */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
            <span className="font-semibold">Пояснення одиниць.</span>{' '}
            Для <b>mg/g</b> введіть креатинін у <b>мг/дл</b>, для <b>mg/mmol</b> — у <b>ммоль/л</b>.
            Показники порівнюються за категоріями <b>KDIGO (A1–A3)</b>.
          </div>
          <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
            Результат є довідковим і не замінює консультацію лікаря. Перевіряйте
            референтні інтервали вашої лабораторії та одиниці вимірювання.
          </div>
        </div>
      </div>
    </div>
  );
}
