"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
const LS_KEY = "charlson_v2";

type Tone = "green" | "yellow" | "orange" | "red" | "gray";
const pill = (t: Tone) =>
  t === "green" ? "bg-green-100 text-green-900"
  : t === "yellow" ? "bg-yellow-100 text-yellow-900"
  : t === "orange" ? "bg-orange-100 text-orange-900"
  : t === "red" ? "bg-red-100 text-red-900"
  : "bg-gray-100 text-gray-700";

const sanitizeInt = (s: string) => (s ?? "").replace(/[^\d]/g, "");
const toInt = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseInt(t, 10);
  return Number.isFinite(v) ? v : null;
};
const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);

/* ───────── дані (ваги Чарлсона) ───────── */
type Cond = { label: string; value: number };
const CHARLSON_CONDITIONS: Cond[] = [
  { label: "Інфаркт міокарда", value: 1 },
  { label: "Серцева недостатність", value: 1 },
  { label: "Периферійна судинна хвороба", value: 1 },
  { label: "Інсульт/ТІА", value: 1 },
  { label: "Деменція", value: 1 },
  { label: "ХОЗЛ", value: 1 },
  { label: "Захворювання сполучної тканини", value: 1 },
  { label: "Виразкова хвороба", value: 1 },
  { label: "Цукровий діабет (без ускладнень)", value: 1 },
  { label: "Цукровий діабет (з ускладненнями)", value: 2 },
  { label: "Хронічна ниркова недостатність", value: 2 },
  { label: "Пухлина (без метастазів)", value: 2 },
  { label: "Лейкемія", value: 2 },
  { label: "Лімфома", value: 2 },
  { label: "Захворювання печінки середнього ступеня", value: 2 },
  { label: "Захворювання печінки тяжкого ступеня", value: 3 },
  { label: "Метастатичний рак", value: 6 },
  { label: "ВІЛ/СНІД", value: 6 },
];

function charlsonAgeScore(age: number | null) {
  if (age == null || age < 50) return 0;
  // +1 бал за кожні повні 10 років, починаючи з 50
  return Math.floor((age - 50) / 10) + 1;
}

function riskBand(total: number | null): { text: string; tone: Tone } {
  if (total == null) return { text: "—", tone: "gray" };
  if (total <= 2) return { text: "Низький ризик", tone: "green" };
  if (total <= 4) return { text: "Середній ризик", tone: "yellow" };
  return { text: "Високий ризик", tone: "red" };
}

/* ───────── компонент ───────── */
export default function CharlsonPage() {
  // поля — як рядки, щоб стартували ПОРОЖНІ
  const [ageStr, setAgeStr] = useState("");
  const [selected, setSelected] = useState<boolean[]>(
    Array(CHARLSON_CONDITIONS.length).fill(false)
  );

  // відновлення / збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setAgeStr(v.ageStr ?? "");
        if (Array.isArray(v.selected) && v.selected.length === CHARLSON_CONDITIONS.length) {
          setSelected(v.selected);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ ageStr, selected }));
  }, [ageStr, selected]);

  const age = useMemo(() => {
    const n = toInt(ageStr);
    if (n == null) return null;
    return clamp(n, 0, 120);
  }, [ageStr]);

  const baseScore = useMemo(
    () =>
      selected.reduce(
        (sum, on, i) => sum + (on ? CHARLSON_CONDITIONS[i].value : 0),
        0
      ),
    [selected]
  );

  const total = useMemo(() => baseScore + charlsonAgeScore(age), [baseScore, age]);
  const band = riskBand(total);

  // прогрес: 1 поле (вік) + кількість станів
  const completed = (ageStr.trim() ? 1 : 0) + selected.filter(Boolean).length;
  const totalFields = 1 + CHARLSON_CONDITIONS.length;
  const progressPct = Math.round((completed / totalFields) * 100);

  // автоскрол до результатів
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if ((ageStr.trim() || selected.some(Boolean)) && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [ageStr, selected]);

  const toggle = (idx: number) =>
    setSelected((prev) => {
      const arr = [...prev];
      arr[idx] = !arr[idx];
      return arr;
    });

  const onReset = () => {
    setAgeStr("");
    setSelected(Array(CHARLSON_CONDITIONS.length).fill(false));
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    const chosen = CHARLSON_CONDITIONS.filter((_, i) => selected[i]).map((c) => `${c.label} (${c.value}б)`);
    const txt =
      `Вік: ${age ?? "—"}; ` +
      `Вік-бали: ${charlsonAgeScore(age)}; ` +
      `Супутні: ${chosen.length ? chosen.join(", ") : "—"}; ` +
      `Бал Чарлсона: ${total ?? "—"} (${band.text}).`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Charlson Comorbidity Index (CCI)</h1>
      <p className="text-gray-600 mb-4">
        Заповніть потрібні параметри — підрахунок <b>автоматичний</b>. Поля стартують порожні.
      </p>

      {/* Прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {completed} / {totalFields}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        {/* Вік */}
        <div>
          <label className="block mb-1 font-semibold">Вік пацієнта</label>
          <input
            inputMode="numeric"
            placeholder="напр., 67"
            value={ageStr}
            onChange={(e) => setAgeStr(sanitizeInt(e.target.value))}
            className="p-2 rounded-lg border w-full"
            aria-label="Вік (років)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Додається +1 бал за кожні 10 років, починаючи з 50 (50–59: +1; 60–69: +2; …).
          </p>
        </div>

        {/* Стані здоровʼя */}
        <div>
          <div className="block mb-2 font-semibold">Супутні стани (позначте наявні)</div>
          <div className="grid md:grid-cols-2 gap-2">
            {CHARLSON_CONDITIONS.map((c, i) => (
              <label key={i} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected[i]}
                  onChange={() => toggle(i)}
                  aria-label={c.label}
                />
                <span className="flex-1">{c.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{c.value} б.</span>
              </label>
            ))}
          </div>
        </div>

        {/* Дії */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!(ageStr.trim() || selected.some(Boolean))}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              (ageStr.trim() || selected.some(Boolean))
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результати */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold mb-2">Підсумок</div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600">Бал за супутні стани</div>
              <div className="font-mono text-lg">{baseScore}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Віковий компонент</div>
              <div className="font-mono text-lg">{charlsonAgeScore(age)}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-sm text-gray-600">Загальний бал CCI</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-2xl">{total}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${pill(band.tone)}`}>{band.text}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Чим вищий бал — тим гірший прогноз (орієнтовно: 0–2 низький, 3–4 середній, ≥5 високий ризик).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Навігація */}
      <div className="mt-8">
        <Link href="/cardio-risk" className="text-gray-600 hover:text-blue-700">
          ← Назад до серцево-судинних ризиків
        </Link>
      </div>
    </div>
  );
}
