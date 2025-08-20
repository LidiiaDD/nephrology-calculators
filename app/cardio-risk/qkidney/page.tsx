'use client';

import React, { useMemo, useState } from 'react';

/** приймаємо «,» або «.»; порожній — допустимо */
function parseDec(s: string): number | null {
  const t = s.replace(',', '.').trim();
  if (!t) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}
const fmt = (x: number | null, d = 2) => (x == null ? '—' : x.toFixed(d));

type Tone = 'gray' | 'green' | 'amber' | 'red';
type ClassRes = { label: string; tone: Tone };

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const m: Record<Tone, string> = {
    gray: 'bg-gray-100 text-gray-800 ring-gray-200',
    green: 'bg-green-100 text-green-800 ring-green-200',
    amber: 'bg-amber-100 text-amber-800 ring-amber-200',
    red: 'bg-red-100 text-red-800 ring-red-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${m[tone]}`}>
      {children}
    </span>
  );
}

/** Пороги для УРИНАРНИХ концентрацій, нг/мл */
const urine = {
  lfabp: { norm: (x: number) => x < 8, mild: (x: number) => x >= 8 && x < 30, high: (x: number) => x >= 30 },
  ngal:  { norm: (x: number) => x < 150, mild: (x: number) => x >= 150 && x < 300, high: (x: number) => x >= 300 },
  kim1:  { norm: (x: number) => x < 2.0, mild: (x: number) => x >= 2.0 && x < 5.0, high: (x: number) => x >= 5.0 },
} as const;

function classify(x: number | null, th: { norm: (n: number) => boolean; mild: (n: number) => boolean; high: (n: number) => boolean }): ClassRes {
  if (x == null) return { label: 'Нема даних', tone: 'gray' };
  if (th.high(x)) return { label: 'Високе підвищення', tone: 'red' };
  if (th.mild(x)) return { label: 'Помірне підвищення', tone: 'amber' };
  if (th.norm(x)) return { label: 'Норма', tone: 'green' };
  return { label: 'Нема даних', tone: 'gray' };
}

function worstTone(list: ClassRes[]): ClassRes {
  if (list.some((r) => r.tone === 'red')) return { label: 'Високе підвищення', tone: 'red' };
  if (list.some((r) => r.tone === 'amber')) return { label: 'Помірне підвищення', tone: 'amber' };
  if (list.some((r) => r.tone === 'green')) return { label: 'Норма', tone: 'green' };
  return { label: 'Нема даних', tone: 'gray' };
}

export default function Page() {
  // поля спочатку ПУСТІ
  const [lfabpStr, setLfabpStr] = useState('');
  const [ngalStr, setNgalStr] = useState('');
  const [kim1Str, setKim1Str] = useState('');

  const lfabp = useMemo(() => parseDec(lfabpStr), [lfabpStr]);
  const ngal  = useMemo(() => parseDec(ngalStr),  [ngalStr]);
  const kim1  = useMemo(() => parseDec(kim1Str),  [kim1Str]);

  const rLFABP = classify(lfabp, urine.lfabp);
  const rNGAL  = classify(ngal,  urine.ngal);
  const rKIM1  = classify(kim1,  urine.kim1);
  const overall = worstTone([rLFABP, rNGAL, rKIM1]);

  const reset = () => { setLfabpStr(''); setNgalStr(''); setKim1Str(''); };
  const copy  = async () => {
    const text = [
      'Тубулярні маркери (урина, нг/мл):',
      `• L-FABP: ${fmt(lfabp)} — ${rLFABP.label}`,
      `• NGAL:  ${fmt(ngal)} — ${rNGAL.label}`,
      `• KIM-1:  ${fmt(kim1)} — ${rKIM1.label}`,
      `Зведена оцінка: ${overall.label}`,
    ].join('\n');
    try { await navigator.clipboard.writeText(text); alert('Скопійовано.'); } catch { alert('Не вдалося скопіювати'); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Тубулярні маркери (панель)</h1>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-teal-700 ring-1 ring-inset ring-teal-200">
          <b>Матеріал: СЕЧА (urine)</b>
        </span>
        <span className="text-gray-600">Одиниці: нг/мл. Десятковий роздільник — «,» або «.».</span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* введення */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="space-y-5">
            <div>
              <label htmlFor="lfabp" className="block text-sm font-medium text-gray-800">L-FABP, нг/мл</label>
              <input id="lfabp" inputMode="decimal" className="w-full rounded-xl border px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                     value={lfabpStr} onChange={(e) => setLfabpStr(e.target.value)} />
              <p className="mt-1 text-xs text-gray-500">Пороги (урина): &lt;8 — норма; 8–&lt;30 — помірне; ≥30 — високе.</p>
            </div>

            <div>
              <label htmlFor="ngal" className="block text-sm font-medium text-gray-800">NGAL, нг/мл</label>
              <input id="ngal" inputMode="decimal" className="w-full rounded-xl border px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                     value={ngalStr} onChange={(e) => setNgalStr(e.target.value)} />
              <p className="mt-1 text-xs text-gray-500">Пороги (урина): &lt;150 — норма; 150–&lt;300 — підвищення; ≥300 — високе.</p>
            </div>

            <div>
              <label htmlFor="kim1" className="block text-sm font-medium text-gray-800">KIM-1, нг/мл</label>
              <input id="kim1" inputMode="decimal" className="w-full rounded-xl border px-3 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                     value={kim1Str} onChange={(e) => setKim1Str(e.target.value)} />
              <p className="mt-1 text-xs text-gray-500">Пороги (урина): &lt;2,0 — норма; 2,0–&lt;5,0 — підвищення; ≥5,0 — високе.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={reset} className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Скинути</button>
              <button onClick={copy}  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Копіювати</button>
            </div>
          </div>
        </div>

        {/* інтерпретації */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Інтерпретація</h2>

          {[
            { name: 'L-FABP', val: lfabp, res: rLFABP },
            { name: 'NGAL',   val: ngal,  res: rNGAL  },
            { name: 'KIM-1',  val: kim1,  res: rKIM1  },
          ].map((row) => (
            <div key={row.name} className="mb-3 flex items-start justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="text-sm font-medium text-gray-700">{row.name}</div>
                <div className="text-xs text-gray-500">значення: {fmt(row.val)} нг/мл</div>
              </div>
              <Badge tone={row.res.tone}>{row.res.label}</Badge>
            </div>
          ))}

          <div className="mt-4 rounded-xl border bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-800">Зведена оцінка</div>
            <Badge tone={overall.tone}>{overall.label}</Badge>
          </div>

          <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-xs text-gray-600">
            Панель призначена для інтерпретації тубулярних маркерів у сечі (нг/мл).{" "}
            <span className="font-semibold">Для сироватки/плазми застосовуються інші референтні інтервали.</span>
          </div>

          <div className="mt-3 rounded-xl border bg-amber-50 p-4 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
            Результат довідковий і не замінює консультацію лікаря. Порогові значення можуть відрізнятись
            залежно від лабораторії та методики.
          </div>
        </div>
      </div>
    </div>
  );
}
