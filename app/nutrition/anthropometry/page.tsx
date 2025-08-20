"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────────── helpers ───────────── */
type Sex = "male" | "female";

const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);
const cmToM = (cm: number) => cm / 100;
const cmToIn = (cm: number) => cm / 2.54;
const kg = (x: number | null) => (x == null ? "—" : x.toFixed(1) + " кг");
const gL = (x: number | null) => (x == null ? "—" : x.toFixed(1));

function sanitizeDecimalInput(s: string) {
  // дозволяємо цифри, пробіли, кому й крапку
  return s.replace(/[^\d.,\s-]/g, "");
}
function toNum(s: string): number | null {
  if (!s || !s.trim()) return null;
  const t = s.replace(",", ".").trim();
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function inRange(n: number | null, min: number, max: number) {
  return n != null && n >= min && n <= max;
}

/* ───────────── core calcs ───────────── */
// BMI та категорії ВООЗ (дорослі)
function bmiValue(w: number, hCm: number) {
  const m = cmToM(hCm);
  return w / (m * m);
}
function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Дефіцит маси тіла", tone: "yellow" as const };
  if (bmi < 25) return { label: "Норма", tone: "green" as const };
  if (bmi < 30) return { label: "Надмірна маса", tone: "orange" as const };
  return { label: "Ожиріння", tone: "red" as const };
}
// BSA (Mosteller)
const bsaMosteller = (w: number, hCm: number) =>
  Math.sqrt((w * hCm) / 3600);

// WHtR
function whtr(waistCm: number, hCm: number) {
  return waistCm / hCm;
}
function whtrBand(x: number) {
  if (x < 0.5) return { label: "у межах норми (<0.5)", tone: "green" as const };
  if (x < 0.6) return { label: "підвищений ризик (0.5–0.59)", tone: "orange" as const };
  return { label: "дуже високий ризик (≥0.6)", tone: "red" as const };
}

// WHR
function whr(waistCm: number, hipCm: number) {
  return waistCm / hipCm;
}
function whrFlag(x: number, sex: Sex) {
  const cut = sex === "male" ? 0.90 : 0.85;
  return x > cut
    ? { label: "ризик абдомінального ожиріння", tone: "red" as const }
    : { label: "без ознак абдомінального ожиріння", tone: "green" as const };
}

// Окружність талії: європ. пороги ризику
function waistRisk(waistCm: number, sex: Sex) {
  const cut1 = sex === "male" ? 94 : 80;
  const cut2 = sex === "male" ? 102 : 88;
  if (waistCm >= cut2) return { label: "високий ризик (дуже висока талія)", tone: "red" as const };
  if (waistCm >= cut1) return { label: "підвищений ризик (висока талія)", tone: "orange" as const };
  return { label: "у межах норми", tone: "green" as const };
}

// Ідеальна маса тіла (IBW Devine) + альтернатива BMI 22
function ibwDevine(heightCm: number, sex: Sex) {
  const hIn = cmToIn(heightCm);
  const inchesOver5ft = Math.max(0, hIn - 60);
  const base = sex === "male" ? 50 : 45.5; // кг
  return base + 2.3 * inchesOver5ft;
}
function ibwBmi22(heightCm: number) {
  const m = cmToM(heightCm);
  return 22 * m * m;
}
function adjBWIfObese(actual: number, ibw: number, bmi: number) {
  if (bmi < 30) return null;
  return ibw + 0.4 * (actual - ibw);
}

// Lean Body Mass (Janmahasatian 2005)
function lbmJanmahasatian(weight: number, bmi: number, sex: Sex) {
  if (sex === "male") return (9270 * weight) / (6680 + 216 * bmi);
  return (9270 * weight) / (8780 + 244 * bmi);
}

// %жиру (Deurenberg 1991): 1.2*BMI + 0.23*age - 10.8*sex - 5.4 (sex:1=чол,0=жін)
function bodyFatDeurenberg(bmi: number, age: number, sex: Sex) {
  const sx = sex === "male" ? 1 : 0;
  return 1.2 * bmi + 0.23 * age - 10.8 * sx - 5.4;
}
function fatBand(pct: number, sex: Sex) {
  // дуже грубо для дорослих: орієнтовні "зелені" межі
  const ok = sex === "male" ? [10, 20] : [20, 30];
  if (pct < ok[0]) return { label: "можливий дефіцит жиру", tone: "yellow" as const };
  if (pct <= ok[1]) return { label: "умовна норма", tone: "green" as const };
  return { label: "підвищений вміст жиру", tone: "orange" as const };
}

// MUAC / Calf – скринінгові прапорці
function muacFlag(muac: number, sex: Sex) {
  // орієнтовні дорослі cut-offs (скринінг): <23.5 см — ризик недоїдання
  return muac < 23.5
    ? { label: "можливий ризик недоїдання", tone: "yellow" as const }
    : { label: "ок", tone: "green" as const };
}
function calfFlag(calf: number) {
  // <31 см — ризик саркопенії у людей похилого віку (скринінг)
  return calf < 31
    ? { label: "низька окружність литки (ризик саркопенії)", tone: "yellow" as const }
    : { label: "ок", tone: "green" as const };
}

const pill =
  (t: "green" | "yellow" | "orange" | "red") =>
    t === "green"
      ? "bg-green-100 text-green-900"
      : t === "yellow"
      ? "bg-yellow-100 text-yellow-900"
      : t === "orange"
      ? "bg-orange-100 text-orange-900"
      : "bg-red-100 text-red-900";

const LS_KEY = "anthro_form_v2";

export default function AnthropometryPage() {
  const [sex, setSex] = useState<Sex>("female");
  const [ageStr, setAgeStr] = useState("");
  const [weightStr, setWeightStr] = useState("");
  const [heightStr, setHeightStr] = useState("");
  const [waistStr, setWaistStr] = useState("");
  const [hipStr, setHipStr] = useState("");
  const [muacStr, setMuacStr] = useState("");
  const [calfStr, setCalfStr] = useState("");

  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setSex(v.sex ?? "female");
        setAgeStr(v.ageStr ?? "");
        setWeightStr(v.weightStr ?? "");
        setHeightStr(v.heightStr ?? "");
        setWaistStr(v.waistStr ?? "");
        setHipStr(v.hipStr ?? "");
        setMuacStr(v.muacStr ?? "");
        setCalfStr(v.calfStr ?? "");
      }
    } catch {}
  }, []);
  // persist
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        sex,
        ageStr,
        weightStr,
        heightStr,
        waistStr,
        hipStr,
        muacStr,
        calfStr,
      }),
    );
  }, [sex, ageStr, weightStr, heightStr, waistStr, hipStr, muacStr, calfStr]);

  // parse
  const age = toNum(ageStr);
  const w = toNum(weightStr);
  const h = toNum(heightStr);
  const waist = toNum(waistStr);
  const hip = toNum(hipStr);
  const muac = toNum(muacStr);
  const calf = toNum(calfStr);

  const haveWH = inRange(w, 20, 400) && inRange(h, 80, 250);
  const haveWaist = inRange(waist, 30, 200) && inRange(h, 80, 250);
  const haveHip = inRange(hip, 30, 200) && inRange(waist, 30, 200);
  const haveAge = inRange(age, 14, 100); // дорослі

  // computations
  const bmi = haveWH ? bmiValue(w!, h!) : null;
  const bsa = haveWH ? bsaMosteller(w!, h!) : null;

  const whtrVal = haveWaist ? whtr(waist!, h!) : null;
  const whrVal = haveHip ? whr(waist!, hip!) : null;
  const waistBand = inRange(waist, 30, 200) ? waistRisk(waist!, sex) : null;

  const ibwD = haveWH ? ibwDevine(h!, sex) : null;
  const ibw22 = haveWH ? ibwBmi22(h!) : null;
  const adjBW = haveWH && bmi! >= 30 ? adjBWIfObese(w!, ibwD!, bmi!) : null;

  const lbm = haveWH ? lbmJanmahasatian(w!, bmi!, sex) : null;

  const fatPct = haveWH && haveAge ? clamp(bodyFatDeurenberg(bmi!, age!, sex), 3, 60) : null;

  const muacBand = inRange(muac, 10, 60) ? muacFlag(muac!, sex) : null;
  const calfBand = inRange(calf, 15, 60) ? calfFlag(calf!) : null;

  // progress bar (кількість заповнених полів із 8)
  const progress = useMemo(() => {
    const fields = [ageStr, weightStr, heightStr, waistStr, hipStr, muacStr, calfStr];
    return fields.filter((s) => s.trim()).length + 1; // +1 за стать
  }, [ageStr, weightStr, heightStr, waistStr, hipStr, muacStr, calfStr]);

  useEffect(() => {
    if ((bmi || whtrVal || whrVal || muacBand || calfBand) && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [bmi, whtrVal, whrVal, muacBand, calfBand]);

  const onReset = () => {
    setSex("female");
    setAgeStr("");
    setWeightStr("");
    setHeightStr("");
    setWaistStr("");
    setHipStr("");
    setMuacStr("");
    setCalfStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const parts: string[] = [];
    if (bmi != null) parts.push(`BMI ${bmi.toFixed(1)} (${bmiCategory(bmi).label})`);
    if (bsa != null) parts.push(`BSA ${bsa.toFixed(2)} м²`);
    if (whtrVal != null) parts.push(`WHtR ${whtrVal.toFixed(2)} (${whtrBand(whtrVal).label})`);
    if (whrVal != null) parts.push(`WHR ${whrVal.toFixed(2)} (${whrFlag(whrVal, sex).label})`);
    if (waistBand) parts.push(`Талія: ${waist} см — ${waistBand.label}`);
    if (ibwD != null) parts.push(`IBW (Devine) ${ibwD.toFixed(1)} кг`);
    if (adjBW != null) parts.push(`AdjBW ${adjBW.toFixed(1)} кг`);
    if (lbm != null) parts.push(`LBM ${lbm.toFixed(1)} кг`);
    if (fatPct != null) parts.push(`Жир ${fatPct.toFixed(1)}% (${fatBand(fatPct, sex).label})`);
    if (muacBand) parts.push(`MUAC ${muac} см — ${muacBand.label}`);
    if (calfBand) parts.push(`Литка ${calf} см — ${calfBand.label}`);
    const text = parts.join("; ");
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-2">Антропометрія (дорослі)</h1>
      <p className="text-gray-600 mb-4">
        Заповніть потрібні поля — показники рахуються автоматично. Десятковий роздільник — «,» або «.».
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 8</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(progress / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Стать</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="p-2 rounded-lg border w-full"
            >
              <option value="female">Жінка</option>
              <option value="male">Чоловік</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Вік (років)</label>
            <input
              inputMode="numeric"
              placeholder="напр., 45"
              value={ageStr}
              onChange={(e) => setAgeStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${ageStr && !haveAge ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Для розрахунку % жиру.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Маса тіла (кг)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 72.5"
              value={weightStr}
              onChange={(e) => setWeightStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${weightStr && !inRange(w, 20, 400) ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Зріст (см)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 170"
              value={heightStr}
              onChange={(e) => setHeightStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${heightStr && !inRange(h, 80, 250) ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Талія (см)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 82"
              value={waistStr}
              onChange={(e) => setWaistStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${waistStr && !inRange(waist, 30, 200) ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Стегна (см)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 100"
              value={hipStr}
              onChange={(e) => setHipStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${hipStr && !inRange(hip, 30, 200) ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Для WHR.</p>
          </div>
          <div>
            <label className="block mb-1 font-semibold">MUAC — окружність плеча (см)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 24"
              value={muacStr}
              onChange={(e) => setMuacStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${muacStr && !inRange(muac, 10, 60) ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Окружність литки (см)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 33"
              value={calfStr}
              onChange={(e) => setCalfStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${calfStr && !inRange(calf, 15, 60) ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200"
          >
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-xl px-5 py-2 font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={!haveWH && !whtrVal && !whrVal}
            title="Скопіювати ключові показники"
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Results */}
      <div ref={resRef} className="mt-6 space-y-4" aria-live="polite">
        {/* BMI + BSA */}
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-xl font-bold mb-2">Загальні показники</div>
          {bmi != null ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">BMI:</span>
                <span className="font-mono text-lg">{bmi.toFixed(1)}</span>
                <span className={`px-2 py-1 rounded-full ${pill(bmiCategory(bmi).tone)}`}>
                  {bmiCategory(bmi).label}
                </span>
              </div>
              <div className="mt-2 text-gray-700">
                BSA (Mosteller): <span className="font-mono">{bsa!.toFixed(2)} м²</span>
              </div>
              <div className="mt-2 text-gray-700">
                IBW (Devine): <span className="font-mono">{kg(ibwD)}</span>
                {" · "}IBW (BMI=22): <span className="font-mono">{kg(ibw22)}</span>
                {adjBW != null && (
                  <>
                    {" · "}AdjBW (ожиріння): <span className="font-mono">{kg(adjBW)}</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-gray-700">
                LBM (Janmahasatian): <span className="font-mono">{kg(lbm)}</span>
              </div>
              {fatPct != null && (
                <div className="mt-2 flex items-center gap-2">
                  <span>% жиру (Deurenberg):</span>
                  <span className="font-mono">{fatPct.toFixed(1)}%</span>
                  <span className={`px-2 py-1 rounded-full ${pill(fatBand(fatPct, sex).tone)}`}>{fatBand(fatPct, sex).label}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600">Введіть масу тіла та зріст.</div>
          )}
        </div>

        {/* Abdominal */}
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-xl font-bold mb-2">Абдомінальне ожиріння</div>
          {whtrVal != null ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>WHtR:</span>
              <span className="font-mono text-lg">{whtrVal.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded-full ${pill(whtrBand(whtrVal).tone)}`}>{whtrBand(whtrVal).label}</span>
            </div>
          ) : (
            <div className="text-gray-600">Введіть талію та зріст.</div>
          )}
          {whrVal != null && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>WHR:</span>
              <span className="font-mono">{whrVal.toFixed(2)}</span>
              <span className={`px-2 py-1 rounded-full ${pill(whrFlag(whrVal, sex).tone)}`}>{whrFlag(whrVal, sex).label}</span>
            </div>
          )}
          {waistBand && (
            <div className="mt-2">
              Талія: <span className="font-mono">{waist} см</span>{" "}
              <span className={`px-2 py-1 rounded-full ${pill(waistBand.tone)}`}>{waistBand.label}</span>
            </div>
          )}
        </div>

        {/* Screening flags */}
        {(muacBand || calfBand) && (
          <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
            <div className="text-xl font-bold mb-2">Скринінгові індикатори</div>
            {muacBand && (
              <div className="mb-1">
                MUAC: <span className="font-mono">{muac} см</span>{" "}
                <span className={`px-2 py-1 rounded-full ${pill(muacBand.tone)}`}>{muacBand.label}</span>
              </div>
            )}
            {calfBand && (
              <div>
                Окружність литки: <span className="font-mono">{calf} см</span>{" "}
                <span className={`px-2 py-1 rounded-full ${pill(calfBand.tone)}`}>{calfBand.label}</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Значення MUAC та окружності литки — орієнтовні скринінгові пороги; інтерпретація залежить від віку,
              статі та контексту пацієнта.
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивних калькуляторів
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Результати носять довідковий характер і не замінюють консультацію лікаря. Формули: BMI (ВООЗ), BSA (Mosteller),
        Devine/IBW, Adjusted BW (при BMI ≥30), Janmahasatian LBM, Deurenberg % жиру; пороги талії/WHR — для
        європеоїдного населення.
      </p>
    </div>
  );
}
