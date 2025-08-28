'use client';

import { useMemo, useState } from 'react';

/** Дозволяємо «, » і «.» як десятковий роздільник, обрізаємо пробіли */
function parseNum(str: string): number {
  const s = str.replace(/\s+/g, '').replace(',', '.');
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function fmt(n: number, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : '';
}
function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

// Конверсія UREA <-> BUN: 1 mmol/L ≈ 2.8 mg/dL (BUN)
const MMOL_TO_MGDL = 2.8;
const mgdlToMmol = (x: number) => x / MMOL_TO_MGDL;
const mmolToMgdl = (x: number) => x * MMOL_TO_MGDL;

type UreaUnit = 'mmol' | 'mgdl';

export default function UrrPage() {
  // Керовані інпути (порожні на старті)
  const [preStr, setPreStr]   = useState('');
  const [postStr, setPostStr] = useState('');

  // Опційно для оцінки spKt/V (Daugirdas II)
  const [tStr, setTStr]   = useState(''); // год
  const [ufStr, setUfStr] = useState(''); // л
  const [wStr, setWStr]   = useState(''); // кг

  // Одиниці виміру сечовини з автоконвертацією
  const [unit, setUnit] = useState<UreaUnit>('mmol');

  const switchUnit = (next: UreaUnit) => {
    if (next === unit) return;
    // конвертуємо видимі значення
    const pre  = parseNum(preStr);
    const post = parseNum(postStr);

    let preOut = preStr, postOut = postStr;

    if (Number.isFinite(pre)) {
      preOut = next === 'mgdl' ? fmt(mmolToMgdl(pre), 1) : fmt(mgdlToMmol(pre), 1);
    }
    if (Number.isFinite(post)) {
      postOut = next === 'mgdl' ? fmt(mmolToMgdl(post), 1) : fmt(mgdlToMmol(post), 1);
    }

    setUnit(next);
    setPreStr(preOut);
    setPostStr(postOut);
  };

  const calc = useMemo(() => {
    // читаємо pre/post відповідно до вибраної одиниці → переводимо у mmol/L для розрахунків
    let preVal  = parseNum(preStr);
    let postVal = parseNum(postStr);
    if (Number.isFinite(preVal) && unit === 'mgdl')  preVal  = mgdlToMmol(preVal);
    if (Number.isFinite(postVal) && unit === 'mgdl') postVal = mgdlToMmol(postVal);

    let err = '';
    if (preStr && !Number.isFinite(parseNum(preStr)))  err = 'Невірне значення «Сечовина до діалізу».';
    if (!err && postStr && !Number.isFinite(parseNum(postStr))) err = 'Невірне значення «Сечовина після діалізу».';
    if (!err && Number.isFinite(preVal) && Number.isFinite(postVal)) {
      if (preVal <= 0) err = '«До діалізу» має бути > 0.';
      else if (postVal > preVal) err = '«Після діалізу» не може бути більше, ніж «до».';
    }

    const ok = !err && Number.isFinite(preVal) && Number.isFinite(postVal) && preVal > 0 && postVal <= preVal;

    const R   = ok ? (postVal / preVal) : NaN;
    const URR = ok ? (1 - R) * 100 : NaN;

    // тон бейджа URR + колір прогресбару
    let urrTone = 'text-gray-500 bg-gray-50 border-gray-200';
    let urrBar = 'bg-gray-300';
    if (Number.isFinite(URR)) {
      if (URR >= 65) { urrTone = 'text-emerald-700 bg-emerald-50 border-emerald-200'; urrBar = 'bg-emerald-500'; }
      else if (URR >= 50) { urrTone = 'text-amber-700 bg-amber-50 border-amber-200'; urrBar = 'bg-amber-500'; }
      else { urrTone = 'text-rose-700 bg-rose-50 border-rose-200'; urrBar = 'bg-rose-500'; }
    }

    // spKt/V Daugirdas II
    const t  = parseNum(tStr);
    const uf = parseNum(ufStr);
    const w  = parseNum(wStr);
    const canKtV = ok && Number.isFinite(t) && t > 0 && Number.isFinite(uf) && uf >= 0 && Number.isFinite(w) && w > 0;

    let spKtV = NaN;
    let ktvErr = '';
    if (canKtV) {
      const term = R - 0.008 * t;
      if (term <= 0 || !Number.isFinite(term)) {
        ktvErr = 'Комбінація R і t некоректна для логарифма (R − 0.008·t ≤ 0).';
      } else {
        spKtV = -Math.log(term) + (4 - 3.5 * R) * (uf / w);
      }
    }

    // кольори для spKtV індикатора
    let ktvBar = 'bg-gray-300';
    let ktvBadge = 'text-gray-700 bg-gray-50 border-gray-200';
    if (Number.isFinite(spKtV)) {
      if (spKtV >= 1.4) { ktvBar = 'bg-emerald-500'; ktvBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
      else if (spKtV >= 1.2) { ktvBar = 'bg-amber-500'; ktvBadge = 'text-amber-700 bg-amber-50 border-amber-200'; }
      else { ktvBar = 'bg-rose-500'; ktvBadge = 'text-rose-700 bg-rose-50 border-rose-200'; }
    }

    return { err, R, URR, urrTone, urrBar, spKtV, ktvErr, canKtV, ktvBar, ktvBadge };
  }, [preStr, postStr, unit, tStr, ufStr, wStr]);

  const copy = async () => {
    const lines = [
      `URR: ${Number.isFinite(calc.URR) ? calc.URR.toFixed(1) + '%' : '—'}`,
      `R (post/pre): ${Number.isFinite(calc.R) ? calc.R.toFixed(3) : '—'}`,
      `spKt/V (Daugirdas II): ${Number.isFinite(calc.spKtV) ? calc.spKtV.toFixed(2) : '—'}`,
    ].join('\n');
    try { await navigator.clipboard.writeText(lines); } catch {}
  };

  const reset = () => {
    setPreStr(''); setPostStr('');
    setTStr(''); setUfStr(''); setWStr('');
  };

  // Підписи одиниць
  const unitLabel = unit === 'mmol' ? 'ммоль/л' : 'мг/дл (BUN)';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">URR та швидка оцінка Kt/V</h1>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            Скопіювати результат
          </button>
          <button onClick={reset} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            Очистити все
          </button>
        </div>
      </div>

      {/* Перемикач одиниць */}
      <div className="mt-4 inline-flex rounded-lg border overflow-hidden">
        <button
          className={`px-3 py-1 text-sm ${unit === 'mmol' ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'}`}
          onClick={() => switchUnit('mmol')}
          aria-pressed={unit === 'mmol'}
        >
          ммоль/л
        </button>
        <button
          className={`px-3 py-1 text-sm border-l ${unit === 'mgdl' ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'}`}
          onClick={() => switchUnit('mgdl')}
          aria-pressed={unit === 'mgdl'}
        >
          мг/дл (BUN)
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Десятковий роздільник: «,» або «.» (обидва приймаються). Розрахунок виконується в ммоль/л; значення в {unitLabel} конвертуються автоматично.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Ввід URR */}
        <section className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Сечовина до діалізу ({unitLabel})</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              inputMode="decimal"
              placeholder={unit === 'mmol' ? 'напр., 19,6' : 'напр., 55.0'}
              value={preStr}
              onChange={(e) => setPreStr(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Сечовина після діалізу ({unitLabel})</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              inputMode="decimal"
              placeholder={unit === 'mmol' ? 'напр., 6.8' : 'напр., 19.0'}
              value={postStr}
              onChange={(e) => setPostStr(e.target.value)}
            />
          </div>

          {calc.err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {calc.err}
            </div>
          )}

          <div className={`rounded-xl border p-5 ${calc.urrTone}`}>
            <div className="text-gray-500">URR</div>
            <div className="text-5xl font-extrabold">
              {Number.isFinite(calc.URR) ? pct(calc.URR) : '—%'}
            </div>
            <div className="mt-2 text-sm">
              R (post/pre): <b>{Number.isFinite(calc.R) ? calc.R.toFixed(3) : '—'}</b>
            </div>

            {/* Прогрес до цілі URR ≥ 65% */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>0%</span>
                <span>Ціль ≥ 65%</span>
                <span>100%</span>
              </div>
              <div className="relative h-2 w-full rounded bg-gray-200">
                <div
                  className={`absolute left-0 top-0 h-2 rounded ${calc.urrBar}`}
                  style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(calc.URR) ? calc.URR : 0))}%` }}
                />
                {/* маркер 65% */}
                <div className="absolute top-0 h-2 w-0.5 bg-black/30" style={{ left: '65%' }} />
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Типова ціль при 3×/тиждень — <b>URR ≥ 65%</b> у поєднанні зі спостереженням за Kt/V.
            </div>
          </div>
        </section>

        {/* Опціональна оцінка spKt/V */}
        <section className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-3">Швидка оцінка spKt/V (Daugirdas II)</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <div className="mb-1 text-sm">Тривалість (год)</div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  inputMode="decimal"
                  placeholder="напр., 4"
                  value={tStr}
                  onChange={(e) => setTStr(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm">UF, ультрафільтрація (л)</div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  inputMode="decimal"
                  placeholder="напр., 1.5"
                  value={ufStr}
                  onChange={(e) => setUfStr(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm">Маса тіла / постдіалізна вага (кг)</div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  inputMode="decimal"
                  placeholder="напр., 70"
                  value={wStr}
                  onChange={(e) => setWStr(e.target.value)}
                />
              </label>
            </div>

            <div className={`mt-4 rounded-xl border p-4 ${calc.ktvBadge}`}>
              <div className="text-gray-500 mb-1">spKt/V (Daugirdas II)</div>
              <div className="text-4xl font-extrabold">
                {Number.isFinite(calc.spKtV) ? calc.spKtV.toFixed(2) : '—'}
              </div>

              {/* Прогрес до цілі 1.2…1.4 */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0</span>
                  <span>1.2</span>
                  <span>1.4</span>
                  <span>2.0</span>
                </div>
                <div className="relative h-2 w-full rounded bg-gray-200">
                  <div
                    className={`absolute left-0 top-0 h-2 rounded ${calc.ktvBar}`}
                    style={{
                      width: `${
                        Math.max(
                          0,
                          Math.min(100, Number.isFinite(calc.spKtV) ? (calc.spKtV / 2) * 100 : 0)
                        )
                      }%`,
                    }}
                  />
                  {/* маркери 1.2 та 1.4 */}
                  <div className="absolute top-0 h-2 w-0.5 bg-black/30" style={{ left: `${(1.2 / 2) * 100}%` }} />
                  <div className="absolute top-0 h-2 w-0.5 bg-black/30" style={{ left: `${(1.4 / 2) * 100}%` }} />
                </div>
              </div>

              {calc.ktvErr && (
                <div className="mt-2 text-sm text-amber-700">
                  {calc.ktvErr}
                </div>
              )}
              {!calc.canKtV && (
                <div className="mt-2 text-sm text-gray-500">
                  Введи R (через поля вище), а також <b>тривалість, UF і масу</b> для розрахунку.
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Формула: <code>spKt/V = −ln(R − 0.008·t) + (4 − 3.5·R)·(UF/W)</code>, де
                R = post/pre (за сечовиною), t — год, UF — л, W — кг. Порогові значення залежать від протоколів центру.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
