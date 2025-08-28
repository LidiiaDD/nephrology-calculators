'use client';

import { useEffect, useMemo, useState } from 'react';
import { calcNeph3Raw, calcNeph5Raw, QKidneyArgs, Sex } from './qkidneyWasm';
import EngineBadge from './EngineBadge';

// утиліта: приймаємо і кому, і крапку; повертаємо undefined, якщо порожньо/некоректно
function parseNum(v: string): number | undefined {
  if (!v?.trim()) return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

const ETHNICITIES = [
  { label: 'Біла / не вказано', value: 1 },
  { label: 'Африканська', value: 2 },
  { label: 'Інша азійська', value: 3 },
  { label: 'Пакистанська', value: 4 },
  { label: 'Бангладешська', value: 5 },
  { label: 'Індійська', value: 6 },
  { label: 'Китайська', value: 7 },
  { label: 'Інша етнічність', value: 8 },
  { label: 'Карибська', value: 9 },
];

const SMOKING = [
  { label: 'Не палю', value: 0 },
  { label: '1–9 / день', value: 1 },
  { label: '10–19 / день', value: 2 },
  { label: '20+ / день', value: 3 },
  { label: 'Колишній курець', value: 4 },
];

export default function Page() {
  // Стать — лишив «female» за замовчуванням. Якщо хочете теж порожньо, скажіть — додам третій стан «не обрано».
  const [sex, setSex] = useState<Sex>('female');

  // Текстові інпути — ПУСТІ на старті
  const [ageTxt, setAgeTxt] = useState('');
  const [bmiTxt, setBmiTxt] = useState('');
  const [sbpTxt, setSbpTxt] = useState('');
  const [townTxt, setTownTxt] = useState(''); // Townsend
  // селекти — теж порожні
  const [ethriskTxt, setEthriskTxt] = useState('');
  const [smokeTxt, setSmokeTxt] = useState('');

  // бінарні прапорці
  const [bCCF, setBCCF] = useState(false);
  const [bCvd, setBCvd] = useState(false);
  const [bPvd, setBPvd] = useState(false);
  const [bRa, setBRa] = useState(false);
  const [bTreatedHyp, setBTreatedHyp] = useState(false);
  const [bType1, setBType1] = useState(false);
  const [bType2, setBType2] = useState(false);
  const [fhKidney, setFhKidney] = useState(false);
  const [bNsaid, setBNsaid] = useState(false);
  // додаткові для жінок
  const [bRenalStones, setBRenalStones] = useState(false);
  const [bSle, setBSle] = useState(false);

  // результати (undefined = ще не рахуємо / бракує даних)
  const [ckd35, setCkd35] = useState<number | undefined>(undefined);
  const [esrf, setEsrf] = useState<number | undefined>(undefined);

  // числові значення
  const age = useMemo(() => parseNum(ageTxt), [ageTxt]);
  const bmi = useMemo(() => parseNum(bmiTxt), [bmiTxt]);
  const sbp = useMemo(() => parseNum(sbpTxt), [sbpTxt]);
  const town = useMemo(() => parseNum(townTxt), [townTxt]);
  const ethrisk = useMemo(() => (ethriskTxt ? Number(ethriskTxt) : undefined), [ethriskTxt]);
  const smoke = useMemo(() => (smokeTxt ? Number(smokeTxt) : undefined), [smokeTxt]);

  // обов’язкові поля заповнені?
  const ready =
    age !== undefined &&
    bmi !== undefined &&
    sbp !== undefined &&
    town !== undefined &&
    ethrisk !== undefined &&
    smoke !== undefined;

  // збираємо аргументи QKidney (5-річний ризик)
  const commonArgs: QKidneyArgs | undefined = useMemo(() => {
    if (!ready) return undefined;
    return {
      age,
      bmi,
      sbp,
      town,
      ethrisk: ethrisk!,
      smoke_cat: smoke!,
      surv: 5,

      b_CCF: +bCCF,
      b_cvd: +bCvd,
      b_pvd: +bPvd,
      b_ra: +bRa,
      b_treatedhyp: +bTreatedHyp,
      b_type1: +bType1,
      b_type2: +bType2,
      fh_kidney: +fhKidney,

      b_nsaid: +bNsaid,
      b_renalstones: +bRenalStones,
      b_sle: +bSle,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, age, bmi, sbp, town, ethrisk, smoke, bCCF, bCvd, bPvd, bRa, bTreatedHyp, bType1, bType2, fhKidney, bNsaid, bRenalStones, bSle]);

  // перерахунок
  useEffect(() => {
    let cancelled = false;

    async function go() {
      if (!commonArgs) {
        setCkd35(undefined);
        setEsrf(undefined);
        return;
      }
      try {
        const [r3, r5] = await Promise.all([
          calcNeph3Raw(commonArgs, sex),
          calcNeph5Raw(commonArgs, sex),
        ]);
        if (!cancelled) {
          setCkd35(Number.isFinite(r3) ? r3 : undefined);
          setEsrf(Number.isFinite(r5) ? r5 : undefined);
        }
      } catch {
        if (!cancelled) {
          setCkd35(undefined);
          setEsrf(undefined);
        }
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [commonArgs, sex]);

  const fmt = (v: number | undefined) =>
    v === undefined ? '—%' : `${v.toFixed(1)}%`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-3">QKidney</h1>
      <div className="mb-4">
        <EngineBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ліва панель: форма */}
        <div className="rounded-2xl border p-4">
          <h2 className="text-xl font-semibold mb-4">Основне</h2>

          {/* Стать */}
          <div className="mb-3">
            <div className="font-medium mb-1">Стать</div>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="sex"
                  checked={sex === 'female'}
                  onChange={() => setSex('female')}
                />
                Жінка
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="sex"
                  checked={sex === 'male'}
                  onChange={() => setSex('male')}
                />
                Чоловік
              </label>
            </div>
          </div>

          {/* Вік */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Вік (років) <span className="text-red-500">обов’язково</span>
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="напр., 55"
              value={ageTxt}
              onChange={(e) => setAgeTxt(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {/* Етнічність */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Етнічність <span className="text-red-500">обов’язково</span>
            </label>
            <select
              className="w-full rounded border px-3 py-2"
              value={ethriskTxt}
              onChange={(e) => setEthriskTxt(e.target.value)}
            >
              <option value="">— оберіть —</option>
              {ETHNICITIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Куріння */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Куріння <span className="text-red-500">обов’язково</span>
            </label>
            <select
              className="w-full rounded border px-3 py-2"
              value={smokeTxt}
              onChange={(e) => setSmokeTxt(e.target.value)}
            >
              <option value="">— оберіть —</option>
              {SMOKING.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* ІМТ / САТ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                ІМТ (кг/м²) <span className="text-red-500">обов’язково</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="напр., 27.4"
                value={bmiTxt}
                onChange={(e) => setBmiTxt(e.target.value)}
                inputMode="decimal"
              />
              <p className="text-xs text-gray-500 mt-1">
                Вводьте десятковий роздільник «,» (крапка «.» також приймається).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                САТ (мм рт.ст.) <span className="text-red-500">обов’язково</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="напр., 128"
                value={sbpTxt}
                onChange={(e) => setSbpTxt(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Townsend */}
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">
              Індекс депривації (Townsend) <span className="text-red-500">обов’язково</span>
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="напр., 0"
              value={townTxt}
              onChange={(e) => setTownTxt(e.target.value)}
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500 mt-1">
              Діапазон приблизно від −7 до 11. Десятковий роздільник «,» (крапка «.» приймається).
            </p>
          </div>

          {/* Коморбідності */}
          <div className="mt-5">
            <h3 className="font-medium mb-2">Супутні стани</h3>

            <div className="mb-2">
              <div className="font-medium mb-1">Діабет</div>
              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dm"
                    checked={!bType1 && !bType2}
                    onChange={() => {
                      setBType1(false);
                      setBType2(false);
                    }}
                  />
                  Немає
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dm"
                    checked={bType1}
                    onChange={() => {
                      setBType1(true);
                      setBType2(false);
                    }}
                  />
                  Тип 1
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dm"
                    checked={bType2}
                    onChange={() => {
                      setBType1(false);
                      setBType2(true);
                    }}
                  />
                  Тип 2
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={bCCF} onChange={(e) => setBCCF(e.target.checked)} />
                Серцева недостатність (CCF)
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={bCvd} onChange={(e) => setBCvd(e.target.checked)} />
                Серцево-судинні хвороби (ІХС/інсульт/ПАД)
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={bPvd} onChange={(e) => setBPvd(e.target.checked)} />
                Периферична артер. хвороба
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={bRa} onChange={(e) => setBRa(e.target.checked)} />
                Ревматоїдний артрит
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bTreatedHyp}
                  onChange={(e) => setBTreatedHyp(e.target.checked)}
                />
                Антигіпертензивна терапія
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={bNsaid} onChange={(e) => setBNsaid(e.target.checked)} />
                Тривалий прийом НПЗП
              </label>

              {/* жінки — додатково */}
              {sex === 'female' && (
                <>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bRenalStones}
                      onChange={(e) => setBRenalStones(e.target.checked)}
                    />
                    Камені нирок
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={bSle} onChange={(e) => setBSle(e.target.checked)} />
                    Системний червоний вовчак (SLE)
                  </label>
                </>
              )}
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fhKidney}
                  onChange={(e) => setFhKidney(e.target.checked)}
                />
                Сімейний анамнез хвороби нирок
              </label>
            </div>
          </div>
        </div>

        {/* Права панель: результати */}
        <div className="rounded-2xl border p-4">
          <h2 className="text-xl font-semibold mb-4">Результат</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600 mb-2">ХХН (стадії 3–5)</div>
              <div className="text-5xl font-bold">{fmt(ckd35)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600 mb-2">Ниркова недостатність (ESRF)</div>
              <div className="text-5xl font-bold">{fmt(esrf)}</div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * Для офіційних значень під’єднано офіційний двигун ClinRisk (WASM). Розрахунок —
            демонстраційний, не призначений для клінічного використання.
          </p>
        </div>
      </div>
    </div>
  );
}
