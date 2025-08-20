"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────────── helpers ───────────── */
const sanitizeDecimalInput = (s: string) => s.replace(/[^\d.,]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const n = parseFloat(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

const pill = (t: "green" | "yellow" | "orange" | "red") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

const LS_KEY = "biochem_nutrition_v3";

/* ───────────── окремі інтерпретації маркерів ───────────── */
function albInterp(val: number) {
  if (val >= 35) return { label: "Норма (≥35)", tone: "green" as const };
  if (val >= 30) return { label: "Легке зниження (30–34)", tone: "yellow" as const };
  return { label: "Виражене зниження (<30)", tone: "red" as const };
}
function prealbInterp(val: number) {
  if (val >= 0.2) return { label: "Норма (≥0.20)", tone: "green" as const };
  if (val >= 0.15) return { label: "Легке зниження (0.15–0.19)", tone: "yellow" as const };
  return { label: "Виражене зниження (<0.15)", tone: "red" as const };
}
function transfInterp(val: number) {
  if (val >= 2.0) return { label: "Норма (≥2.0)", tone: "green" as const };
  if (val >= 1.5) return { label: "Легке зниження (1.5–1.9)", tone: "yellow" as const };
  return { label: "Виражене зниження (<1.5)", tone: "red" as const };
}
function cholInterp(val: number) {
  if (val >= 3.9) return { label: "Норма (≥3.9)", tone: "green" as const };
  if (val >= 3.2) return { label: "Пограничне зниження (3.2–3.8)", tone: "orange" as const };
  return { label: "Дефіцит холестерину (<3.2)", tone: "red" as const };
}

/* ───────────── CONUT (альбумін, лімфоцити, холестерин) ───────────── */
function conutAlbScore(alb: number) {
  if (alb >= 35) return 0;
  if (alb >= 30) return 2;
  if (alb >= 25) return 4;
  return 6;
}
function conutLymphScore(lymph: number) {
  if (lymph >= 1.6) return 0;
  if (lymph >= 1.2) return 1;
  if (lymph >= 0.8) return 2;
  return 3;
}
function conutCholScore(chol: number) {
  if (chol >= 4.6) return 0;
  if (chol >= 3.6) return 1;
  if (chol >= 2.6) return 2;
  return 3;
}
function conutInterpret(total: number) {
  if (total <= 1) return { label: "Норма (0–1)", tone: "green" as const };
  if (total <= 4) return { label: "Легкий дефіцит (2–4)", tone: "yellow" as const };
  if (total <= 8) return { label: "Помірний дефіцит (5–8)", tone: "orange" as const };
  return { label: "Виражений дефіцит (9–12)", tone: "red" as const };
}

/* ───────────── NRI ─────────────
   NRI = 1.519 × альбумін(г/л) + 41.7 × (вага / звична вага) */
function nriValue(alb: number, w: number, uw: number) {
  return 1.519 * alb + 41.7 * (w / uw);
}
function nriInterpret(nri: number) {
  if (nri >= 100) return { label: "Відсутній нутритивний ризик (≥100)", tone: "green" as const };
  if (nri >= 97.5) return { label: "Легкий ризик (97.5–99.9)", tone: "yellow" as const };
  if (nri >= 83.5) return { label: "Помірний ризик (83.5–97.4)", tone: "orange" as const };
  return { label: "Високий ризик (<83.5)", tone: "red" as const };
}

/* ───────────── GNRI ─────────────
   IBW = 22 × (зріст, м)^2; ratio = min(1, вага / IBW)
   GNRI = 1.489 × альбумін(г/л) + 41.7 × ratio */
const ibwFromHeight = (heightCm: number) => 22 * Math.pow(heightCm / 100, 2);
function gnriValue(alb: number, w: number, heightCm: number) {
  const ibw = ibwFromHeight(heightCm);
  const ratio = Math.min(1, w / ibw);
  return 1.489 * alb + 41.7 * ratio;
}
function gnriInterpret(gnri: number) {
  if (gnri > 98) return { label: "Відсутній ризик (>98)", tone: "green" as const };
  if (gnri > 92) return { label: "Низький ризик (92–98]", tone: "yellow" as const };
  if (gnri > 82) return { label: "Помірний ризик (82–92]", tone: "orange" as const };
  return { label: "Високий ризик (≤82)", tone: "red" as const };
}

export default function BiochemistryNutritionPage() {
  // біохімія
  const [albStr, setAlbStr] = useState("");
  const [prealbStr, setPrealbStr] = useState("");
  const [transfStr, setTransfStr] = useState("");
  const [cholStr, setCholStr] = useState("");
  const [lymphStr, setLymphStr] = useState(""); // ×10^9/л — для CONUT

  // антро для індексів
  const [wStr, setWStr] = useState("");   // поточна вага
  const [uwStr, setUwStr] = useState(""); // звична вага (до хвороби)
  const [hStr, setHStr] = useState("");   // зріст (для GNRI)

  // автоскрол
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // відновлення/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setAlbStr(v.albStr ?? "");
        setPrealbStr(v.prealbStr ?? "");
        setTransfStr(v.transfStr ?? "");
        setCholStr(v.cholStr ?? "");
        setLymphStr(v.lymphStr ?? "");
        setWStr(v.wStr ?? "");
        setUwStr(v.uwStr ?? "");
        setHStr(v.hStr ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        albStr, prealbStr, transfStr, cholStr, lymphStr, wStr, uwStr, hStr,
      })
    );
  }, [albStr, prealbStr, transfStr, cholStr, lymphStr, wStr, uwStr, hStr]);

  // парсинг
  const alb = toNum(albStr);       // г/л
  const prealb = toNum(prealbStr); // г/л
  const transf = toNum(transfStr); // г/л
  const chol = toNum(cholStr);     // ммоль/л
  const lymph = toNum(lymphStr);   // ×10^9/л

  const w = toNum(wStr);           // кг
  const uw = toNum(uwStr);         // кг
  const h = toNum(hStr);           // см

  // валідація
  const albOk = inRange(alb, 10, 60);
  const prealbOk = inRange(prealb, 0.05, 1.0);
  const transfOk = inRange(transf, 0.2, 5.0);
  const cholOk = inRange(chol, 1.0, 12.0);
  const lymphOk = inRange(lymph, 0.1, 6.0);

  const wOk = inRange(w, 20, 300);
  const uwOk = inRange(uw, 20, 300);
  const hOk = inRange(h, 80, 250);

  // готовність індексів
  const conutReady = albOk && cholOk && lymphOk;
  const nriReady = albOk && wOk && uwOk;
  const gnriReady = albOk && wOk && hOk;

  // авто-скрол, коли зʼявляється хоч один індекс
  useEffect(() => {
    if ((conutReady || nriReady || gnriReady) && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [conutReady, nriReady, gnriReady]);

  // підрахунок індексів
  const conut = useMemo(() => {
    if (!conutReady) return null;
    const s =
      conutAlbScore(alb as number) +
      conutLymphScore(lymph as number) +
      conutCholScore(chol as number);
    return { score: s, it: conutInterpret(s) };
  }, [conutReady, alb, lymph, chol]);

  const nri = useMemo(() => {
    if (!nriReady) return null;
    const x = nriValue(alb as number, w as number, uw as number);
    return { value: +x.toFixed(1), it: nriInterpret(x) };
  }, [nriReady, alb, w, uw]);

  const gnri = useMemo(() => {
    if (!gnriReady) return null;
    const x = gnriValue(alb as number, w as number, h as number);
    return { value: +x.toFixed(1), it: gnriInterpret(x) };
  }, [gnriReady, alb, w, h]);

  // прогрес (з 8 ключових полів)
  const progress = useMemo(() => {
    const fields = [albStr, prealbStr, transfStr, cholStr, lymphStr, wStr, uwStr, hStr];
    return fields.filter((s) => (s ?? "").trim()).length;
  }, [albStr, prealbStr, transfStr, cholStr, lymphStr, wStr, uwStr, hStr]);

  // дії
  const onReset = () => {
    setAlbStr(""); setPrealbStr(""); setTransfStr(""); setCholStr(""); setLymphStr("");
    setWStr(""); setUwStr(""); setHStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const parts: string[] = [];
    if (albOk) parts.push(`Альбумін ${alb} г/л — ${albInterp(alb!).label}`);
    if (prealbOk) parts.push(`Преальбумін ${prealb} г/л — ${prealbInterp(prealb!).label}`);
    if (transfOk) parts.push(`Трансферин ${transf} г/л — ${transfInterp(transf!).label}`);
    if (cholOk) parts.push(`Холестерин ${chol} ммоль/л — ${cholInterp(chol!).label}`);
    if (conut) parts.push(`CONUT ${conut.score} — ${conut.it.label}`);
    if (nri) parts.push(`NRI ${nri.value} — ${nri.it.label}`);
    if (gnri) parts.push(`GNRI ${gnri.value} — ${gnri.it.label}`);
    const text = parts.length ? parts.join("; ") : "Даних недостатньо для підсумку.";
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(text);
    }
  };

  /* ───────────── UI ───────────── */
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Біохімічні нутритивні показники + індекси</h1>
      <p className="text-gray-600 mb-4">
        Заповнюйте потрібні поля — все перераховується автоматично. Десятковий роздільник — «,» або «.».
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено полів: {progress} / 8</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(progress / 8) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Альбумін (г/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 36.5"
              value={albStr}
              onChange={(e) => setAlbStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${albStr && !albOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Преальбумін (г/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 0.19"
              value={prealbStr}
              onChange={(e) => setPrealbStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${prealbStr && !prealbOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Трансферин (г/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 2.3"
              value={transfStr}
              onChange={(e) => setTransfStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${transfStr && !transfOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Загальний холестерин (ммоль/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 4.0"
              value={cholStr}
              onChange={(e) => setCholStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${cholStr && !cholOk ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Лімфоцити (×10^9/л) — для CONUT</label>
            <input
              inputMode="decimal"
              placeholder="напр., 1.4"
              value={lymphStr}
              onChange={(e) => setLymphStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${lymphStr && !lymphOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Поточна вага (кг) — для NRI/GNRI</label>
            <input
              inputMode="decimal"
              placeholder="напр., 70.2"
              value={wStr}
              onChange={(e) => setWStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${wStr && !wOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Звична вага (кг) — для NRI</label>
            <input
              inputMode="decimal"
              placeholder="напр., 75"
              value={uwStr}
              onChange={(e) => setUwStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${uwStr && !uwOk ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Зріст (см) — для GNRI</label>
            <input
              inputMode="decimal"
              placeholder="напр., 170"
              value={hStr}
              onChange={(e) => setHStr(sanitizeDecimalInput(e.target.value))}
              className={`p-2 rounded-lg border w-full ${hStr && !hOk ? "border-red-400" : ""}`}
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
            title="Скопіювати підсумок"
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результати */}
      <div ref={resRef} className="mt-6 space-y-5" aria-live="polite">
        {/* Сироваткові маркери */}
        {(albOk || prealbOk || transfOk || cholOk) ? (
          <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
            <div className="text-xl font-bold mb-2">Сироваткові маркери</div>

            {albOk && (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold">Альбумін:</span>
                <span className="font-mono">{alb} г/л</span>
                <span className={`px-2 py-1 rounded-full ${pill(albInterp(alb!).tone)}`}>
                  {albInterp(alb!).label}
                </span>
              </div>
            )}
            {prealbOk && (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold">Преальбумін:</span>
                <span className="font-mono">{prealb} г/л</span>
                <span className={`px-2 py-1 rounded-full ${pill(prealbInterp(prealb!).tone)}`}>
                  {prealbInterp(prealb!).label}
                </span>
              </div>
            )}
            {transfOk && (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold">Трансферин:</span>
                <span className="font-mono">{transf} г/л</span>
                <span className={`px-2 py-1 rounded-full ${pill(transfInterp(transf!).tone)}`}>
                  {transfInterp(transf!).label}
                </span>
              </div>
            )}
            {cholOk && (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold">Заг. холестерин:</span>
                <span className="font-mono">{chol} ммоль/л</span>
                <span className={`px-2 py-1 rounded-full ${pill(cholInterp(chol!).tone)}`}>
                  {cholInterp(chol!).label}
                </span>
              </div>
            )}

            {!albOk && !prealbOk && !transfOk && !cholOk && (
              <div className="text-gray-600">Заповніть біохімічні поля вище.</div>
            )}
          </div>
        ) : null}

        {/* Індекси ризику */}
        {(conut || nri || gnri) ? (
          <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
            <div className="text-xl font-bold mb-2">Індекси нутритивного ризику</div>

            {conut && (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">CONUT:</span>
                  <span className="font-mono text-lg">{conut.score}</span>
                  <span className={`px-2 py-1 rounded-full ${pill(conut.it.tone)}`}>{conut.it.label}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Підсумок: альбумін {alb} г/л → {conutAlbScore(alb!)} б.; лімфоцити {lymph}×10⁹/л → {conutLymphScore(lymph!)} б.; холестерин {chol} ммоль/л → {conutCholScore(chol!)} б.
                </div>
              </div>
            )}

            {nri && (
              <div className="mt-3 flex items-center gap-2">
                <span className="font-semibold">NRI:</span>
                <span className="font-mono text-lg">{nri.value}</span>
                <span className={`px-2 py-1 rounded-full ${pill(nri.it.tone)}`}>{nri.it.label}</span>
              </div>
            )}

            {gnri && (
              <div className="mt-3 flex items-center gap-2">
                <span className="font-semibold">GNRI:</span>
                <span className="font-mono text-lg">{gnri.value}</span>
                <span className={`px-2 py-1 rounded-full ${pill(gnri.it.tone)}`}>{gnri.it.label}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border shadow bg-white p-4 md:p-6 text-gray-600">
            Заповніть мінімум: для <b>CONUT</b> — альбумін, лімфоцити, холестерин; для <b>NRI</b> — альбумін, поточна й звична вага; для <b>GNRI</b> — альбумін, вага та зріст.
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивних калькуляторів
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Пороги наведено для дорослих і мають довідковий характер; інтерпретація залежить від клінічного контексту, гідратації, запалення тощо.
      </p>
    </div>
  );
}
