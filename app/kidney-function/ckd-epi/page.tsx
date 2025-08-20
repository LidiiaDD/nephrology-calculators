'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Sex = 'Чоловіча' | 'Жіноча';
type Unit = 'мкмоль/л' | 'мг/дл';
type Formula = 'CKD-EPI 2021' | 'CKD-EPI 2009' | 'CKD-EPI 2012 (цистатин С)';

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

// ---- формули ----
function egfrCkdEpi2009(scrMgDl: number, age: number, sex: Sex) {
  const k = sex === 'Жіноча' ? 0.7 : 0.9;
  const a = sex === 'Жіноча' ? -0.329 : -0.411;
  const min = Math.min(scrMgDl / k, 1);
  const max = Math.max(scrMgDl / k, 1);
  const sexFactor = sex === 'Жіноча' ? 1.018 : 1;
  return 141 * Math.pow(min, a) * Math.pow(max, -1.209) * Math.pow(0.993, age) * sexFactor;
}
function egfrCkdEpi2021(scrMgDl: number, age: number, sex: Sex) {
  const k = sex === 'Жіноча' ? 0.7 : 0.9;
  const a = sex === 'Жіноча' ? -0.241 : -0.302;
  const min = Math.min(scrMgDl / k, 1);
  const max = Math.max(scrMgDl / k, 1);
  const sexFactor = sex === 'Жіноча' ? 1.012 : 1;
  return 142 * Math.pow(min, a) * Math.pow(max, -1.200) * Math.pow(0.9938, age) * sexFactor;
}
function egfrCkdEpi2012Cys(scys: number, age: number, sex: Sex) {
  const min = Math.min(scys / 0.8, 1);
  const max = Math.max(scys / 0.8, 1);
  const sexFactor = sex === 'Жіноча' ? 0.932 : 1;
  return 133 * Math.pow(min, -0.499) * Math.pow(max, -1.328) * Math.pow(0.996, age) * sexFactor;
}
function stageByEgfr(gfr: number) {
  if (!Number.isFinite(gfr)) return '';
  if (gfr >= 90) return 'G1 (≥90) — норма/висока';
  if (gfr >= 60) return 'G2 (60–89) — злегка знижена';
  if (gfr >= 45) return 'G3a (45–59) — помірно знижена';
  if (gfr >= 30) return 'G3b (30–44) — помірно тяжка';
  if (gfr >= 15) return 'G4 (15–29) — тяжка';
  return 'G5 (<15) — ниркова недостатність';
}
function chipColors(stage: string) {
  if (stage.startsWith('G1')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (stage.startsWith('G2')) return 'bg-lime-100 text-lime-800 border-lime-200';
  if (stage.startsWith('G3a')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (stage.startsWith('G3b')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (stage.startsWith('G4')) return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export default function CKDEpiPage() {
  const [formula, setFormula] = useState<Formula>('CKD-EPI 2021');
  const [sex, setSex] = useState<Sex>('Жіноча');
  const [unit, setUnit] = useState<Unit>('мкмоль/л');

  const [ageStr, setAgeStr] = useState<string>('');
  const [scrStr, setScrStr] = useState<string>(''); // креатинін
  const [cysStr, setCysStr] = useState<string>(''); // цистатин С

  const ageNum = useMemo(() => (ageStr ? parseInt(ageStr, 10) : NaN), [ageStr]);
  const scrNum = useMemo(() => toNumberOrNaN(scrStr), [scrStr]);
  const cysNum = useMemo(() => toNumberOrNaN(cysStr), [cysStr]);
  const usingCys = formula === 'CKD-EPI 2012 (цистатин С)';

  const canCalc =
    Number.isFinite(ageNum) &&
    ageNum > 0 &&
    (usingCys ? Number.isFinite(cysNum) && cysNum > 0 : Number.isFinite(scrNum) && scrNum > 0);

  // ---- результат у стані, без alert
  const [result, setResult] = useState<{ gfr: number; stage: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // якщо редагують вхідні дані — сховати старий результат
    setResult(null);
  }, [ageStr, scrStr, cysStr, sex, unit, formula]);

  const handleCalc = () => {
    if (!canCalc) return;
    let gfr = NaN;
    if (usingCys) {
      gfr = egfrCkdEpi2012Cys(cysNum, ageNum, sex);
    } else {
      const scrMgDl = unit === 'мкмоль/л' ? scrNum / 88.4 : scrNum;
      gfr = formula === 'CKD-EPI 2009'
        ? egfrCkdEpi2009(scrMgDl, ageNum, sex)
        : egfrCkdEpi2021(scrMgDl, ageNum, sex);
    }
    const rounded = Math.round(gfr);
    setResult({ gfr: rounded, stage: stageByEgfr(rounded) });
  };

  const copy = async () => {
    if (!result) return;
    const text = `eGFR: ${result.gfr} мл/хв/1.73м² — ${result.stage}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-center text-4xl font-bold tracking-tight mb-8">
          Калькулятор CKD-EPI
        </h1>

        <div className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block font-semibold mb-2">Виберіть формулу:</label>
              <select
                value={formula}
                onChange={(e) => setFormula(e.target.value as Formula)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>CKD-EPI 2021</option>
                <option>CKD-EPI 2009</option>
                <option>CKD-EPI 2012 (цистатин С)</option>
              </select>
            </div>

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
                placeholder="Напр., 55"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!usingCys ? (
              <div>
                <label className="block font-semibold mb-2">Креатинін:</label>
                <div className="flex gap-2">
                  <input
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="Напр., 88 або 1,0"
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
                  Десятковий роздільник — «,» або «.» дозволено. Поле може бути порожнім.
                </p>
              </div>
            ) : (
              <div>
                <label className="block font-semibold mb-2">Цистатин C (мг/л):</label>
                <input
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  placeholder="Напр., 1,2"
                  value={cysStr}
                  onChange={(e) => setCysStr(sanitizeDecimalInput(e.target.value))}
                  onBlur={() => setCysStr((v) => normalizeOnBlur(v))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleCalc}
                disabled={!canCalc}
                className={`w-full rounded-xl px-4 py-3 text-white font-semibold shadow-lg transition
                  ${canCalc ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}
                `}
              >
                Розрахувати
              </button>
              {!canCalc && (
                <p className="text-xs text-slate-500 mt-2">
                  Введіть вік і {usingCys ? 'цистатин С' : 'креатинін'}.
                </p>
              )}
            </div>

            {/* Результат без alert */}
            {result && (
              <div className="mt-2 rounded-xl border p-4 shadow-sm bg-white/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold">
                      eGFR: {result.gfr} <span className="text-slate-500">мл/хв/1.73м²</span>
                    </div>
                    <div
                      className={
                        'inline-block mt-2 rounded-full border px-3 py-1 text-sm font-semibold ' +
                        chipColors(result.stage)
                      }
                    >
                      {result.stage}
                    </div>
                  </div>
                  <button
                    onClick={copy}
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    {copied ? 'Скопійовано ✓' : 'Копіювати'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Результат довідковий і не замінює консультацію лікаря.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
