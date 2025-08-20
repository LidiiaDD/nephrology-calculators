"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/** ───────────────── helpers ───────────────── */
function sanitizeDecimalInput(s: string) {
  // дозволяємо тільки цифри, крапку та кому
  return s.replace(/[^\d.,]/g, "");
}
function toNum(s: string): number | null {
  if (!s.trim()) return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
}
function riskColor(nri: number) {
  if (nri >= 100) return { label: "Відсутній нутритивний ризик", tone: "green" as const };
  if (nri >= 97.5) return { label: "Легкий нутритивний ризик", tone: "yellow" as const };
  if (nri >= 83.5) return { label: "Помірний нутритивний ризик", tone: "orange" as const };
  return { label: "Високий нутритивний ризик", tone: "red" as const };
}
const pill = (t: "green" | "yellow" | "orange" | "red") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

const LS_KEY = "nri_form_v2";

/** ───────────────── page ───────────────── */
export default function NRIPage() {
  // зберігаємо рядки, щоб поле могло бути порожнім
  const [albStr, setAlbStr] = useState<string>("");
  const [wStr, setWStr] = useState<string>("");
  const [uwStr, setUwStr] = useState<string>("");

  const [nri, setNri] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);

  // завантаження збережених значень
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { albStr, wStr, uwStr } = JSON.parse(raw);
        if (typeof albStr === "string") setAlbStr(albStr);
        if (typeof wStr === "string") setWStr(wStr);
        if (typeof uwStr === "string") setUwStr(uwStr);
      }
    } catch {}
  }, []);
  // автозбереження
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ albStr, wStr, uwStr }));
  }, [albStr, wStr, uwStr]);

  // парсинг
  const alb = toNum(albStr);
  const w = toNum(wStr);
  const uw = toNum(uwStr);

  // валідація (реалістичні діапазони)
  const albOk = alb != null && inRange(alb, 10, 60);    // г/л
  const wOk = w != null && inRange(w, 20, 300);         // кг
  const uwOk = uw != null && inRange(uw, 20, 300);      // кг
  const allReady = albOk && wOk && uwOk;

  // авто-перерахунок
  useEffect(() => {
    if (allReady && uw) {
      // NRI = 1.519 × альбумін (г/л) + 41.7 × (вага/звична вага)
      const val = 1.519 * (alb as number) + 41.7 * ((w as number) / uw);
      setNri(Number(val.toFixed(1)));
      if (!scrolledOnce.current) {
        resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledOnce.current = true;
      }
    } else {
      setNri(null);
    }
  }, [alb, w, uw, allReady]);

  const progress = useMemo(
    () => [albStr, wStr, uwStr].filter((s) => s.trim().length > 0).length,
    [albStr, wStr, uwStr]
  );

  const onCopy = async () => {
    if (nri == null) return;
    const { label } = riskColor(nri);
    const text = `NRI: ${nri} — ${label}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(text);
    }
  };

  const onReset = () => {
    setAlbStr("");
    setWStr("");
    setUwStr("");
    setNri(null);
    scrolledOnce.current = false;
    setTouched(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-2">Nutritional Risk Index (NRI)</h1>
      <p className="text-gray-600 mb-4">
        Формула: <span className="font-mono">NRI = 1.519 × альбумін(г/л) + 41.7 × (вага / звична&nbsp;вага)</span>.
        Поля можуть бути порожніми; десятковий роздільник — «,» або «.».
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(progress / 3) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6 space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Альбумін сироватки (г/л)</label>
          <input
            inputMode="decimal"
            placeholder="напр., 38.5"
            value={albStr}
            onChange={(e) => {
              setAlbStr(sanitizeDecimalInput(e.target.value));
              setTouched(true);
            }}
            className={`p-2 rounded-lg border w-full ${
              touched && !albOk && albStr ? "border-red-400" : ""
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">Діапазон допустимих значень: 10–60 г/л.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Поточна вага (кг)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 70.2"
              value={wStr}
              onChange={(e) => {
                setWStr(sanitizeDecimalInput(e.target.value));
                setTouched(true);
              }}
              className={`p-2 rounded-lg border w-full ${
                touched && !wOk && wStr ? "border-red-400" : ""
              }`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Звична (до хвороби) вага (кг)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 75"
              value={uwStr}
              onChange={(e) => {
                setUwStr(sanitizeDecimalInput(e.target.value));
                setTouched(true);
              }}
              className={`p-2 rounded-lg border w-full ${
                touched && !uwOk && uwStr ? "border-red-400" : ""
              }`}
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
            disabled={nri == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              nri != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={nri != null ? "Скопіювати результат" : "Заповніть усі поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-xl md:text-2xl font-bold">
            NRI:&nbsp;
            <span className="font-mono">
              {nri != null ? nri.toFixed(1) : "—"}
            </span>
          </div>

          {nri != null ? (
            <div className="mt-3 inline-flex items-center gap-2">
              {(() => {
                const r = riskColor(nri);
                return <span className={`px-3 py-1 rounded-full ${pill(r.tone)}`}>{r.label}</span>;
              })()}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-600">
              Введіть альбумін, поточну й звичну вагу для автоматичного розрахунку.
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Результат є довідковим і не замінює консультацію лікаря.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивних шкал
        </Link>
      </div>
    </div>
  );
}
