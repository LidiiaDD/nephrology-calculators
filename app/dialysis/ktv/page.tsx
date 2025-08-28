'use client';

import { useEffect, useMemo, useState } from 'react';

type Sex = 'female' | 'male';
type VMethod = 'manual' | 'weight' | 'watson';

function parseNum(s: string): number | null {
  if (!s) return null;
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}
const fmt = (n: number, dp = 2) => n.toLocaleString('uk-UA', { maximumFractionDigits: dp, minimumFractionDigits: dp });

export default function KtVPage() {
  // уникаємо hydration-mismatch — малюємо після монтування
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Базові вхідні поля (рядкові, на старті порожні)
  const [preStr, setPreStr]   = useState('');  // ммоль/л
  const [postStr, setPostStr] = useState('');  // ммоль/л
  const [tStr, setTStr]       = useState('');  // год
  const [ufStr, setUfStr]     = useState('');  // л

  // Метод визначення V
  const [vMethod, setVMethod] = useState<VMethod>('manual');

  // V вручну (л)
  const [vStr, setVStr] = useState('');

  // Оцінка за масою (кг) — потребує статі
  const [sex, setSex] = useState<Sex>('female');
  const [weightStr, setWeightStr] = useState('');

  // Watson: стать + вік + зріст + маса
  const [ageStr, setAgeStr]       = useState('');
  const [heightStr, setHeightStr] = useState(''); // см

  // Числові значення
  const pre = useMemo(() => parseNum(preStr), [preStr]);
  const post = useMemo(() => parseNum(postStr), [postStr]);
  const t = useMemo(() => parseNum(tStr), [tStr]);       // год
  const uf = useMemo(() => parseNum(ufStr), [ufStr]);    // л
  const vManual = useMemo(() => parseNum(vStr), [vStr]); // л

  const weight = useMemo(() => parseNum(weightStr), [weightStr]); // кг
  const age    = useMemo(() => parseNum(ageStr), [ageStr]);       // роки
  const height = useMemo(() => parseNum(heightStr), [heightStr]); // см

  // Обчислення V (л)
  const V = useMemo(() => {
    if (vMethod === 'manual') {
      return (vManual && vManual > 0) ? vManual : null;
    }
    if (vMethod === 'weight') {
      if (!weight || weight <= 0) return null;
      // дуже швидка оцінка: TBW ≈ 0.49*female, 0.58*male (в літрах)
      const k = sex === 'male' ? 0.58 : 0.49;
      return weight * k;
    }
    // Watson (літри)
    if (vMethod === 'watson') {
      if (!weight || !height || weight <= 0 || height <= 0) return null;
      if (sex === 'male') {
        // Male: V = 2.447 - 0.09516*age + 0.1074*height + 0.3362*weight
        const a = age ?? 0;
        return 2.447 - 0.09516 * a + 0.1074 * height + 0.3362 * weight;
      } else {
        // Female: V = -2.097 + 0.1069*height + 0.2466*weight
        return -2.097 + 0.1069 * height + 0.2466 * weight;
      }
    }
    return null;
  }, [vMethod, vManual, weight, height, age, sex]);

  // Основні показники
  const calc = useMemo(() => {
    let R: number | null = null;
    let urr: number | null = null;
    let ktvNoUF: number | null = null;
    let ktvUF: number | null = null;

    if (pre !== null && post !== null && pre > 0 && post >= 0 && post <= pre) {
      R = post / pre;
      urr = (1 - R) * 100;

      if (t !== null) {
        const expr = R - 0.008 * t; // t у годинах
        if (expr > 0) {
          ktvNoUF = -Math.log(expr);
          if (uf !== null && V !== null && V > 0) {
            // Daugirdas II: + (4 - 3.5*R) * (UF/V)
            ktvUF = ktvNoUF + (4 - 3.5 * R) * (uf / V);
          } else {
            ktvUF = ktvNoUF;
          }
        }
      }
    }
    return { R, urr, ktvNoUF, ktvUF };
  }, [pre, post, t, uf, V]);

  if (!mounted) return null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold mb-6">K<span className="lowercase">t</span>/V (гемодіаліз)</h1>

      {/* Вхідні дані */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Вхідні дані</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span>Сечовина до діалізу (ммоль/л)</span>
            <input
              inputMode="decimal"
              value={preStr}
              onChange={e => setPreStr(e.target.value)}
              placeholder="наприклад, 18.5"
              className="rounded border px-3 py-2"
            />
            <small className="text-gray-500">Десятковий роздільник «,» або «.»</small>
          </label>

          <label className="flex flex-col gap-1">
            <span>Сечовина після діалізу (ммоль/л)</span>
            <input
              inputMode="decimal"
              value={postStr}
              onChange={e => setPostStr(e.target.value)}
              placeholder="наприклад, 6.2"
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Тривалість сеансу (год)</span>
            <input
              inputMode="decimal"
              value={tStr}
              onChange={e => setTStr(e.target.value)}
              placeholder="наприклад, 4"
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Ультрафільтрація, UF (л)</span>
            <input
              inputMode="decimal"
              value={ufStr}
              onChange={e => setUfStr(e.target.value)}
              placeholder="наприклад, 2.0"
              className="rounded border px-3 py-2"
            />
            <small className="text-gray-500">Для врахування члена UF/V потрібно мати V (літри) нижче.</small>
          </label>
        </div>
      </section>

      {/* Об'єм розподілу V */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">V — об’єм розподілу сечовини</h2>

        <div className="mb-3 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="vmethod" checked={vMethod==='manual'} onChange={() => setVMethod('manual')} />
            <span>Ввести вручну</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="vmethod" checked={vMethod==='weight'} onChange={() => setVMethod('weight')} />
            <span>Оцінити за масою</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="vmethod" checked={vMethod==='watson'} onChange={() => setVMethod('watson')} />
            <span>Watson (стать+вік+зріст+маса)</span>
          </label>
        </div>

        {/* MANUAL */}
        <div className={vMethod==='manual' ? 'grid gap-4 md:grid-cols-2' : 'hidden'}>
          <label className="flex flex-col gap-1">
            <span>V (літри)</span>
            <input
              inputMode="decimal"
              value={vStr}
              onChange={e => setVStr(e.target.value)}
              placeholder="наприклад, 32"
              className="rounded border px-3 py-2"
            />
          </label>
        </div>

        {/* WEIGHT */}
        <div className={vMethod==='weight' ? 'grid gap-4 md:grid-cols-3' : 'hidden'}>
          <label className="flex items-center gap-2">
            <span className="min-w-24">Стать</span>
            <select className="rounded border px-3 py-2" value={sex} onChange={e => setSex(e.target.value as Sex)}>
              <option value="female">Жінка</option>
              <option value="male">Чоловік</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span>Маса тіла (кг)</span>
            <input
              inputMode="decimal"
              value={weightStr}
              onChange={e => setWeightStr(e.target.value)}
              placeholder="наприклад, 70"
              className="rounded border px-3 py-2"
            />
            <small className="text-gray-500">
              Оцінка TBW: {sex==='male' ? '0.58' : '0.49'} × маса (кг), в літрах.
              {weight && <> Приблизно V ≈ <b>{fmt((sex==='male'?0.58:0.49)*weight, 1)}</b> л.</>}
            </small>
          </label>
        </div>

        {/* WATSON */}
        <div className={vMethod==='watson' ? 'grid gap-4 md:grid-cols-4' : 'hidden'}>
          <label className="flex items-center gap-2">
            <span className="min-w-24">Стать</span>
            <select className="rounded border px-3 py-2" value={sex} onChange={e => setSex(e.target.value as Sex)}>
              <option value="female">Жінка</option>
              <option value="male">Чоловік</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span>Вік (роки)</span>
            <input
              inputMode="numeric"
              value={ageStr}
              onChange={e => setAgeStr(e.target.value)}
              placeholder="наприклад, 60"
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Зріст (см)</span>
            <input
              inputMode="numeric"
              value={heightStr}
              onChange={e => setHeightStr(e.target.value)}
              placeholder="наприклад, 170"
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Маса (кг)</span>
            <input
              inputMode="decimal"
              value={weightStr}
              onChange={e => setWeightStr(e.target.value)}
              placeholder="наприклад, 70"
              className="rounded border px-3 py-2"
            />
          </label>

          <div className="md:col-span-4 text-sm text-gray-600">
            {V !== null && Number.isFinite(V) ? <>Орієнтовний V (Watson): <b>{fmt(V,1)} л</b>.</> : 'Введіть зріст і масу; вік опційний (впливає у чоловіків).'}
          </div>
        </div>
      </section>

      {/* Результат */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">URR</div>
          <div className="text-4xl font-bold">
            {calc.urr === null ? '—' : `${Math.round(calc.urr)}%`}
          </div>
        </div>

        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Kt/V (Daugirdas II, без UF/V)</div>
          <div className="text-4xl font-bold">
            {calc.ktvNoUF === null ? '—' : fmt(calc.ktvNoUF, 2)}
          </div>
        </div>

        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Kt/V (з урахуванням UF/V)</div>
          <div className="text-4xl font-bold">
            {calc.ktvUF === null ? '—' : fmt(calc.ktvUF, 2)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Формула: Kt/V = −ln(R − 0.008·t) + (4 − 3.5·R)·(UF/V)
          </div>
        </div>
      </section>

      <p className="mt-6 text-sm text-gray-500">
        Примітка: V — загальна вода організму (TBW). Для приблизної оцінки без зросту/віку обери «за масою».
        Для точнішого розрахунку скористайся Watson (потрібні стать, зріст та маса; вік впливає у чоловіків).
      </p>
    </main>
  );
}
