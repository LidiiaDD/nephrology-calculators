'use client';

import { useMemo, useState } from 'react';

type Sex = 'female' | 'male';
type Unit = 'umol' | 'mgdl';

function parseLocaleNumber(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toMgPerDl(value: number, unit: Unit): number {
  // 1 мг/дл = 88.4 мкмоль/л
  return unit === 'mgdl' ? value : value / 88.4;
}

export default function MdrdPage() {
  // порожні поля на старті — щоб не було гідраційних розбіжностей
  const [sex, setSex] = useState<Sex>('female');
  const [ageStr, setAgeStr] = useState('');
  const [scrStr, setScrStr] = useState('');
  const [unit, setUnit] = useState<Unit>('umol');
  const [useIdms, setUseIdms] = useState(true);        // 175 за замовчуванням
  const [useRaceFactor, setUseRaceFactor] = useState(false); // 1.212 вимкнений

  const result = useMemo(() => {
    const age = parseLocaleNumber(ageStr);
    const scrInp = parseLocaleNumber(scrStr);
    if (age === null || age <= 0 || scrInp === null || scrInp <= 0) return null;

    const scrMgDl = toMgPerDl(scrInp, unit);
    const k = useIdms ? 175 : 186; // MDRD (IDMS) vs оригінал
    const sexFactor = sex === 'female' ? 0.742 : 1;
    const raceFactor = useRaceFactor ? 1.212 : 1;

    // MDRD 4-variable
    const egfr =
      k * Math.pow(scrMgDl, -1.154) * Math.pow(age, -0.203) * sexFactor * raceFactor;

    return Math.max(0, egfr);
  }, [ageStr, scrStr, unit, sex, useIdms, useRaceFactor]);

  const egfrText = result == null ? '—' : `${result.toFixed(0)} мл/хв/1.73м²`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">eGFR — MDRD (4-параметрова)</h1>

      <div className="grid gap-4">
        {/* Стать */}
        <label className="block">
          <div className="mb-1 font-medium">Стать</div>
          <select
            value={sex}
            onChange={e => setSex(e.target.value as Sex)}
            className="w-full rounded border p-2"
          >
            <option value="female">Жіноча</option>
            <option value="male">Чоловіча</option>
          </select>
        </label>

        {/* Вік */}
        <label className="block">
          <div className="mb-1 font-medium">Вік (років) <span className="text-red-600">обов’язково</span></div>
          <input
            inputMode="numeric"
            value={ageStr}
            onChange={e => setAgeStr(e.target.value)}
            placeholder="напр., 66"
            className="w-full rounded border p-2"
          />
        </label>

        {/* Креатинін + одиниці */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,180px] gap-3">
          <label className="block">
            <div className="mb-1 font-medium">Креатинін</div>
            <input
              inputMode="decimal"
              value={scrStr}
              onChange={e => setScrStr(e.target.value)}
              placeholder="напр., 89 або 0,9"
              className="w-full rounded border p-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Десятковий роздільник «,» або «.»
            </div>
          </label>

          <label className="block">
            <div className="mb-1 font-medium">Одиниці</div>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as Unit)}
              className="w-full rounded border p-2"
            >
              <option value="umol">мкмоль/л</option>
              <option value="mgdl">мг/дл</option>
            </select>
          </label>
        </div>

        {/* Перемикачі: IDMS та race-фактор */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 rounded border p-3">
            <input
              type="checkbox"
              checked={useIdms}
              onChange={e => setUseIdms(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium">IDMS-калібрування (коеф. 175)</div>
              <div className="text-xs text-gray-600">
                Більшість сучасних лабораторій — так. Якщо ні, використовується 186.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded border p-3">
            <input
              type="checkbox"
              checked={useRaceFactor}
              onChange={e => setUseRaceFactor(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Race-множник 1.212 (істор.)</div>
              <div className="text-xs text-gray-600">
                **Не рекомендовано** у сучасній практиці (див. CKD-EPI-2021 без race). Вимкнено за замовчуванням.
              </div>
            </div>
          </label>
        </div>

        {/* Результат */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">Результат eGFR</div>
            <div className="text-3xl font-semibold">{egfrText}</div>
          </div>

          <div className="rounded-lg border p-4 text-sm text-gray-700">
            <div className="font-medium mb-1">Примітки</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>MDRD (4-параметрова), креатинін у мг/дл (вводити можна й у мкмоль/л — конвертуємо).</li>
              <li>Жіноча стать множиться на 0.742.</li>
              <li>Race-фактор 1.212 — історичний; вимкнений.</li>
              <li>Рекомендовано CKD-EPI-2021 (без race) для рутинного звітування.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
