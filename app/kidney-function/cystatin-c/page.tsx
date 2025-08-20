"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function CystatinCPage() {
  const [fields, setFields] = useState({
    age: "",
    sex: "Жінка",
    cystatin: "",
    cystatinUnit: "мг/л",
  });
  const [egfr, setEgfr] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
  };

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    let cystatin = Number(fields.cystatin.replace(",", "."));
    if (fields.cystatinUnit === "мг/дл") cystatin = cystatin * 10; // 1 мг/дл = 10 мг/л
    const age = Number(fields.age);
    const female = fields.sex === "Жінка" ? 0.932 : 1;

    // Формула CKD-EPI 2012 Cystatin C
    let result = 133 * Math.pow(cystatin / 0.8, -0.499) * Math.pow(0.996, age) * female;
    result = Math.round(result * 10) / 10;
    setEgfr(result);
  };

  // Інтерпретація
  function interpret(val: number | null) {
    if (val == null || isNaN(val)) return "";
    if (val >= 90) return "Норма або І стадія";
    if (val >= 60) return "ІІ стадія";
    if (val >= 45) return "ІІІа стадія";
    if (val >= 30) return "ІІІб стадія";
    if (val >= 15) return "IV стадія";
    return "V стадія (ниркова недостатність)";
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">Cystatin C (Цистатин С) — рШКФ за CKD-EPI 2012</h2>
      <form onSubmit={handleCalc} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex gap-4">
          <label className="font-semibold">
            Вік:
            <input type="number" name="age" min={0} value={fields.age} onChange={handleChange} required className="ml-2 w-24 p-1 rounded border" />
          </label>
          <label className="font-semibold ml-4">
            Стать:
            <select name="sex" value={fields.sex} onChange={handleChange} className="ml-2 p-1 rounded border">
              <option value="Жінка">Жінка</option>
              <option value="Чоловік">Чоловік</option>
            </select>
          </label>
        </div>
        <label className="font-semibold block">
          Цистатин С:
          <input type="text" name="cystatin" value={fields.cystatin} onChange={handleChange} className="w-32 p-1 rounded border ml-2" required />
          <select name="cystatinUnit" value={fields.cystatinUnit} onChange={handleChange} className="ml-2 p-1 rounded border">
            <option value="мг/л">мг/л</option>
            <option value="мг/дл">мг/дл</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-xl px-6 py-2 font-semibold hover:bg-blue-700 transition w-full mt-4"
        >
          Розрахувати рШКФ
        </button>
      </form>
      {egfr !== null && (
        <div className="mt-8 bg-blue-50 rounded-xl p-6 shadow text-base">
          <h3 className="text-xl font-bold mb-3 text-blue-900">Результат:</h3>
          <div className="text-2xl font-mono mb-2">{egfr} мл/хв/1.73м²</div>
          <div className="text-base text-gray-700">{interpret(egfr)}</div>
        </div>
      )}
      <div className="mt-8">
        <Link href="/kidney-function" className="text-gray-600 hover:text-blue-700">
          ← Назад до функції нирок
        </Link>
      </div>
      <div className="mt-6 text-xs text-gray-400 italic text-right">
        Формула CKD-EPI 2012 (Inker LA et al., NEJM 2012).
      </div>
    </div>
  );
}
