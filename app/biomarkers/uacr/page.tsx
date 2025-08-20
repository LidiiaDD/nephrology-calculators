"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
type Unit = "mg/g" | "mg/mmol";

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

const LS_KEY = "uacr_v3";

/* Конверсії:
   - Для режиму mg/g очікуємо: Альбумін — мг/л, Креатинін — мг/дл.
     UACR(mg/g) = Alb(mg/L) / [Crea(mg/dL) × 0.01] = Alb × 100 / Crea.
   - Для режиму mg/mmol очікуємо: Альбумін — мг/л, Креатинін — ммоль/л.
     UACR(mg/mmol) = Alb(mg/L) / Crea(mmol/L).
   - Перерахунок між одиницями: mg/mmol × 8.84 ≈ mg/g; mg/g ÷ 8.84 ≈ mg/mmol.
*/
const MMOL_PER_G_CREAT = 8.84;

function interpretByMgG(uacr_mg_g: number) {
  if (uacr_mg_g < 30) return { cat: "A1", label: "Норма (<30 mg/g)", tone: "green" as const };
  if (uacr_mg_g <= 300) return { cat: "A2", label: "Мікроальбумінурія (30–300 mg/g)", tone: "orange" as const };
  return { cat: "A3", label: "Макроальбумінурія (>300 mg/g)", tone: "red" as const };
}

/* ───────── page ───────── */
export default function UACRPage() {
  const [unit, setUnit] = useState<Unit>("mg/g");

  // зберігаємо РЯДКИ → поля можуть бути порожні
  const [albStr, setAlbStr] = useState("");
  const [creaStr, setCreaStr] = useState("");

  // автозбереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setUnit(v.unit ?? "mg/g");
        setAlbStr(v.albStr ?? "");
        setCreaStr(v.creaStr ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ unit, albStr, creaStr }));
  }, [unit, albStr, creaStr]);

  // парсинг
  const alb = toNum(albStr);  // мг/л
  const crea = toNum(creaStr); // мг/дл (для mg/g) або ммоль/л (для mg/mmol)

  // валідація (широкі реалістичні діапазони)
  const albOk = inRange(alb, 0, 10000);
  const creaOk = unit === "mg/g" ? inRange(crea, 1, 500) : inRange(crea, 0.1, 500);

  // розрахунок
  const uacr = useMemo(() => {
    if (!albOk || !creaOk) return null;
    if (unit === "mg/g") {
      return (alb! * 100) / (crea as number); // Alb ×100 / Crea(mg/dL)
    } else {
      return alb! / (crea as number); // mg/mmol
    }
  }, [unit, albOk, creaOk, alb, crea]);

  // показ у двох одиницях для зручності
  const uacr_mg_g = useMemo(() => {
    if (uacr == null) return null;
    return unit === "mg/g" ? uacr : uacr * MMOL_PER_G_CREAT;
  }, [uacr, unit]);
  const uacr_mg_mmol = useMemo(() => {
    if (uacr == null) return null;
    return unit === "mg/mmol" ? uacr : uacr / MMOL_PER_G_CREAT;
  }, [uacr, unit]);

  const interp = uacr_mg_g != null ? interpretByMgG(uacr_mg_g) : null;

  // автоскрол, коли зʼявляється результат
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (uacr != null && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [uacr]);

  // прогрес-бар (2 поля)
  const progress = useMemo(
    () => [albStr, creaStr].filter((s) => (s ?? "").trim()).length,
    [albStr, creaStr]
  );

  const onReset = () => {
    setAlbStr("");
    setCreaStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (uacr == null || uacr_mg_g == null || uacr_mg_mmol == null || !interp) return;
    const txt = `UACR: ${uacr.toFixed(1)} ${unit} — ${interp.cat} ${interp.label} (≈ ${uacr_mg_g.toFixed(1)} mg/g; ≈ ${uacr_mg_mmol.toFixed(2)} mg/mmol)`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-2">UACR — Альбумін/Креатинін у сечі</h2>
      <p className="text-gray-600 mb-4">
        Заповніть <b>альбумін</b> (мг/л) та <b>креатинін</b> у відповідних одиницях. Підрахунок — автоматичний.
        Десятковий роздільник — «,» або «.».
      </p>

      {/* Перемикач одиниць виводу */}
      <div className="inline-flex rounded-xl overflow-hidden shadow mb-4">
        <button
          className={`px-4 py-2 font-medium ${unit === "mg/g" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setUnit("mg/g")}
        >
          mg/g (KDIGO)
        </button>
        <button
          className={`px-4 py-2 font-medium ${unit === "mg/mmol" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          onClick={() => setUnit("mg/mmol")}
        >
          mg/mmol
        </button>
      </div>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 2</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 2) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Альбумін у сечі (мг/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 40"
              value={albStr}
              onChange={(e) => setAlbStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${albStr && !albOk ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Допустимо: 0–10000 мг/л.</p>
          </div>

          <div>
            <label className="block mb-1 font-semibold">
              Креатинін у сечі ({unit === "mg/g" ? "мг/дл" : "ммоль/л"})
            </label>
            <input
              inputMode="decimal"
              placeholder={unit === "mg/g" ? "напр., 120 (мг/дл)" : "напр., 12 (ммоль/л)"}
              value={creaStr}
              onChange={(e) => setCreaStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${creaStr && !creaOk ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {unit === "mg/g"
                ? "Для mg/g введіть креатинін у мг/дл; формула: UACR = Альбумін(мг/л) × 100 / Креатинін(мг/дл)."
                : "Для mg/mmol введіть креатинін у ммоль/л; формула: UACR = Альбумін(мг/л) / Креатинін(ммоль/л)."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={uacr == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              uacr != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={uacr != null ? "Скопіювати підсумок" : "Заповніть обидва поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">Результат</div>

          <div className="mt-2 text-gray-800">
            Основна одиниця:&nbsp;
            <span className="font-mono">
              {uacr != null ? (unit === "mg/g" ? uacr.toFixed(1) : uacr.toFixed(2)) : "—"}
              &nbsp;{unit}
            </span>
          </div>

          {uacr != null && (
            <>
              <div className="mt-1 text-gray-700">
                Еквівалент:&nbsp;
                <span className="font-mono">
                  {unit === "mg/g" ? uacr_mg_mmol!.toFixed(2) + " mg/mmol" : uacr_mg_g!.toFixed(1) + " mg/g"}
                </span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2">
                <span className="font-semibold">Категорія:</span>
                <span className={`px-3 py-1 rounded-full ${pill(interpretByMgG(uacr_mg_g!).tone)}`}>
                  {interpretByMgG(uacr_mg_g!).cat} — {interpretByMgG(uacr_mg_g!).label}
                </span>
              </div>
            </>
          )}

          {uacr == null && (
            <div className="mt-2 text-sm text-gray-600">Введіть альбумін і креатинін для автоматичного розрахунку.</div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Пороги KDIGO: A1 &lt;30 mg/g (&lt;3.4 mg/mmol), A2 30–300 mg/g (3.4–33.9 mg/mmol), A3 &gt;300 mg/g (≥34 mg/mmol).
          </div>
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
