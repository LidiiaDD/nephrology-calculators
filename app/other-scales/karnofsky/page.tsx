"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type Opt = { value: number; label: string };

const OPTIONS: Opt[] = [
  { value: 100, label: "100 — Нормальна активність, без скарг" },
  { value: 90,  label: "90 — Незначні скарги" },
  { value: 80,  label: "80 — Прояви хвороби, але зберігає нормальну активність" },
  { value: 70,  label: "70 — Самообслуговування, з обмеженнями" },
  { value: 60,  label: "60 — Періодична потреба в допомозі, більшість часу активний" },
  { value: 50,  label: "50 — Потребує часткової допомоги" },
  { value: 40,  label: "40 — Суттєва допомога, лежачий, не здатний до самообслуговування" },
  { value: 30,  label: "30 — Тяжкохворий, потрібна госпіталізація/догляд" },
  { value: 20,  label: "20 — Дуже тяжкохворий, інтенсивна терапія" },
  { value: 10,  label: "10 — Вмираючий" },
  { value: 0,   label: "0 — Помер" },
];

function kpsClass(val: number) {
  if (val >= 80) return { tag: "Незалежний/майже незалежний", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (val >= 50) return { tag: "Потребує періодичної допомоги", tone: "bg-amber-100 text-amber-800 border-amber-200" };
  if (val > 0)  return { tag: "Потребує постійного догляду",   tone: "bg-rose-100 text-rose-800 border-rose-200" };
  return { tag: "Помер", tone: "bg-gray-200 text-gray-700 border-gray-300" };
}

export default function KarnofskyPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const progress = selected == null ? 0 : 100;

  const interp = useMemo(() => {
    if (selected == null) return null;
    return kpsClass(selected);
  }, [selected]);

  const copyResult = async () => {
    if (selected == null) return;
    const i = kpsClass(selected);
    const text = `Karnofsky Performance Status: ${selected}\nКлас: ${i.tag}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert("Не вдалося скопіювати.");
    }
  };

  const reset = () => setSelected(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Karnofsky Performance Status (KPS)</h1>
      <p className="mt-1 text-gray-600">Поля спочатку порожні. Оберіть один рівень стану.</p>

      {/* Прогрес */}
      <div className="mt-6 rounded-2xl border p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>Заповнено: {progress} / 100%</span>
          <span>{progress === 100 ? "✔️ Готово" : "Заповніть вибір"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Макет сторінки */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Введення */}
        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Оберіть рівень</h2>

          <fieldset className="space-y-3">
            {OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="kps"
                  className="mt-1 size-4"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                />
                <span className="text-sm leading-5">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={copyResult}
              disabled={selected == null}
              className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Копіювати результат
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-gray-200 px-5 py-2 font-medium hover:bg-gray-300"
            >
              Скинути
            </button>
          </div>
        </div>

        {/* Результат */}
        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Результат</h2>

          {selected == null ? (
            <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
              Зробіть вибір ліворуч, і тут з’явиться інтерпретація.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl font-bold">
                {selected}
                <span className="ml-2 text-base font-normal text-gray-500">/ 100</span>
              </div>

              {interp && (
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${interp.tone}`}
                >
                  {interp.tag}
                </div>
              )}

              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-medium">≥ 80</span> — зберігає майже повну незалежність.
                  </li>
                  <li>
                    <span className="font-medium">50–70</span> — потребує періодичної допомоги.
                  </li>
                  <li>
                    <span className="font-medium">10–40</span> — потребує постійного догляду.
                  </li>
                  <li>
                    <span className="font-medium">0</span> — помер.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Результат є довідковим і не замінює консультацію лікаря.
          </div>
        </div>
      </div>

      {/* Навігація */}
      <div className="mt-8">
        <Link href="/other-scales" className="text-gray-600 hover:text-blue-700">
          ← Назад до інших шкал
        </Link>
      </div>
    </div>
  );
}
