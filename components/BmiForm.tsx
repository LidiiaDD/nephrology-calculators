"use client";
import React, { useState } from "react";

export type BmiData = { height: number; weight: number; result?: number };

export function BmiForm({ onCalc }: { onCalc: (data: BmiData) => void }) {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bmi = weight / ((height / 100) ** 2);
    onCalc({ height, weight, result: +bmi.toFixed(1) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block">Зріст (см):</label>
        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block">Маса (кг):</label>
        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="border p-2 rounded w-full" />
      </div>
      <button className="bg-blue-600 text-white rounded px-4 py-2">Розрахувати</button>
    </form>
  );
}

// Інтерпретація BMI
export function interpretBMI(bmi: number) {
  if (bmi < 18.5) return "Дефіцит маси тіла";
  if (bmi < 25) return "Норма";
  if (bmi < 30) return "Надмірна вага";
  return "Ожиріння";
}
