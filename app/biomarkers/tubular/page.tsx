// app/biomarkers/tubular/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/* ---------- утиліти ---------- */
const parseDecimal = (raw: string): number | null => {
  if (!raw) return null;
  const normalized = raw.replace(',', '.').trim();
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const val = Number(normalized);
  return Number.isFinite(val) ? val : null;
};

const toStr = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(n) ? '' : String(n);

/* ---------- локальне збереження ---------- */
const LS_KEY = 'nephro:tubular-panel:v1';

type StoredState = { lfabp: string; ngal: string; kim1: string };

const loadState = (): StoredState | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    return null;
  }
};

const saveState = (s: StoredState) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
};

/* ---------- пороги (умовні; відкоригуйте під свою лабораторію) ---------- */
const THRESHOLDS = {
  lfabp: 10,   // нг/мл
  ngal: 150,   // нг/мл
  kim1: 2.0,   // нг/мл
};

type Status = 'норма' | 'підвищений';
const statusColor: Record<Status, string> = {
  норма: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  підвищений: 'bg-rose-50 text-rose-700 ring-rose-200',
};

/* ---------- маленькі іконки (svg) ---------- */
const ChevronRight = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const ArrowLeft = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);
const Info = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       className={className} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8h.01M11 12h2v6h-2z" />
  </svg>
);

/* ---------- головний компонент ---------- */
export default function TubularBiomarkersPage() {
  // рядкові значення інпутів (щоб не підставляло «0»)
  const [lfabpStr, setLfabpStr] = useState('');
  const [ngalStr, setNgalStr] = useState('');
  const [kim1Str, setKim1Str] = useState('');

  // завантажити з localStorage
  useEffect(() => {
    const s = loadState();
    if (s) {
      setLfabpStr(s.lfabp);
      setNgalStr(s.ngal);
      setKim1Str(s.kim1);
    }
  }, []);

  // зберігати в localStorage
  useEffect(() => {
    saveState({ lfabp: lfabpStr, ngal: ngalStr, kim1: kim1Str });
  }, [lfabpStr, ngalStr, kim1Str]);

  // парсинг у числа
  const lfabp = useMemo(() => parseDecimal(lfabpStr), [lfabpStr]);
  const ngal  = useMemo(() => parseDecimal(ngalStr),  [ngalStr]);
  const kim1  = useMemo(() => parseDecimal(kim1Str),  [kim1Str]);

  // прості помилки
  const errors = {
    lfabp: lfabpStr !== '' && lfabp === null,
    ngal:  ngalStr  !== '' && ngal  === null,
    kim1:  kim1Str  !== '' && kim1  === null,
  };

  // прогрес заповнення
  const filledCount = useMemo(() => {
    let n = 0;
    if (lfabp !== null) n++;
    if (ngal  !== null) n++;
    if (kim1  !== null) n++;
    return n;
  }, [lfabp, ngal, kim1]);

  const progressPct = (filledCount / 3) * 100;

  // інтерпретація по кожному маркеру
  const lfabpStatus: Status | null =
    lfabp === null ? null : lfabp <= THRESHOLDS.lfabp ? 'норма' : 'підвищений';
  const ngalStatus: Status | null =
    ngal === null ? null : ngal <= THRESHOLDS.ngal ? 'норма' : 'підвищений';
  const kim1Status: Status | null =
    kim1 === null ? null : kim1 <= THRESHOLDS.kim1 ? 'норма' : 'підвищений';

  // скільки підвищених
  const totalElevated = useMemo(() => {
    let s = 0;
    if (lfabpStatus === 'підвищений') s++;
    if (ngalStatus  === 'підвищений') s++;
    if (kim1Status  === 'підвищений') s++;
    return s;
  }, [lfabpStatus, ngalStatus, kim1Status]);

  // зведене повідомлення
  const summaryLabel = useMemo(() => {
    if (filledCount === 0) return 'Заповніть принаймні один показник';
    switch (totalElevated) {
      case 0: return 'Ознак тубулярного ураження не виявлено (за заданими порогами)';
      case 1: return 'Можливе раннє/легке тубулярне ураження';
      case 2: return 'Підтримує наявність тубулярного ураження (помірний ступінь)';
      case 3: return 'Виражені ознаки тубулярного ураження';
      default: return '';
    }
  }, [filledCount, totalElevated]);

  type Tone = 'ok' | 'warn' | 'bad' | 'muted';
  const summaryTone: Tone = useMemo(() => {
    if (filledCount === 0) return 'muted';
    if (totalElevated === 0) return 'ok';
    if (totalElevated === 1) return 'warn';
    return 'bad';
  }, [filledCount, totalElevated]);

  const toneClasses: Record<Tone, string> = {
    ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-800 ring-amber-200',
    bad: 'bg-rose-50 text-rose-800 ring-rose-200',
    muted: 'bg-slate-50 text-slate-600 ring-slate-200',
  };

  // копіювання
  const onCopy = () => {
    const lines = [
      'Тубулярні біомаркери (сеча, нг/мл):',
      `• L-FABP: ${lfabpStr || '—'} (${lfabpStatus ?? '—'})`,
      `• NGAL: ${ngalStr || '—'} (${ngalStatus ?? '—'})`,
      `• KIM-1: ${kim1Str || '—'} (${kim1Status ?? '—'})`,
      '',
      `Підвищених маркерів: ${filledCount === 0 ? '—' : totalElevated}`,
      `Інтерпретація: ${summaryLabel}`,
      '',
      'Примітка: пороги умовні; перевіряйте референтні інтервали вашої лабораторії.',
    ].join('\n');

    try {
      navigator.clipboard.writeText(lines);
      alert('Результати скопійовано в буфер обміну.');
    } catch {
      alert(lines);
    }
  };

  const onReset = () => {
    setLfabpStr('');
    setNgalStr('');
    setKim1Str('');
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:py-10">
        {/* Хедер */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Тубулярні біомаркери (сеча)
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Введіть концентрації у <b>нг/мл</b>. Десяткові роздільники «,» та «.» приймаються.
              Пороги наведені як приклад; у реальній роботі звіряйте з методикою конкретної лабораторії.
            </p>
          </div>
          <Link
            href="/biomarkers"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft /> До біомаркерів
          </Link>
        </div>

        {/* Інтерпретація */}
        <div className={`mb-6 rounded-2xl border ring-1 p-4 ${toneClasses[summaryTone]}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/60 p-2 text-inherit ring-1 ring-black/5">
              <Info />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase">
                Зведена інтерпретація
              </div>
              <div className="mt-1 text-base">{summaryLabel}</div>
              <div className="mt-1 text-sm opacity-80">
                Підвищених маркерів: {filledCount === 0 ? '—' : totalElevated} / {filledCount}
              </div>
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
          {/* прогрес */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
              <span>Прогрес заповнення</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* поля */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* L-FABP */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                L-FABP <span className="text-xs text-gray-500">(нг/мл)</span>
              </label>
              <input
                value={lfabpStr}
                onChange={(e) => setLfabpStr(e.target.value)}
                placeholder="напр., 8,5"
                inputMode="decimal"
                className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  errors.lfabp ? 'border-rose-300' : 'border-gray-200 focus:border-blue-500'
                }`}
                aria-invalid={errors.lfabp || undefined}
                aria-describedby="lfabp-help"
              />
              <div id="lfabp-help" className="mt-1 text-xs text-gray-500">
                Поріг (умовно): ≤ {toStr(THRESHOLDS.lfabp)} — <span className="text-emerald-700">норма</span>
              </div>
              {lfabp !== null && (
                <div
                  className={`mt-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${
                    lfabpStatus ? statusColor[lfabpStatus] : 'bg-gray-50 text-gray-600 ring-gray-200'
                  }`}
                >
                  Статус: {lfabpStatus ?? '—'}
                </div>
              )}
            </div>

            {/* NGAL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                NGAL <span className="text-xs text-gray-500">(нг/мл)</span>
              </label>
              <input
                value={ngalStr}
                onChange={(e) => setNgalStr(e.target.value)}
                placeholder="напр., 120"
                inputMode="decimal"
                className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  errors.ngal ? 'border-rose-300' : 'border-gray-200 focus:border-blue-500'
                }`}
                aria-invalid={errors.ngal || undefined}
                aria-describedby="ngal-help"
              />
              <div id="ngal-help" className="mt-1 text-xs text-gray-500">
                Поріг (умовно): ≤ {toStr(THRESHOLDS.ngal)} — <span className="text-emerald-700">норма</span>
              </div>
              {ngal !== null && (
                <div
                  className={`mt-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${
                    ngalStatus ? statusColor[ngalStatus] : 'bg-gray-50 text-gray-600 ring-gray-200'
                  }`}
                >
                  Статус: {ngalStatus ?? '—'}
                </div>
              )}
            </div>

            {/* KIM-1 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                KIM-1 <span className="text-xs text-gray-500">(нг/мл)</span>
              </label>
              <input
                value={kim1Str}
                onChange={(e) => setKim1Str(e.target.value)}
                placeholder="напр., 1,7"
                inputMode="decimal"
                className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  errors.kim1 ? 'border-rose-300' : 'border-gray-200 focus:border-blue-500'
                }`}
                aria-invalid={errors.kim1 || undefined}
                aria-describedby="kim1-help"
              />
              <div id="kim1-help" className="mt-1 text-xs text-gray-500">
                Поріг (умовно): ≤ {toStr(THRESHOLDS.kim1)} — <span className="text-emerald-700">норма</span>
              </div>
              {kim1 !== null && (
                <div
                  className={`mt-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${
                    kim1Status ? statusColor[kim1Status] : 'bg-gray-50 text-gray-600 ring-gray-200'
                  }`}
                >
                  Статус: {kim1Status ?? '—'}
                </div>
              )}
            </div>
          </div>

          {/* дії */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Копіювати результат
              <ChevronRight />
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Очистити
            </button>
          </div>
        </div>

        {/* дисклеймери */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
            <span className="font-semibold">Важливо.</span> Модуль для
            <b> тубулярних маркерів у сечі (нг/мл)</b>. Для сироватки/плазми референси інші.
          </div>
          <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
            Результат довідковий і не замінює консультацію лікаря. Пороги наведені орієнтовно.
          </div>
        </div>
      </div>
    </div>
  );
}
