"use client";
import React, { useState } from "react";
import Link from "next/link";

// 10 пунктів, кожен оцінюється від 0 (норма) до 3 (максимальна недостатність/запалення)
const MIS_ITEMS = [
  "Зниження маси тіла за 6 місяців",
  "Зниження маси тіла за 1 місяць",
  "Зміна апетиту і харчування",
  "Шлунково-кишкові симптоми > 2 тижнів",
  "Мобільність/активність",
  "Вигляд підшкірної клітковини",
  "Вигляд м'язової тканини",
  "Сироватковий альбумін",
  "Сироватковий трансферин",
  "Тривалість діалізу",
];

const OPTIONS = [
  "0 — норма",
  "1 — легкі зміни",
  "2 — помірні зміни",
  "3 — тяжкі зміни",
];

export default function MISPage() {
  const [scores, setScores] = useState<number[]>(Array(MIS_ITEMS.length).fill(0));
  const [submitted, setSubmitted] = useState(false);

  const totalScore = scores.reduce((a, b) => a + b, 0);

  function handleScore(idx: number, val: number) {
    setScores(prev => {
      const arr = [...prev];
      arr[idx] = val;
      return arr;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setScores(Array(MIS_ITEMS.length).fill(0));
    setSubmitted(false);
  }

  function interpretation(score: number) {
    if (score <= 6) return "Нормальний нутритивний статус";
    if (score <= 15) return "Легка-помірна недостатність";
    return "Тяжка недостатність/запалення";
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">MIS — Malnutrition Inflammation Score</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        {MIS_ITEMS.map((item, idx) => (
          <div key={idx} className="mb-3">
            <div className="font-semibold">{idx + 1}. {item}</div>
            <div className="flex gap-3 flex-wrap mt-1">
              {OPTIONS.map((opt, i) => (
                <label key={i} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`mis-${idx}`}
                    value={i}
                    checked={scores[idx] === i}
                    onChange={() => handleScore(idx, i)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white rounded-xl px-6 py-2 font-semibold hover:bg-blue-700 transition">
            Підрахувати бал
          </button>
          <button type="button" onClick={handleReset} className="bg-gray-200 rounded-xl px-6 py-2 hover:bg-gray-300 transition">
            Скинути
          </button>
        </div>
      </form>
      {submitted && (
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center shadow">
          <div className="text-xl font-bold mb-2">Сумарний бал MIS:</div>
          <div className="text-2xl font-mono">{totalScore} / 30</div>
          <div className="mt-2 text-gray-600 text-sm">{interpretation(totalScore)}</div>
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
