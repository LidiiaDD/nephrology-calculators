"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,-]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && Number.isFinite(n) && n >= min && n <= max;

const pill = (t: "green" | "yellow" | "orange" | "red" | "gray") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : t === "red"
    ? "bg-red-100 text-red-900"
    : "bg-gray-100 text-gray-700";

const LS_KEY = "uromodulin_pro_full_v1";

/* ───────── Units & conversions ─────────
   Всередині рахуємо у таких базових одиницях:
   - sUmod, uUmod → mg/L
   - sCrea, uCrea, BUN, Urea, UrAc → mg/dL (для коефіцієнтів також конвертуємо до mg/L або g/L за потреби)
   - eGFR → mL/min/1.73m² (як є)
   - uAlb → mg/L (допускаємо ввід у µg/min з перерахунком через добову діурезу L/добу)
*/
type UMOD_U = "mg/L" | "ng/mL";
type SCREA_U = "mg/dL" | "µmol/L";
type UCREA_U = "mg/dL" | "mmol/L";
type UREA_U = "mg/dL" | "mmol/L";
type URAC_U = "mg/dL" | "µmol/L";
type UALB_U = "mg/L" | "µg/min";

const umodToMgL = (val: number, unit: UMOD_U) =>
  unit === "mg/L" ? val : val / 1000; // 1 ng/mL = 0.001 mg/L

const sCreaToMgDl = (val: number, unit: SCREA_U) =>
  unit === "mg/dL" ? val : val / 88.4; // µmol/L → mg/dL

const uCreaToMgDl = (val: number, unit: UCREA_U) =>
  unit === "mg/dL" ? val : val / 0.0884; // mmol/L → mg/dL (÷0.0884 = ×11.312)

const ureaToMgDl = (val: number, unit: UREA_U) =>
  unit === "mg/dL" ? val : val * 6.0; // mmol/L → mg/dL (UREA, не BUN)

const uracToMgDl = (val: number, unit: URAC_U) =>
  unit === "mg/dL" ? val : val / 59.48; // µmol/L → mg/dL

// uAlb (µg/min) -> mg/L потребує діурезу (L/добу):  µg/min × 1440 = µg/добу → /1000 = mg/добу → /діурез(L/добу) = mg/L
const uAlbToMgL = (val: number, unit: UALB_U, diuresis_L_per_day: number | null) => {
  if (unit === "mg/L") return val;
  if (!inRange(diuresis_L_per_day, 0.1, 20)) return null; // потребує валідного діурезу
  const mg_per_day = (val * 1440) / 1000.0;
  return mg_per_day / (diuresis_L_per_day as number);
};

/* ───────── component ───────── */
export default function UromodulinProPage() {
  // Значення як РЯДКИ (щоб поля могли бути порожні)
  const [sUmodStr, setSUmodStr] = useState("");
  const [uUmodStr, setUUmodStr] = useState("");
  const [sCreaStr, setSCreaStr] = useState("");
  const [uCreaStr, setUCreaStr] = useState("");
  const [egfrStr, setEgfrStr] = useState(""); // опційно

  // Додаткові біохімічні
  const [bunStr, setBunStr] = useState("");
  const [ureaStr, setUreaStr] = useState("");
  const [uracStr, setUracStr] = useState("");

  // Альбумін сечі та діурез
  const [uAlbStr, setUAlbStr] = useState("");
  const [diuresisStr, setDiuresisStr] = useState("");

  // Одиниці
  const [sUmodU, setSUmodU] = useState<UMOD_U>("mg/L");
  const [uUmodU, setUUmodU] = useState<UMOD_U>("mg/L");
  const [sCreaU, setSCreaU] = useState<SCREA_U>("mg/dL");
  const [uCreaU, setUCreaU] = useState<UCREA_U>("mg/dL");
  const [ureaU, setUreaU] = useState<UREA_U>("mg/dL");
  const [uracU, setUracU] = useState<URAC_U>("mg/dL");
  const [uAlbU, setUAlbU] = useState<UALB_U>("mg/L");

  // Відновлення/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setSUmodStr(v.sUmodStr ?? ""); setUUmodStr(v.uUmodStr ?? "");
        setSCreaStr(v.sCreaStr ?? ""); setUCreaStr(v.uCreaStr ?? "");
        setEgfrStr(v.egfrStr ?? "");
        setBunStr(v.bunStr ?? ""); setUreaStr(v.ureaStr ?? ""); setUracStr(v.uracStr ?? "");
        setUAlbStr(v.uAlbStr ?? ""); setDiuresisStr(v.diuresisStr ?? "");
        setSUmodU(v.sUmodU ?? "mg/L"); setUUmodU(v.uUmodU ?? "mg/L");
        setSCreaU(v.sCreaU ?? "mg/dL"); setUCreaU(v.uCreaU ?? "mg/dL");
        setUreaU(v.ureaU ?? "mg/dL"); setUracU(v.uracU ?? "mg/dL"); setUAlbU(v.uAlbU ?? "mg/L");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr,
        bunStr, ureaStr, uracStr,
        uAlbStr, diuresisStr,
        sUmodU, uUmodU, sCreaU, uCreaU, ureaU, uracU, uAlbU
      })
    );
  }, [sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr, bunStr, ureaStr, uracStr, uAlbStr, diuresisStr, sUmodU, uUmodU, sCreaU, uCreaU, ureaU, uracU, uAlbU]);

  // Парсинг
  const sUmodIn = toNum(sUmodStr), uUmodIn = toNum(uUmodStr);
  const sCreaIn = toNum(sCreaStr), uCreaIn = toNum(uCreaStr);
  const egfr = toNum(egfrStr);

  const bunIn = toNum(bunStr), ureaIn = toNum(ureaStr), uracIn = toNum(uracStr);
  const uAlbIn = toNum(uAlbStr), diuresisIn = toNum(diuresisStr);

  // Конверсії до внутрішніх одиниць
  const sUmod = sUmodIn != null ? umodToMgL(sUmodIn, sUmodU) : null; // mg/L
  const uUmod = uUmodIn != null ? umodToMgL(uUmodIn, uUmodU) : null; // mg/L
  const sCrea = sCreaIn != null ? sCreaToMgDl(sCreaIn, sCreaU) : null; // mg/dL
  const uCrea = uCreaIn != null ? uCreaToMgDl(uCreaIn, uCreaU) : null; // mg/dL
  const bun = bunIn != null ? bunIn : null;                              // mg/dL
  const urea_mgdl = ureaIn != null ? ureaToMgDl(ureaIn, ureaU) : null;   // mg/dL
  const urac_mgdl = uracIn != null ? uracToMgDl(uracIn, uracU) : null;   // mg/dL
  const uAlb_mgL = uAlbIn != null ? uAlbToMgL(uAlbIn, uAlbU, diuresisIn ?? null) : null; // mg/L (або null, якщо бракує діурезу)

  // Валідація (широкі робочі діапазони)
  const sUmodOk = inRange(sUmod, 0, 5000);
  const uUmodOk = inRange(uUmod, 0, 10000);
  const sCreaOk = inRange(sCrea, 0.1, 25);
  const uCreaOk = inRange(uCrea, 1, 1000);
  const egfrOk = egfr == null || inRange(egfr, 1, 200);

  const bunOk = bun == null || inRange(bun, 1, 200);
  const ureaOk = urea_mgdl == null || inRange(urea_mgdl, 1, 400);
  const uracOk = urac_mgdl == null || inRange(urac_mgdl, 1, 30);

  const uAlbOk = uAlb_mgL == null || inRange(uAlb_mgL, 0, 10000);
  const diuresisOk = diuresisIn == null || inRange(diuresisIn, 0.1, 20);

  const readyCore = sUmodOk && uUmodOk && sCreaOk && uCreaOk && egfrOk && bunOk && ureaOk && uracOk && uAlbOk && diuresisOk;

  /* ───────── Основні формули (як ти й просив) ─────────
     FeUmod (%) = ((uUmod/uCrea) / (sUmod/sCrea)) / (egfr || 1) * 100
     FsUmod     = (sUmod * sCrea) / (uUmod * uCrea) * 100
     (sUmod, uUmod у mg/L; sCrea, uCrea у mg/dL)
  */
  const FeUmod = useMemo(() => {
    if (!readyCore || sUmod == null || uUmod == null || sCrea == null || uCrea == null) return null;
    const denomEgfr = egfr ?? 1;
    const val = ((uUmod / uCrea) / (sUmod / sCrea)) / denomEgfr * 100;
    return Number.isFinite(val) ? +val.toFixed(2) : null;
  }, [readyCore, sUmod, uUmod, sCrea, uCrea, egfr]);

  const FsUmod = useMemo(() => {
    if (!readyCore || sUmod == null || uUmod == null || sCrea == null || uCrea == null) return null;
    const val = (sUmod * sCrea) / (uUmod * uCrea) * 100;
    return Number.isFinite(val) ? +val.toFixed(2) : null;
  }, [readyCore, sUmod, uUmod, sCrea, uCrea]);

  /* ───────── Допоміжні індекси з узгодженням одиниць ───────── */
  const sCrea_mgL = sCrea != null ? sCrea * 10 : null;     // mg/dL → mg/L
  const uCrea_mgL = uCrea != null ? uCrea * 10 : null;     // mg/dL → mg/L
  const uCrea_gL  = uCrea != null ? uCrea * 0.01 : null;   // mg/dL → g/L
  const bun_mgL   = bun != null ? bun * 10 : null;         // mg/dL → mg/L
  const urea_mgL  = urea_mgdl != null ? urea_mgdl * 10 : null; // mg/dL → mg/L
  const urac_mgL  = urac_mgdl != null ? urac_mgdl * 10 : null; // mg/dL → mg/L

  // 1) sUmod/sCrea (mg/mg)
  const r_sUmod_sCrea = useMemo(() => {
    if (sUmod == null || sCrea_mgL == null || sCrea_mgL === 0) return null;
    const v = sUmod / sCrea_mgL;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, sCrea_mgL]);

  // 2) uUmod/Cr (mg/g)
  const r_uUmod_per_gCr = useMemo(() => {
    if (uUmod == null || uCrea_gL == null || uCrea_gL === 0) return null;
    const v = uUmod / uCrea_gL; // mg/L / g/L = mg/g
    return Number.isFinite(v) ? +v.toFixed(1) : null;
  }, [uUmod, uCrea_gL]);

  // 3) uUmod/uCrea (mg/mg) — обидва у mg/L
  const r_uUmod_uCrea_mgmg = useMemo(() => {
    if (uUmod == null || uCrea_mgL == null || uCrea_mgL === 0) return null;
    const v = uUmod / uCrea_mgL;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [uUmod, uCrea_mgL]);

  // 4) uUmod/eGFR (ум. од.) — якщо egfr є
  const r_uUmod_per_eGFR = useMemo(() => {
    if (uUmod == null || egfr == null || egfr <= 0) return null;
    const v = uUmod / egfr; // mg/L per (mL/min/1.73m²)
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [uUmod, egfr]);

  // 5) sUmod/uUmod і 6) uUmod/sUmod (безрозмірні, якщо обидва mg/L)
  const r_s_over_u = useMemo(() => {
    if (sUmod == null || uUmod == null || uUmod === 0) return null;
    const v = sUmod / uUmod;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, uUmod]);

  const r_u_over_s = useMemo(() => {
    if (sUmod == null || uUmod == null || sUmod === 0) return null;
    const v = uUmod / sUmod;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, uUmod]);

  // 7) sUmod/BUN (mg/mg)
  const r_sUmod_BUN = useMemo(() => {
    if (sUmod == null || bun_mgL == null || bun_mgL === 0) return null;
    const v = sUmod / bun_mgL;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, bun_mgL]);

  // 8) sUmod/Urea (mg/mg)
  const r_sUmod_Urea = useMemo(() => {
    if (sUmod == null || urea_mgL == null || urea_mgL === 0) return null;
    const v = sUmod / urea_mgL;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, urea_mgL]);

  // 9) sUmod/UrAc (mg/mg)
  const r_sUmod_UrAc = useMemo(() => {
    if (sUmod == null || urac_mgL == null || urac_mgL === 0) return null;
    const v = sUmod / urac_mgL;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [sUmod, urac_mgL]);

  // 10) uAlb/uUmod (mg/mg) — потребує uAlb у mg/L (або µg/min + діурез)
  const r_uAlb_uUmod = useMemo(() => {
    if (uAlb_mgL == null || uUmod == null || uUmod === 0) return null;
    const v = uAlb_mgL / uUmod;
    return Number.isFinite(v) ? +v.toFixed(3) : null;
  }, [uAlb_mgL, uUmod]);

  // 11) Добова екскреція Umod (за наявності діурезу): mg/добу та µg/хв
  const excr_umod_mg_day = useMemo(() => {
    if (uUmod == null || diuresisIn == null) return null;
    const mg_day = uUmod * diuresisIn; // mg/L × L/day = mg/day
    return Number.isFinite(mg_day) ? +mg_day.toFixed(1) : null;
  }, [uUmod, diuresisIn]);

  const excr_umod_ug_min = useMemo(() => {
    if (excr_umod_mg_day == null) return null;
    const ug_min = (excr_umod_mg_day * 1000) / 1440.0;
    return Number.isFinite(ug_min) ? +ug_min.toFixed(1) : null;
  }, [excr_umod_mg_day]);

  // Автоскрол до результатів
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    const anyMain = FeUmod != null || FsUmod != null;
    if (anyMain && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [FeUmod, FsUmod]);

  // Прогрес (рахуємо всі заповнені поля)
  const progress = useMemo(() => {
    const fields = [sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr, bunStr, ureaStr, uracStr, uAlbStr, diuresisStr];
    return fields.filter((s) => (s ?? "").trim()).length;
  }, [sUmodStr, uUmodStr, sCreaStr, uCreaStr, egfrStr, bunStr, ureaStr, uracStr, uAlbStr, diuresisStr]);

  const onReset = () => {
    setSUmodStr(""); setUUmodStr(""); setSCreaStr(""); setUCreaStr(""); setEgfrStr("");
    setBunStr(""); setUreaStr(""); setUracStr("");
    setUAlbStr(""); setDiuresisStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const parts: string[] = [];
    if (FeUmod != null) parts.push(`FeUmod ${FeUmod}%`);
    if (FsUmod != null) parts.push(`FsUmod ${FsUmod}`);
    if (r_sUmod_sCrea != null) parts.push(`sUmod/sCrea ${r_sUmod_sCrea} мг/мг`);
    if (r_uUmod_per_gCr != null) parts.push(`uUmod/Cr ${r_uUmod_per_gCr} мг/г`);
    if (r_uUmod_uCrea_mgmg != null) parts.push(`uUmod/uCrea ${r_uUmod_uCrea_mgmg} мг/мг`);
    if (r_uMod_over_s() != null) {} // no-op: just to keep TS happy in template literals below
    if (r_u_over_s != null) parts.push(`uUmod/sUmod ${r_u_over_s}`);
    if (r_s_over_u != null) parts.push(`sUmod/uUmod ${r_s_over_u}`);
    if (r_uUmod_per_eGFR != null) parts.push(`uUmod/eGFR ${r_uUmod_per_eGFR} (ум.од.)`);
    if (r_sUmod_BUN != null) parts.push(`sUmod/BUN ${r_sUmod_BUN} мг/мг`);
    if (r_sUmod_Urea != null) parts.push(`sUmod/Urea ${r_sUmod_Urea} мг/мг`);
    if (r_sUmod_UrAc != null) parts.push(`sUmod/UrAc ${r_sUmod_UrAc} мг/мг`);
    if (r_uAlb_uUmod != null) parts.push(`uAlb/uUmod ${r_uAlb_uUmod} мг/мг`);
    if (excr_umod_mg_day != null) parts.push(`Екскреція Umod ${excr_umod_mg_day} мг/добу`);
    if (excr_umod_ug_min != null) parts.push(`Екскреція Umod ${excr_umod_ug_min} мкг/хв`);
    if (!parts.length) return;
    const txt = parts.join("; ");
    try { await navigator.clipboard.writeText(txt); alert("Скопійовано в буфер обміну."); }
    catch { alert(txt); }
  };

  // Візуальні бейджі (умовні)
  const toneHigh = (v: number | null) => (v == null ? "gray" : v >= 1 ? "green" : v >= 0.5 ? "yellow" : v >= 0.1 ? "orange" : "red");
  const toneLow  = (v: number | null) => (v == null ? "gray" : v <= 1 ? "green" : v <= 3 ? "yellow" : v <= 10 ? "orange" : "red");

  // (невеличкий хак, щоб уникнути помилки TS у шаблоні onCopy)
  function r_uMod_over_s() { return r_u_over_s; }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Uromodulin Pro — повний профіль</h1>
      <p className="text-gray-600 mb-4">
        Заповнюйте потрібні поля — підрахунок автоматичний. Десятковий роздільник — «,» або «.».
      </p>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено полів: {progress} / 10</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 10) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* sUmod */}
          <div>
            <label className="block mb-1 font-semibold">Сироватковий уромодулін (sUmod)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 10" value={sUmodStr}
                     onChange={(e) => setSUmodStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${sUmodStr && !sUmodOk ? "border-red-400" : ""}`} />
              <select value={sUmodU} onChange={(e) => setSUmodU(e.target.value as UMOD_U)} className="p-2 rounded-lg border">
                <option>mg/L</option><option>ng/mL</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Автоконверсія до mg/L.</p>
          </div>

          {/* uUmod */}
          <div>
            <label className="block mb-1 font-semibold">Уромодулін у сечі (uUmod)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 20" value={uUmodStr}
                     onChange={(e) => setUUmodStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${uUmodStr && !uUmodOk ? "border-red-400" : ""}`} />
              <select value={uUmodU} onChange={(e) => setUUmodU(e.target.value as UMOD_U)} className="p-2 rounded-lg border">
                <option>mg/L</option><option>ng/mL</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Автоконверсія до mg/L.</p>
          </div>

          {/* sCrea */}
          <div>
            <label className="block mb-1 font-semibold">Креатинін сироватки (S-Cr)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 1.2" value={sCreaStr}
                     onChange={(e) => setSCreaStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${sCreaStr && !sCreaOk ? "border-red-400" : ""}`} />
              <select value={sCreaU} onChange={(e) => setSCreaU(e.target.value as SCREA_U)} className="p-2 rounded-lg border">
                <option>mg/dL</option><option>µmol/L</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">µmol/L → mg/dL (÷88.4).</p>
          </div>

          {/* uCrea */}
          <div>
            <label className="block mb-1 font-semibold">Креатинін сечі (U-Cr)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 120" value={uCreaStr}
                     onChange={(e) => setUCreaStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${uCreaStr && !uCreaOk ? "border-red-400" : ""}`} />
              <select value={uCreaU} onChange={(e) => setUCreaU(e.target.value as UCREA_U)} className="p-2 rounded-lg border">
                <option>mg/dL</option><option>mmol/L</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">mmol/L → mg/dL (÷0.0884).</p>
          </div>

          {/* eGFR (опційно) */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">eGFR (мл/хв/1.73 м²) — опційно</label>
            <input inputMode="decimal" placeholder="напр., 60 (можна лишити порожнім)" value={egfrStr}
                   onChange={(e) => setEgfrStr(sanitizeDecimal(e.target.value))}
                   className={`p-2 rounded-lg border w-full ${egfrStr && !egfrOk ? "border-red-400" : ""}`} />
            <p className="text-xs text-gray-500 mt-1">У FeUmod використовується (eGFR || 1).</p>
          </div>
        </div>

        {/* Додаткові біохімічні */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">BUN (азот сечовини)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 40" value={bunStr}
                     onChange={(e) => setBunStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${bunStr && !bunOk ? "border-red-400" : ""}`} />
              <div className="p-2 rounded-lg border bg-gray-50 text-gray-600">mg/dL</div>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Сечовина (Urea)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 60 або 10" value={ureaStr}
                     onChange={(e) => setUreaStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${ureaStr && !ureaOk ? "border-red-400" : ""}`} />
              <select value={ureaU} onChange={(e) => setUreaU(e.target.value as UREA_U)} className="p-2 rounded-lg border">
                <option>mg/dL</option><option>mmol/L</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">mmol/L → mg/dL (×6.0).</p>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Сечова кислота (UrAc)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 7.0 або 420" value={uracStr}
                     onChange={(e) => setUracStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${uracStr && !uracOk ? "border-red-400" : ""}`} />
              <select value={uracU} onChange={(e) => setUracU(e.target.value as URAC_U)} className="p-2 rounded-lg border">
                <option>mg/dL</option><option>µmol/L</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">µmol/L → mg/dL (÷59.48).</p>
          </div>
        </div>

        {/* Альбумін сечі + діурез */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Альбумін у сечі (uAlb)</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 30 (mg/L) або 20 (µg/min)" value={uAlbStr}
                     onChange={(e) => setUAlbStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${uAlbStr && !uAlbOk ? "border-red-400" : ""}`} />
              <select value={uAlbU} onChange={(e) => setUAlbU(e.target.value as UALB_U)} className="p-2 rounded-lg border">
                <option>mg/L</option><option>µg/min</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Для «µg/min» потрібен добовий діурез (L/добу), щоб конвертувати в mg/L.
            </p>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Добовий діурез</label>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="напр., 1.5" value={diuresisStr}
                     onChange={(e) => setDiuresisStr(sanitizeDecimal(e.target.value))}
                     className={`p-2 rounded-lg border w-full ${diuresisStr && !diuresisOk ? "border-red-400" : ""}`} />
              <div className="p-2 rounded-lg border bg-gray-50 text-gray-600">L/добу</div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={
              FeUmod == null && FsUmod == null &&
              r_sUmod_sCrea == null && r_uUmod_per_gCr == null &&
              r_uUmod_uCrea_mgmg == null && r_uUmod_per_eGFR == null &&
              r_s_over_u == null && r_u_over_s == null &&
              r_sUmod_BUN == null && r_sUmod_Urea == null && r_sUmod_UrAc == null &&
              r_uAlb_uUmod == null && excr_umod_mg_day == null && excr_umod_ug_min == null
            }
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              (FeUmod != null || FsUmod != null ||
                r_sUmod_sCrea != null || r_uUmod_per_gCr != null ||
                r_uUmod_uCrea_mgmg != null || r_uUmod_per_eGFR != null ||
                r_s_over_u != null || r_u_over_s != null ||
                r_sUmod_BUN != null || r_sUmod_Urea != null || r_sUmod_UrAc != null ||
                r_uAlb_uUmod != null || excr_umod_mg_day != null || excr_umod_ug_min != null)
                ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результати */}
      <div ref={resRef} className="mt-6 space-y-4" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold mb-1">Основні показники</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium">FeUmod</div>
              <div className="text-sm">
                <span className="font-mono">{FeUmod != null ? `${FeUmod} %` : "—"}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${pill(toneHigh(FeUmod) as any)}`}>
                  {FeUmod != null ? "обчислено" : "н/д"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Формула: <span className="font-mono">((uUmod/uCrea) / (sUmod/sCrea)) / (eGFR || 1) × 100</span>
              </div>
            </div>
            <div>
              <div className="font-medium">FsUmod</div>
              <div className="text-sm">
                <span className="font-mono">{FsUmod != null ? FsUmod : "—"}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${pill(toneLow(FsUmod) as any)}`}>
                  {FsUmod != null ? "обчислено" : "н/д"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Формула: <span className="font-mono">(sUmod × sCrea) / (uUmod × uCrea) × 100</span>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="text-lg md:text-xl font-bold mb-1">Розширені індекси</div>
          <div className="grid md:grid-cols-3 gap-3">
            <Metric label="sUmod/sCrea (мг/мг)" value={r_sUmod_sCrea} tone={toneHigh(r_sUmod_sCrea)} />
            <Metric label="uUmod/Cr (мг/г)" value={r_uUmod_per_gCr} tone={toneHigh(r_uUmod_per_gCr)} />
            <Metric label="uUmod/uCrea (мг/мг)" value={r_uUmod_uCrea_mgmg} tone={toneHigh(r_uUmod_uCrea_mgmg)} />
            <Metric label="uUmod/eGFR (ум.од.)" value={r_uUmod_per_eGFR} tone={toneHigh(r_uUmod_per_eGFR)} />
            <Metric label="sUmod/uUmod (×)" value={r_s_over_u} tone={toneHigh(r_s_over_u)} />
            <Metric label="uUmod/sUmod (×)" value={r_u_over_s} tone={toneHigh(r_u_over_s)} />
            <Metric label="sUmod/BUN (мг/мг)" value={r_sUmod_BUN} tone={toneHigh(r_sUmod_BUN)} />
            <Metric label="sUmod/Urea (мг/мг)" value={r_sUmod_Urea} tone={toneHigh(r_sUmod_Urea)} />
            <Metric label="sUmod/UrAc (мг/мг)" value={r_sUmod_UrAc} tone={toneHigh(r_sUmod_UrAc)} />
            <Metric label="uAlb/uUmod (мг/мг)" value={r_uAlb_uUmod} tone={toneHigh(r_uAlb_uUmod)} />
            <Metric label="Екскр. Umod (мг/добу)" value={excr_umod_mg_day} tone={toneHigh(excr_umod_mg_day)} />
            <Metric label="Екскр. Umod (мкг/хв)" value={excr_umod_ug_min} tone={toneHigh(excr_umod_ug_min)} />
          </div>

          {/* Пояснення щодо uAlb */}
          {uAlbU === "µg/min" && uAlbStr && (!diuresisStr || !diuresisOk) && (
            <div className="mt-3 text-sm text-yellow-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              Для перерахунку uAlb з <b>µg/min</b> у <b>mg/L</b> вкажіть добовий діурез (L/добу).
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
          <span className="font-semibold">Примітка.</span>{" "}
          Калькулятор уромодулінового профілю розроблено на
          кафедрі нефрології та нирковозамісної терапії
          НУОЗ України імені П. Л. Шупика.
        </div>
      </div>

      <div className="mt-8">
        <Link href="/biomarkers" className="text-gray-600 hover:text-blue-700">
          ← Назад до біомаркерів
        </Link>
      </div>
    </div>
  );
}

/* ───────── маленький підкомпонент для відображення метрик ───────── */
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "green" | "yellow" | "orange" | "red" | "gray";
}) {
  return (
    <div>
      <div className="font-medium">{label}</div>
      <div className="text-sm">
        <span className="font-mono">{value ?? "—"}</span>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          tone === "green" ? "bg-green-100 text-green-900"
          : tone === "yellow" ? "bg-yellow-100 text-yellow-900"
          : tone === "orange" ? "bg-orange-100 text-orange-900"
          : tone === "red" ? "bg-red-100 text-red-900"
          : "bg-gray-100 text-gray-700"
        }`}>
          {value != null ? "обчислено" : "н/д"}
        </span>
      </div>
    </div>
  );
}
