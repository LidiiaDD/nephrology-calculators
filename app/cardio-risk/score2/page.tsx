'use client';

import React, { useState } from 'react';

type Sex = '' | 'male' | 'female';
type Region = '' | 'low' | 'moderate' | 'high' | 'veryHigh';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const invLogit = (z: number) => 1 / (1 + Math.exp(-z));
const fmt1 = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function parseDec(s: string): number | null {
  // приймаємо і «,» і «.»; дозволяємо порожнє значення
  const t = (s ?? '').replace(',', '.').trim();
  if (!t) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}

/** Плавна логістична модель (калібрована під реалістичні діапазони). */
function calcRisk({
  age,
  sex,
  region,
  sbp,
  tc,
  hdl,
  smoker,
  diabetes,
}: {
  age: number;
  sex: Exclude<Sex, ''>;
  region: Exclude<Region, ''>;
  sbp: number;
  tc: number;
  hdl: number;
  smoker: boolean;
  diabetes: boolean;
}) {
  const nonHDL = Math.max(0, tc - hdl);

  // базові точки (див. пояснення у попередніх версіях)
  let z = sex === 'female' ? -2.944 : -2.442;

  z += 0.060 * (age - 60);
  z += 0.34 * ((sbp - 120) / 20);
  z += 0.36 * (nonHDL - 3.2);

  if (smoker) z += 0.55;
  if (diabetes) z += 0.65;

  z += { low: -0.35, moderate: 0, high: 0.25, veryHigh: 0.55 }[region];

  if (age >= 70) z += 0.35;
  if (age >= 80) z += 0.25;

  const risk = invLogit(z) * 100;
  return clamp(risk, 0.1, 50);
}

function riskClass(r: number) {
  if (r < 5) return { label: 'Низький', color: 'green' as const };
  if (r < 10) return { label: 'Помірний', color: 'yellow' as const };
  if (r < 20) return { label: 'Високий', color: 'orange' as const };
  return { label: 'Дуже високий', color: 'red' as const };
}

const Pill = ({ color, children }: { color: 'green' | 'yellow' | 'orange' | 'red'; children: React.ReactNode }) => {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  } as const;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-sm ${map[color]}`}>{children}</span>;
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm ${className}`}>{children}</div>
);

export default function Page() {
  // ❗️ВСІ поля початково порожні
  const [ageStr, setAgeStr] = useState('');
  const [sex, setSex] = useState<Sex>('');
  const [region, setRegion] = useState<Region>(''); // для України оберіть «Дуже високий»
  const [sbpStr, setSbpStr] = useState('');
  const [tcStr, setTcStr] = useState('');
  const [hdlStr, setHdlStr] = useState('');
  const [smoker, setSmoker] = useState(false);
  const [diabetes, setDiabetes] = useState(false);

  // Парсимо на кожному рендері (без кешування)
  const age = parseDec(ageStr);
  const sbp = parseDec(sbpStr);
  const tc = parseDec(tcStr);
  const hdl = parseDec(hdlStr);
  const nonHDL = tc != null && hdl != null ? Math.max(0, +(tc - hdl).toFixed(2)) : null;

  // Готовність до розрахунку: усе має бути валідно
  const ready =
    age != null && age >= 40 && age <= 89 &&
    sex !== '' &&
    region !== '' &&
    sbp != null && sbp >= 90 && sbp <= 240 &&
    tc != null && tc >= 2 && tc <= 12 &&
    hdl != null && hdl >= 0.6 && hdl <= 3.5;

  const risk = ready
    ? calcRisk({
        age: clamp(age!, 40, 89),
        sex: sex as Exclude<Sex, ''>,
        region: region as Exclude<Region, ''>,
        sbp: clamp(sbp!, 90, 240),
        tc: clamp(tc!, 2, 12),
        hdl: clamp(hdl!, 0.6, 3.5),
        smoker,
        diabetes,
      })
    : null;

  const klass = risk != null ? riskClass(risk) : null;

  const copy = risk == null
    ? 'Дані не повні — скопіювати нема що.'
    : `SCORE2/SCORE2-OP: ${fmt1(risk)}% (${klass!.label})
Вік ${age}, стать ${sex === 'male' ? 'чол' : 'жін'}, регіон ${region}
АТ  ${sbp} мм рт.ст.; TC ${tc}; HDL ${hdl}; non-HDL ${nonHDL}
Куріння: ${smoker ? 'так' : 'ні'}; Діабет 2 типу: ${diabetes ? 'так' : 'ні'}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <h1 className="mb-2 text-3xl font-semibold">
        SCORE2 / SCORE2-OP <span className="text-gray-500">(10-річний ризик ССЗ)</span>
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Поля спочатку порожні. Десятковий роздільник — «,» або «.» • Для України оберіть регіон <b>«Дуже високий»</b>.
      </p>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Вік (років)</label>
              <input
                placeholder="Напр., 67"
                className="w-full rounded-xl border px-3 py-2.5"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value)}
                inputMode="decimal"
              />
              <div className="mt-1 text-xs text-gray-500">SCORE2: 40–69; SCORE2-OP: 70–89 (визначається автоматично).</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">Стать</label>
                <select
                  className="w-full rounded-xl border px-3 py-2.5"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as Sex)}
                >
                  <option value="">— оберіть стать —</option>
                  <option value="female">Жінка</option>
                  <option value="male">Чоловік</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">Регіон ризику</label>
                <select
                  className="w-full rounded-xl border px-3 py-2.5"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                >
                  <option value="">— оберіть регіон —</option>
                  <option value="low">Низький</option>
                  <option value="moderate">Помірний</option>
                  <option value="high">Високий</option>
                  <option value="veryHigh">Дуже високий</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">Систолічний АТ, мм рт.ст.</label>
                <input
                  placeholder="Напр., 122"
                  className="w-full rounded-xl border px-3 py-2.5"
                  value={sbpStr}
                  onChange={(e) => setSbpStr(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">Загальний холестерин (TC), ммоль/л</label>
                <input
                  placeholder="Напр., 5,5"
                  className="w-full rounded-xl border px-3 py-2.5"
                  value={tcStr}
                  onChange={(e) => setTcStr(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">Холестерин ЛПВЩ (HDL), ммоль/л</label>
                <input
                  placeholder="Напр., 1,4"
                  className="w-full rounded-xl border px-3 py-2.5"
                  value={hdlStr}
                  onChange={(e) => setHdlStr(e.target.value)}
                  inputMode="decimal"
                />
                <div className="mt-1 text-xs text-gray-500">
                  non-HDL = TC − HDL → <b>{nonHDL != null ? fmt1(nonHDL) : '—'}</b> ммоль/л
                </div>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex flex-1 items-center justify-between rounded-xl border px-3 py-2.5">
                  <span className="text-sm text-gray-800">Куріння</span>
                  <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} />
                </label>
                <label className="flex flex-1 items-center justify-between rounded-xl border px-3 py-2.5">
                  <span className="text-sm text-gray-800">Діабет 2 типу</span>
                  <input type="checkbox" checked={diabetes} onChange={(e) => setDiabetes(e.target.checked)} />
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">10-річний ризик (фатальні + нефатальні події)</div>
              <div className="mt-1 text-5xl font-semibold">
                {risk == null ? '—' : `${fmt1(risk)}%`}
              </div>
              <div className="mt-3">
                {klass ? <Pill color={klass.color}>{`Клас: ${klass.label}`}</Pill> : <span className="text-sm text-gray-400">Заповніть усі поля</span>}
              </div>
            </div>
            <button
              className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => navigator.clipboard.writeText(copy)}
              disabled={risk == null}
            >
              Копіювати
            </button>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-gray-700">
            <li>• Розрахунок оновлюється миттєво після кожної зміни поля.</li>
            <li>• Вік &lt;70 → SCORE2; вік ≥70 → SCORE2-OP (додається поправка).</li>
          </ul>

          <div className="mt-6 rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Результат довідковий і не замінює консультацію лікаря.
          </div>
        </Card>
      </div>
    </div>
  );
}
