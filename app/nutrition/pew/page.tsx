"use client";
import React, { useState } from "react";
import Link from "next/link";

// 4 основні критерії PEW (ISRNM, 2008)
const PEW_ITEMS = [
  "ІМТ < 23 кг/м²",
  "Втрачено > 5% маси тіла за 3 місяці",
  "Альбумін < 38 г/л",
  "Добовий білок < 0.8 г/кг/день",
];

export default function PEWPage() {
  const [checked, setChecked] = useState<boolean[]>(Array(PEW_ITEMS.length).fill(false));
  const [submitted, setSubmitted] = useState(false);

  function handleToggle(idx: number) {
    setChecked(prev => {
      const arr = [...prev];
      arr[idx] = !arr[idx];
      return arr;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setChecked(Array(PEW_ITEMS.length).fill(false));
    setSubmitted(false);
  }

  const total = checked.filter(Boolean).length;

  function interpretation(total: number) {
    if (total >= 3) return "PEW: високий ризик білково-енергетичної недостатності!";
    if (total === 2) return "Підозра на PEW — потрібна детальніша оцінка.";
    return "PEW не підтверджено (низький ризик).";
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">PEW — Protein-Energy Wasting (ISRNM, 2008)</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="space-y-2">
          {PEW_ITEMS.map((item, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checked[idx]}
                onChange={() => handleToggle(idx)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-6 py-2 font-semibold hover:bg-blue-700 transition">
            Оцінити
          </button>
          <button type="button" onClick={handleReset} className="bg-gray-200 rounded-xl px-6 py-2 hover:bg-gray-300 transition">
            Скинути
          </button>
        </div>
      </form>
      {submitted && (
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center shadow">
          <div className="text-xl font-bold mb-2">PEW:</div>
          <div className="text-2xl font-mono">{total} / 4</div>
          <div className="mt-2 text-gray-600 text-sm">{interpretation(total)}</div>
        </div>
      )}
      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивного статусу
        </Link>
      </div>
    </div>
  );
}
