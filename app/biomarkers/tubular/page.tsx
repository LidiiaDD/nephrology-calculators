"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────────────── helpers ───────────────── */
const LS_KEY = "tubular_markers_v2";

const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,\-nNaAdD/ ]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t || ["-", "н/д", "n/a", "nd", "н.д.", "none"].includes(t.toLowerCase())) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

type Tone = "green" | "yellow" | "orange" | "red" | "gray";
const pill = (t: Tone) =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : t === "red"
    ? "bg-red-100 text-red-900"
    : "bg-gray-100 text-gray-700";

/* Інтерпретації (орієнтовні, залежать від методу/лабу): */
function interpLFABP(val: number | null) {
  if (val == null) return { text: "—", tone: "gray" as Tone };
  if (val < 8) return { text: "Норма", tone: "green" as Tone };
  if (val < 30) return { text: "Помірне підвищення (ризик ураження)", tone: "yellow" as Tone };
  return { text: "Високе підвищення (AKI/значиме ураження)", tone: "red" as Tone };
}

type NGALSpecimen = "urine" | "serum";
/* Для NGAL додав перемикач матеріалу. Порогові значення — орієнтовні:
   - сеча: <150 нг/мл — норма; 150–299 — підвищення; ≥300 — високе підвищення
   - сироватка: <100 — норма; 100–149 — підвищення; ≥150 — високе підвищення
   (за потреби змінемо під твою лабораторію) */
function interpNGAL(val: number | null, specimen: NGALSpecimen) {
  if (val == null) return { text: "—", tone: "gray" as Tone };
  if (specimen === "urine") {
    if (val < 150) return { text: "Норма (сеча)", tone: "green" as Tone };
    if (val < 300) return { text: "Підвищення (сеча)", tone: "yellow" as Tone };
    return { text: "Високе підвищення (сеча)", tone: "red" as Tone };
  } else {
    if (val < 100) return { text: "Норма (сироватка)", tone: "green" as Tone };
    if (val < 150) return { text: "Підвищення (сироватка)", tone: "yellow" as Tone };
    return { text: "Високе підвищення (сироватка)", tone: "red" as Tone };
  }
}
function interpKIM1(val: number | null) {
  if (val == null) return { text: "—", tone: "gray" as Tone };
  if (val < 2.0) return { text: "Норма", tone: "green" as Tone };
  if (val < 5.0) return { text: "Підвищення (канальцеве ураження)", tone: "yellow" as Tone };
  return { text: "Високе підвищення (AKI/виражене ураження)", tone: "red" as Tone };
}

/* ───────────────── Page ───────────────── */
export default function TubularMarkersPage() {
  // зберігаємо як РЯДКИ → поля можуть бути порожні
  const [lfabpStr, setLfabpStr] = useState("");
  const [ngalStr, setNgalStr] = useState("");
  const [kim1Str, setKim1Str] = useState("");
  const [ngalSpecimen, setNgalSpecimen] = useState<NGALSpecimen>("urine");

  // відновлення / збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setLfabpStr(v.lfabpStr ?? "");
        setNgalStr(v.ngalStr ?? "");
        setKim1Str(v.kim1Str ?? "");
        setNgalSpecimen(v.ngalSpecimen ?? "urine");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ lfabpStr, ngalStr, kim1Str, ngalSpecimen })
    );
  }, [lfabpStr, ngalStr, kim1Str, ngalSpecimen]);

  // парсинг → числа
  const lfabp = toNum(lfabpStr); // нг/мл
  const ngal = toNum(ngalStr);   // нг/мл
  const kim1 = toNum(kim1Str);   // нг/мл

  // валідація (широкі реалістичні діапазони)
  const lfabpOk = lfabp == null || inRange(lfabp, 0, 10000);
  const ngalOk  = ngal  == null || inRange(ngal, 0, 100000);
  const kim1Ok  = kim1  == null || inRange(kim1, 0, 10000);

  // інтерпретації
  const iLFABP = useMemo(() => interpLFABP(lfabp), [lfabp]);
  const iNGAL  = useMemo(() => interpNGAL(ngal, ngalSpecimen), [ngal, ngalSpecimen]);
  const iKIM1  = useMemo(() => interpKIM1(kim1), [kim1]);

  // автоскрол, коли зʼявляються перші валідні дані
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  const anyResult = (lfabp != null || ngal != null || kim1 != null) && lfabpOk && ngalOk && kim1Ok;
  useEffect(() => {
    if (anyResult && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [anyResult]);

  // прогрес-бар
  const progress = useMemo(
    () => [lfabpStr, ngalStr, kim1Str].filter((s) => (s ?? "").trim()).length,
    [lfabpStr, ngalStr, kim1Str]
  );

  // дії
  const onReset = () => {
    setLfabpStr("");
    setNgalStr("");
    setKim1Str("");
    setNgalSpecimen("urine");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const parts: string[] = [];
    if (lfabp != null) parts.push(`L-FABP: ${lfabp} нг/мл — ${iLFABP.text}`);
    if (ngal != null)  parts.push(`NGAL (${ngalSpecimen === "urine" ? "сеча" : "сироватка"}): ${ngal} нг/мл — ${iNGAL.text}`);
    if (kim1 != null)  parts.push(`KIM-1: ${kim1} нг/мл — ${iKIM1.text}`);
    if (!parts.length) return;
    const txt = parts.join("; ");
    try { await navigator.clipboard.writeText(txt); alert("Скопійовано в буфер обміну."); }
    catch { alert(txt); }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Тубулярні маркери — L-FABP, NGAL, KIM-1</h1>
      <p className="text-gray-600 mb-4">
        Поля порожні за замовчуванням. Вводьте значення в <b>нг/мл</b>; дроби — «,» або «.».
        Розрахунок і інтерпретація — <b>автоматичні</b> (кнопки не потрібно).
      </p>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 3) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма (автоперерахунок) */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* L-FABP */}
          <div>
            <label className="block mb-1 font-semibold">L-FABP (нг/мл)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 10 або —"
              value={lfabpStr}
              onChange={(e) => setLfabpStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${lfabpStr && !lfabpOk ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-500 mt-1">Порожнє/«—» допускається, якщо аналіз не виконували.</p>
          </div>

          {/* NGAL */}
          <div>
            <label className="block mb-1 font-semibold">NGAL (нг/мл)</label>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                placeholder="напр., 120 або —"
                value={ngalStr}
                onChange={(e) => setNgalStr(sanitizeDecimal(e.target.value))}
                className={`p-2 rounded-lg border w-full ${ngalStr && !ngalOk ? "border-red-400" : ""}`}
              />
              <select
                value={ngalSpecimen}
                onChange={(e) => setNgalSpecimen(e.target.value as NGALSpecimen)}
                className="p-2 rounded-lg border"
                title="Матеріал"
              >
                <option value="urine">сеча</option>
                <option value="serum">сироватка</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Обери матеріал: сеча / сироватка (впливає на інтерпретацію).</p>
          </div>

          {/* KIM-1 */}
          <div>
            <label className="block mb-1 font-semibold">KIM-1 (нг/мл)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 2 або —"
              value={kim1Str}
              onChange={(e) => setKim1Str(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${kim1Str && !kim1Ok ? "border-red-400" : ""}`}
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
            disabled={!anyResult}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              anyResult ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={anyResult ? "Скопіювати короткий підсумок" : "Введіть хоча б одне значення"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результати */}
      <div ref={resRef} className="mt-6 space-y-4" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold mb-2">Результати / інтерпретація</div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* L-FABP */}
            <div>
              <div className="text-sm text-gray-600">L-FABP</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-lg">{lfabp != null ? `${lfabp}` : "—"}</div>
                <div className="text-sm text-gray-500">нг/мл</div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${pill(iLFABP.tone)}`}>{iLFABP.text}</span>
              </div>
            </div>

            {/* NGAL */}
            <div>
              <div className="text-sm text-gray-600">NGAL ({ngalSpecimen === "urine" ? "сеча" : "сироватка"})</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-lg">{ngal != null ? `${ngal}` : "—"}</div>
                <div className="text-sm text-gray-500">нг/мл</div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${pill(iNGAL.tone)}`}>{iNGAL.text}</span>
              </div>
            </div>

            {/* KIM-1 */}
            <div>
              <div className="text-sm text-gray-600">KIM-1</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-lg">{kim1 != null ? `${kim1}` : "—"}</div>
                <div className="text-sm text-gray-500">нг/мл</div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${pill(iKIM1.tone)}`}>{iKIM1.text}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Пороги наведено орієнтовно; інтерпретація залежить від методу вимірювання та клінічного контексту.
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
