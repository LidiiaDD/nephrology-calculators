"use client";
import React, { useState } from "react";
import Link from "next/link";

// Додаткові функції
function parseBiomarker(value: string) {
  if (!value || ["-", "н/д", "N/A", "н.д.", "none", "nd"].includes(value.trim().toLowerCase())) {
    return null;
  }
  const num = Number(value.replace(",", "."));
  return isNaN(num) ? null : num;
}

// Оцінки для кожного біомаркера
function interpretLFABP(val: number | null) {
  if (val == null) return "";
  if (val < 8) return "Норма";
  if (val < 30) return "Помірне підвищення (ризик пошкодження нирок)";
  return "Високе підвищення (гостре ураження нирок)";
}
function interpretNGAL(val: number | null) {
  if (val == null) return "";
  if (val < 150) return "Норма";
  if (val < 300) return "Підвищення (ризик гострого ураження нирок)";
  return "Високе підвищення (AKI, тяжкий перебіг)";
}
function interpretKIM1(val: number | null) {
  if (val == null) return "";
  if (val < 2.0) return "Норма";
  if (val < 5.0) return "Підвищення (ураження канальців)";
  return "Високе підвищення (AKI, виражене ураження)";
}

export default function TubularMarkersPanel() {
  const [fields, setFields] = useState({
    lfabp: "",
    ngal: "",
    kim1: "",
  });
  const [results, setResults] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    const lfabp = parseBiomarker(fields.lfabp);
    const ngal = parseBiomarker(fields.ngal);
    const kim1 = parseBiomarker(fields.kim1);

    setResults({
      lfabp,
      lfabpText: interpretLFABP(lfabp),
      ngal,
      ngalText: interpretNGAL(ngal),
      kim1,
      kim1Text: interpretKIM1(kim1),
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">Тубулярні маркери — L-FABP, NGAL, KIM-1</h2>
      <form onSubmit={handleCalc} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="text-gray-700 mb-3 text-sm">
          <span className="font-semibold">Увага:</span> Поле можна залишити порожнім або ввести «-», якщо аналіз не проводився
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* L-FABP */}
          <label>
            <span className="font-semibold">L-FABP (нг/мл):</span>
            <input
              type="text"
              name="lfabp"
              value={fields.lfabp}
              onChange={handleChange}
              className="w-full p-2 rounded border mt-1"
              placeholder="Напр. 10 або -"
            />
          </label>
          {/* NGAL */}
          <label>
            <span className="font-semibold">NGAL (нг/мл, сироватка/сеча):</span>
            <input
              type="text"
              name="ngal"
              value={fields.ngal}
              onChange={handleChange}
              className="w-full p-2 rounded border mt-1"
              placeholder="Напр. 120 або -"
            />
          </label>
          {/* KIM-1 */}
          <label>
            <span className="font-semibold">KIM-1 (нг/мл):</span>
            <input
              type="text"
              name="kim1"
              value={fields.kim1}
              onChange={handleChange}
              className="w-full p-2 rounded border mt-1"
              placeholder="Напр. 2 або -"
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-xl px-6 py-2 font-semibold hover:bg-blue-700 transition w-full mt-4"
        >
          Розрахувати
        </button>
      </form>
      {/* Вивід результатів */}
      {results && (
        <div className="mt-8 bg-blue-50 rounded-xl p-6 shadow text-base">
          <h3 className="text-xl font-bold mb-3 text-blue-900">Результати маркерів:</h3>
          <table className="w-full text-left">
            <tbody>
              {results.lfabp !== null && (
                <tr>
                  <td className="py-1 pr-4 font-semibold">L-FABP</td>
                  <td>{results.lfabp} нг/мл</td>
                  <td>{results.lfabpText}</td>
                </tr>
              )}
              {results.ngal !== null && (
                <tr>
                  <td className="py-1 pr-4 font-semibold">NGAL</td>
                  <td>{results.ngal} нг/мл</td>
                  <td>{results.ngalText}</td>
                </tr>
              )}
              {results.kim1 !== null && (
                <tr>
                  <td className="py-1 pr-4 font-semibold">KIM-1</td>
                  <td>{results.kim1} нг/мл</td>
                  <td>{results.kim1Text}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8">
        <Link href="/biomarkers" className="text-gray-600 hover:text-blue-700">
          ← Назад до біомаркерів
        </Link>
      </div>
    </div>
  );
}