// app/biomarkers/umodulin/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------------- helpers ---------------- */
const sanitizeDecimal = (s: string) => (s ?? '').replace(/[^\d.,-]/g, '');
const toNum = (s: string): number | null => {
  const t = (s ?? '').trim();
  if (!t) return null;
  const v = Number(t.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};
const toStr = (n: number | null | undefined, d = 2) =>
  n == null || !Number.isFinite(n) ? '—' : n.toFixed(d);

type SUmodU = 'ng/mL' | 'mg/L';
type UUmodU = 'mg/L' | 'ng/mL';
type SCreaU = 'µmol/L' | 'mg/dL';
type UCreaU = 'mmol/L' | 'mg/dL';
type UAlbU = 'mg/L';

/* Конверсії */
const mgL_to_ngmL = (x: number) => x * 1000;
const ngmL_to_mgL = (x: number) => x / 1000;
const umolL_to_mgdl_crea = (x: number) => x / 88.4;   // 1 mg/dL ≈ 88.4 µmol/L
const mgdl_to_mmolL_crea = (x: number) => x * 0.0884; // 1 mg/dL ≈ 0.0884 mmol/L

const LS_KEY = 'nephro:umod-profile:v1';

/* Пороги (клінічні «прапорці», орієнтовно) */
const FLAGS = {
  uUmodLow_mgL: 20,      // uUmod < 20 мг/л — ранній тубулярний ризик
  FeUmodLow_pct: 10,     // FeUmod < 10% — можливий дефіцит секреції
  uAlb_uUmodHigh: 0.94,  // uAlb/uUmod > 0.94 — ризик прогресування ХХН
};

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
export default function UromodulinProfilePage() {
  // одиниці
  const [sUmodU, setSUmodU] = useState<SUmodU>('ng/mL');
  const [uUmodU, setUUmodU] = useState<UUmodU>('mg/L');
  const [sCreaU, setSCreaU] = useState<SCreaU>('µmol/L');
  const [uCreaU, setUCreaU] = useState<UCreaU>('mmol/L');
  const [uAlbU]  = useState<UAlbU>('mg/L');

  // значення (рядками, щоб не було примусових «0»)
  const [sUmodStr, setSUmodStr] = useState('');
  const [uUmodStr, setUUmodStr] = useState('');
  const [sCreaStr, setSCreaStr] = useState('');
  const [uCreaStr, setUCreaStr] = useState('');
  const [egfrStr,  setEgfrStr]  = useState(''); // мл/хв/1.73 м² (необов’язково, але бажано)
  const [uAlbStr,  setUAlbStr]  = useState(''); // мг/л (необов’язково)

  // авто-завантаження/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setSUmodU(v.sUmodU ?? 'ng/mL'); setUUmodU(v.uUmodU ?? 'mg/L');
        setSCreaU(v.sCreaU ?? 'µmol/L'); setUCreaU(v.uCreaU ?? 'mmol/L');
        setSUmodStr(v.sUmodStr ?? ''); setUUmodStr(v.uUmodStr ?? '');
        setSCreaStr(v.sCreaStr ?? ''); setUCreaStr(v.uCreaStr ?? '');
        setEgfrStr(v.egfrStr ?? ''); setUAlbStr(v.uAlbStr ?? '');
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          sUmodU, uUmodU, sCreaU, uCreaU,
          sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr, uAlbStr
        })
      );
    } catch {}
  }, [sUmodU, uUmodU, sCreaU, uCreaU, sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr, uAlbStr]);

  // парсинг → числа
  const sUmod_in = useMemo(() => toNum(sUmodStr), [sUmodStr]); // ng/mL або mg/L
  const uUmod_in = useMemo(() => toNum(uUmodStr), [uUmodStr]); // mg/L або ng/mL
  const sCrea_in = useMemo(() => toNum(sCreaStr), [sCreaStr]); // µmol/L або mg/dL
  const uCrea_in = useMemo(() => toNum(uCreaStr), [uCreaStr]); // mmol/L або mg/dL
  const egfr     = useMemo(() => toNum(egfrStr),   [egfrStr]);  // mL/min/1.73m²
  const uAlb     = useMemo(() => toNum(uAlbStr),   [uAlbStr]);  // mg/L

  // конверсії у робочі «базові» одиниці:
  // sUmod → ng/mL; uUmod → mg/L; sCrea → mg/dL; uCrea → mmol/L
  const sUmod_ngmL = useMemo(() => {
    if (sUmod_in == null) return null;
    return sUmodU === 'ng/mL' ? sUmod_in : mgL_to_ngmL(sUmod_in);
  }, [sUmod_in, sUmodU]);

  const uUmod_mgL = useMemo(() => {
    if (uUmod_in == null) return null;
    return uUmodU === 'mg/L' ? uUmod_in : ngmL_to_mgL(uUmod_in);
  }, [uUmod_in, uUmodU]);

  const sCrea_mgdl = useMemo(() => {
    if (sCrea_in == null) return null;
    return sCreaU === 'mg/dL' ? sCrea_in : umolL_to_mgdl_crea(sCrea_in);
  }, [sCrea_in, sCreaU]);

  const uCrea_mmolL = useMemo(() => {
    if (uCrea_in == null) return null;
    return uCreaU === 'mmol/L' ? uCrea_in : mgdl_to_mmolL_crea(uCrea_in);
  }, [uCrea_in, uCreaU]);

  // прогрес заповнення (кількість валідних чисел серед ключових)
  const filled = useMemo(() => {
    let n = 0;
    if (sUmod_ngmL != null) n++;
    if (uUmod_mgL != null) n++;
    if (sCrea_mgdl != null) n++;
    if (uCrea_mmolL != null) n++;
    if (egfr != null) n++;
    if (uAlb != null) n++;
    return n;
  }, [sUmod_ngmL, uUmod_mgL, sCrea_mgdl, uCrea_mmolL, egfr, uAlb]);
  const progressPct = Math.round((filled / 6) * 100);

  /* ----------- Розрахунки профілю ----------- 
     Формули (за твоїми вимогами):
     FeUmod (%) = ((uUmod/uCrea) / (sUmod/sCrea)) / (egfr || 1) * 100
     FsUmod (%) = (sUmod*sCrea) / (uUmod*uCrea) * 100
     uAlb/uUmod = uAlb / uUmod
     sUmod/sCrea = sUmod / sCrea
     Примітка: одиниці впливають на числові значення; дотримуйся вказаних вище конверсій.
  ----------------------------------------------*/
  const ratio_sUmod_sCrea = useMemo(() => {
    if (sUmod_ngmL == null || sCrea_mgdl == null) return null;
    return sUmod_ngmL / sCrea_mgdl;
  }, [sUmod_ngmL, sCrea_mgdl]);

  const ratio_uUmod_uCrea = useMemo(() => {
    if (uUmod_mgL == null || uCrea_mmolL == null) return null;
    return uUmod_mgL / uCrea_mmolL;
  }, [uUmod_mgL, uCrea_mmolL]);

  const FeUmod_pct = useMemo(() => {
    if (ratio_uUmod_uCrea == null || ratio_sUmod_sCrea == null) return null;
    const denomEgfr = egfr ?? 1; // якщо eGFR не задано — не ділимо (як у твоєму коді)
    if (denomEgfr === 0) return null;
    return (ratio_uUmod_uCrea / ratio_sUmod_sCrea) / denomEgfr * 100;
  }, [ratio_uUmod_uCrea, ratio_sUmod_sCrea, egfr]);

  const FsUmod_pct = useMemo(() => {
    if (sUmod_ngmL == null || sCrea_mgdl == null || uUmod_mgL == null || uCrea_mmolL == null) return null;
    if (uUmod_mgL === 0 || uCrea_mmolL === 0) return null;
    return ( (sUmod_ngmL * sCrea_mgdl) / (uUmod_mgL * uCrea_mmolL) ) * 100;
  }, [sUmod_ngmL, sCrea_mgdl, uUmod_mgL, uCrea_mmolL]);

  const uAlb_over_uUmod = useMemo(() => {
    if (uAlb == null || uUmod_mgL == null || uUmod_mgL === 0) return null;
    return uAlb / uUmod_mgL;
  }, [uAlb, uUmod_mgL]);

  // прапорці/ризики
  const flag_uUmodLow   = uUmod_mgL != null && uUmod_mgL < FLAGS.uUmodLow_mgL;
  const flag_FeUmodLow  = FeUmod_pct != null && FeUmod_pct < FLAGS.FeUmodLow_pct;
  const flag_UAlbHi     = uAlb_over_uUmod != null && uAlb_over_uUmod > FLAGS.uAlb_uUmodHigh;

  const totalFlags = (flag_uUmodLow ? 1 : 0) + (flag_FeUmodLow ? 1 : 0) + (flag_UAlbHi ? 1 : 0);

  // зведена інтерпретація
  const summaryTone = totalFlags === 0
    ? (filled > 0 ? 'ok' : 'muted')
    : (totalFlags === 1 ? 'warn' : 'bad');

  const toneClasses: Record<'ok'|'warn'|'bad'|'muted', string> = {
    ok:    'bg-emerald-50 text-emerald-800 ring-emerald-200',
    warn:  'bg-amber-50 text-amber-800 ring-amber-200',
    bad:   'bg-rose-50 text-rose-800 ring-rose-200',
    muted: 'bg-slate-50 text-slate-600 ring-slate-200',
  };

  const summaryLabel = useMemo(() => {
    if (filled === 0) return 'Заповніть ключові показники (s/u Umod, s/u Crea).';
    if (totalFlags === 0) return 'Ознак порушення уромодулінового профілю не виявлено.';
    if (totalFlags === 1) return 'Можливі ранні відхилення уромодулінового профілю.';
    return 'Профіль свідчить про відхилення; розгляньте додаткову оцінку тубулярної функції.';
  }, [filled, totalFlags]);

  // автоскрол до результату
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (filled > 0 && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrolledOnce.current = true;
    }
  }, [filled]);

  // копіювати підсумок
  const onCopy = () => {
    const lines = [
      'Уромодуліновий профіль:',
      `sUmod (${sUmodU}) = ${sUmodStr || '—'}`,
      `uUmod (${uUmodU}) = ${uUmodStr || '—'}`,
      `sCrea (${sCreaU}) = ${sCreaStr || '—'}`,
      `uCrea (${uCreaU}) = ${uCreaStr || '—'}`,
      `eGFR (мл/хв/1.73м²) = ${egfrStr || '—'}`,
      uAlbStr ? `uAlb (${uAlbU}) = ${uAlbStr}` : undefined,
      '',
      `sUmod/sCrea = ${toStr(ratio_sUmod_sCrea)}`,
      `uUmod/uCrea = ${toStr(ratio_uUmod_uCrea)}`,
      `FeUmod (%) = ${toStr(FeUmod_pct)}`,
      `FsUmod (%) = ${toStr(FsUmod_pct)}`,
      `uAlb/uUmod = ${toStr(uAlb_over_uUmod)}`,
      '',
      `Інтерпретація: ${summaryLabel}`,
    ].filter(Boolean).join('\n');

    try {
      navigator.clipboard.writeText(lines);
      alert('Результати скопійовано в буфер обміну.');
    } catch {
      alert(lines);
    }
  };

  const onReset = () => {
    setSUmodStr(''); setUUmodStr('');
    setSCreaStr(''); setUCreaStr('');
    setEgfrStr('');  setUAlbStr('');
    scrolledOnce.current = false;
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:py-10">
        {/* Хедер */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Уромодуліновий профіль
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Введіть <b>sUmod</b> (сироватка), <b>uUmod</b> (сеча), <b>sCrea</b>, <b>uCrea</b>
              та, бажано, <b>eGFR</b>. Підтримуються десяткові «,» та «.». Формули: <i>FeUmod</i>, <i>FsUmod</i>, <i>uAlb/uUmod</i>, <i>sUmod/sCrea</i>.
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
        <div ref={resRef} className={`mb-6 rounded-2xl border ring-1 p-4 ${toneClasses[summaryTone]}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/60 p-2 text-inherit ring-1 ring-black/5">
              <Info />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase">Зведена інтерпретація</div>
              <div className="mt-1 text-base">{summaryLabel}</div>
              <div className="mt-1 text-sm opacity-80">
                Прапорців: {totalFlags} (uUmod&lt;{FLAGS.uUmodLow_mgL} мг/л; FeUmod&lt;{FLAGS.FeUmodLow_pct}%; uAlb/uUmod&gt;{FLAGS.uAlb_uUmodHigh})
              </div>
            </div>
          </div>
        </div>

        {/* Прогрес */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>Заповнено: {filled} / 6</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-600 transition-[width]" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Форма */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* sUmod */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                sUmod <span className="text-xs text-gray-500">({sUmodU})</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={sUmodStr}
                  onChange={(e) => setSUmodStr(sanitizeDecimal(e.target.value))}
                  placeholder={sUmodU === 'ng/mL' ? 'напр., 120' : 'напр., 0,12'}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
                <select
                  value={sUmodU}
                  onChange={(e) => setSUmodU(e.target.value as SUmodU)}
                  className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm"
                >
                  <option>ng/mL</option>
                  <option>mg/L</option>
                </select>
              </div>
            </div>

            {/* uUmod */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                uUmod <span className="text-xs text-gray-500">({uUmodU})</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={uUmodStr}
                  onChange={(e) => setUUmodStr(sanitizeDecimal(e.target.value))}
                  placeholder={uUmodU === 'mg/L' ? 'напр., 25' : 'напр., 25000'}
                  inputMode="decimal"
                  className={`w-full rounded-xl border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    uUmod_mgL != null && uUmod_mgL < FLAGS.uUmodLow_mgL ? 'border-amber-300' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                <select
                  value={uUmodU}
                  onChange={(e) => setUUmodU(e.target.value as UUmodU)}
                  className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm"
                >
                  <option>mg/L</option>
                  <option>ng/mL</option>
                </select>
              </div>
              {uUmod_mgL != null && (
                <div className="mt-1 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ring-1 ${uUmod_mgL < FLAGS.uUmodLow_mgL ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'}`}>
                    {uUmod_mgL < FLAGS.uUmodLow_mgL ? `uUmod низький (<${FLAGS.uUmodLow_mgL} мг/л)` : 'uUmod у межах заданого порогу'}
                  </span>
                </div>
              )}
            </div>

            {/* sCrea */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                sCrea <span className="text-xs text-gray-500">({sCreaU})</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={sCreaStr}
                  onChange={(e) => setSCreaStr(sanitizeDecimal(e.target.value))}
                  placeholder={sCreaU === 'µmol/L' ? 'напр., 90' : 'напр., 1,0'}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
                <select
                  value={sCreaU}
                  onChange={(e) => setSCreaU(e.target.value as SCreaU)}
                  className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm"
                >
                  <option>µmol/L</option>
                  <option>mg/dL</option>
                </select>
              </div>
            </div>

            {/* uCrea */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                uCrea <span className="text-xs text-gray-500">({uCreaU})</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={uCreaStr}
                  onChange={(e) => setUCreaStr(sanitizeDecimal(e.target.value))}
                  placeholder={uCreaU === 'mmol/L' ? 'напр., 10' : 'напр., 120'}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                />
                <select
                  value={uCreaU}
                  onChange={(e) => setUCreaU(e.target.value as UCreaU)}
                  className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm"
                >
                  <option>mmol/L</option>
                  <option>mg/dL</option>
                </select>
              </div>
            </div>

            {/* eGFR */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                eGFR <span className="text-xs text-gray-500">(мл/хв/1.73 м²)</span>
              </label>
              <input
                value={egfrStr}
                onChange={(e) => setEgfrStr(sanitizeDecimal(e.target.value))}
                placeholder="напр., 75"
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
              <div className="mt-1 text-xs text-gray-500">Якщо не вказати eGFR, у формулі FeUmod поділ на eGFR не застосовується.</div>
            </div>

            {/* uAlb (необов’язково, для uAlb/uUmod) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                uAlb <span className="text-xs text-gray-500">({uAlbU})</span>
              </label>
              <input
                value={uAlbStr}
                onChange={(e) => setUAlbStr(sanitizeDecimal(e.target.value))}
                placeholder="напр., 30"
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Результати */}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">sUmod/sCrea</div>
              <div className="text-lg font-semibold">{toStr(ratio_sUmod_sCrea, 3)}</div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">uUmod/uCrea</div>
              <div className="text-lg font-semibold">{toStr(ratio_uUmod_uCrea, 3)}</div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">FeUmod (%)</div>
              <div className="text-lg font-semibold">{toStr(FeUmod_pct, 2)}</div>
              {FeUmod_pct != null && (
                <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${FeUmod_pct < FLAGS.FeUmodLow_pct ? 'bg-rose-50 text-rose-800 ring-rose-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'}`}>
                  {FeUmod_pct < FLAGS.FeUmodLow_pct ? `Низький (<${FLAGS.FeUmodLow_pct}%)` : 'В межах порогу'}
                </div>
              )}
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">FsUmod (%)</div>
              <div className="text-lg font-semibold">{toStr(FsUmod_pct, 2)}</div>
            </div>

            <div className="rounded-xl border p-3 md:col-span-2">
              <div className="text-sm text-gray-500">uAlb/uUmod</div>
              <div className="text-lg font-semibold">{toStr(uAlb_over_uUmod, 2)}</div>
              {uAlb_over_uUmod != null && (
                <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${uAlb_over_uUmod > FLAGS.uAlb_uUmodHigh ? 'bg-rose-50 text-rose-800 ring-rose-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'}`}>
                  {uAlb_over_uUmod > FLAGS.uAlb_uUmodHigh ? `Підвищене (> ${FLAGS.uAlb_uUmodHigh})` : 'В межах порогу'}
                </div>
              )}
            </div>
          </div>

          {/* Дії */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Копіювати результат
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Очистити
            </button>
          </div>
        </div>

        {/* Примітки й атрибуція */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
            <span className="font-semibold">Важливо.</span> Значення залежать від одиниць введення.
            Для інтерпретації використано пороги-покажчики: uUmod&nbsp;
            <span className="font-semibold">&lt; {FLAGS.uUmodLow_mgL} мг/л</span>, FeUmod&nbsp;
            <span className="font-semibold">&lt; {FLAGS.FeUmodLow_pct}%</span>, uAlb/uUmod&nbsp;
            <span className="font-semibold">&gt; {FLAGS.uAlb_uUmodHigh}</span>.
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
            Результат є довідковим і не замінює консультацію лікаря. Порогові значення можуть
            відрізнятись між лабораторіями/методиками; за потреби відкоригуйте їх у коді.
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
            <span className="font-semibold">Примітка.</span> Калькулятор уромодулінового профілю
            розроблено на кафедрі нефрології та нирковозамісної терапії НУОЗ України імені П. Л. Шупика.
          </div>
        </div>

        <div className="mt-8">
          <Link href="/biomarkers" className="text-gray-600 hover:text-blue-700">
            ← Назад до біомаркерів
          </Link>
        </div>
      </div>
    </div>
  );
}
