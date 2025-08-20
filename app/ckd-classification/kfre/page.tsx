"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
type KFREPeriod = "2y" | "5y";

const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
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

function riskBand(pct: number) {
  if (pct < 5) return { label: "низький <5%", tone: "green" as const };
  if (pct < 15) return { label: "помірний 5–15%", tone: "yellow" as const };
  if (pct < 40) return { label: "високий 15–40%", tone: "orange" as const };
  return { label: "дуже високий ≥40%", tone: "red" as const };
}

const LS_KEY = "kfre_v3";

/* ───────── calc (за базовою логіт-моделлю з вашого файлу) ─────────
   Примітка: використовуємо наближену 4-змінну формулу без статі (ACR у мг/г).
   Для ACR=0 застосовано log(ACR+1), щоб уникнути log(0). */
function calcKFRE({
  age,
  eGFR,
  acr,
  period,
}: {
  age: number;
  eGFR: number;
  acr: number;
  period: KFREPeriod;
}) {
  let logit = 0;
  if (period === "2y") {
    logit = -0.2202 * age + 0.2467 * Math.log(acr + 1) - 0.5567 * eGFR + 3.112;
  } else {
    logit = -0.2467 * age + 0.4510 * Math.log(acr + 1) - 0.6012 * eGFR + 3.112;
  }
  const odds = Math.exp(logit);
  const risk = odds / (1 + odds);
  return risk * 100; // %
}

/* ───────── page ───────── */
export default function KFREPage() {
  const [period, setPeriod] = useState<KFREPeriod>("2y");

  // зберігаємо РЯДКИ, щоб поля могли бути порожні
  const [ageStr, setAgeStr] = useState("");
  const [egfrStr, setEgfrStr] = useState("");
  const [acrStr, setAcrStr] = useState("");

  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // відновлення
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setPeriod(v.period ?? "2y");
        setAgeStr(v.ageStr ?? "");
        setEgfrStr(v.egfrStr ?? "");
        setAcrStr(v.acrStr ?? "");
      }
    } catch {}
  }, []);
  // збереження
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ period, ageStr, egfrStr, acrStr }));
  }, [period, ageStr, egfrStr, acrStr]);

  // парсинг + валідація
  const age = toNum(ageStr);
  const egfr = toNum(egfrStr);
  const acr = toNum(acrStr);

  const ageOk = inRange(age, 18, 120);
  const egfrOk = inRange(egfr, 5, 150);
  const acrOk = inRange(acr, 0, 5000);

  const ready = ageOk && egfrOk && acrOk;

  // авто-підрахунок
  const risk = useMemo(() => {
    if (!ready) return null;
    const r = calcKFRE({ age: age!, eGFR: egfr!, acr: acr!, period });
    return Number.isFinite(r) ? +(r.toFixed(1)) : null;
  }, [ready, age, egfr, acr, period]);

  // автоскрол при першому валідному результаті
  useEffect(() => {
    if (risk != null && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [risk]);

  // прогрес-бар: 3 поля
  const progress = useMemo(
    () => [ageStr, egfrStr, acrStr].filter((s) => (s ?? "").trim()).length,
    [ageStr, egfrStr, acrStr]
  );

  const onReset = () => {
    setAgeStr("");
    setEgfrStr("");
    setAcrStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (risk == null) return;
    const band = riskBand(risk);
    const txt = `KFRE (${period === "2y" ? "2 роки" : "5 років"}): ${risk}% — ${band.label}`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">KFRE — прогноз ризику ТНН</h1>
      <p className="text-gray-600 mb-4">
        Введіть вік, <b>eGFR</b> (мл/хв/1.73 м²) та <b>ACR</b> (мг/г). Оберіть період <b>2</b> чи <b>5</b> років —
        підрахунок виконується автоматично. Десятковий роздільник — «,» або «.».
      </p>

      {/* Період */}
      <div className="inline-flex rounded-xl overflow-hidden shadow mb-4">
        <button
          className={`px-4 py-2 font-medium ${period === "2y" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setPeriod("2y")}
        >
          2 роки
        </button>
        <button
          className={`px-4 py-2 font-medium ${period === "5y" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setPeriod("5y")}
        >
          5 років
        </button>
      </div>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 3) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Вік (років)</label>
            <input
              inputMode="numeric"
              placeholder="напр., 64"
              value={ageStr}
              onChange={(e) => setAgeStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${ageStr && !ageOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">eGFR (мл/хв/1.73 м²)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 32.4"
              value={egfrStr}
              onChange={(e) => setEgfrStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${egfrStr && !egfrOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">ACR (мг/г)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 120"
              value={acrStr}
              onChange={(e) => setAcrStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${acrStr && !acrOk ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={risk == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              risk != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={risk != null ? "Скопіювати підсумок" : "Заповніть усі поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            Ризик ТНН за {period === "2y" ? "2 роки" : "5 років"}:&nbsp;
            <span className="font-mono">{risk != null ? risk.toFixed(1) : "—"}</span> %
          </div>

          {risk != null ? (
            <div className="mt-2 inline-flex items-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full ${pill(riskBand(risk).tone)}`}>{riskBand(risk).label}</span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-600">Введіть вік, eGFR і ACR для автоматичного розрахунку.</div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Примітка: використано спрощене рівняння (без статі) на основі логіт-моделі; пороги інтерпретації орієнтовні.
            У клінічному застосуванні перевіряйте версію рівняння та одиниці вимірювання ACR.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/ckd-classification" className="text-gray-600 hover:text-blue-700">
          ← Назад до класифікацій ХХН
        </Link>
      </div>
    </div>
  );
}
