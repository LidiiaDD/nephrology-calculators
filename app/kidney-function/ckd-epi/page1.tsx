"use client";
import React, { useState } from "react";
import Link from "next/link";

type CkdVersion = "2009" | "2021" | "2012";
type Unit = "umol" | "mgdl";
type CystatinUnit = "mg/L" | "mg/dL";

function convertToMgDl(value: number, unit: Unit) {
  return unit === "umol" ? value / 88.4 : value;
}
function convertToUmol(value: number, unit: Unit) {
  return unit === "mgdl" ? value * 88.4 : value;
}
function convertCystatinToMgL(value: number, unit: CystatinUnit) {
  return unit === "mg/dL" ? value * 10 : value;
}

function calcCkdEpi2009({ sex, age, creat, ancestry }: { sex: string; age: number; creat: number; ancestry: string; }) {
  const k = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.329 : -0.411;
  const min = Math.min(creat / k, 1);
  const max = Math.max(creat / k, 1);
  let gfr =
    141 *
    Math.pow(min, alpha) *
    Math.pow(max, -1.209) *
    Math.pow(0.993, age) *
    (sex === "female" ? 1.018 : 1) *
    (ancestry === "african" ? 1.159 : 1);
  return gfr;
}

function calcCkdEpi2021({ sex, age, creat }: { sex: string; age: number; creat: number; }) {
  const k = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.241 : -0.302;
  const min = Math.min(creat / k, 1);
  const max = Math.max(creat / k, 1);
  let gfr =
    142 *
    Math.pow(min, alpha) *
    Math.pow(max, -1.200) *
    Math.pow(0.9938, age) *
    (sex === "female" ? 1.012 : 1);
  return gfr;
}

// Формула CKD-EPI 2012 для цистатину С (mg/L)
function calcCkdEpi2012({ sex, age, cystatin }: { sex: string; age: number; cystatin: number }) {
  // https://www.kidney.org/professionals/kdoqi/gfr_calculator
  // Формула для CKD-EPI 2012 (цистатин С):
  // GFR = 133 × min(cys/0.8, 1)^-0.499 × max(cys/0.8, 1)^-1.328 × 0.996^age × (0.932, якщо жінка)
  const min = Math.min(cystatin / 0.8, 1);
  const max = Math.max(cystatin / 0.8, 1);
  let gfr =
    133 *
    Math.pow(min, -0.499) *
    Math.pow(max, -1.328) *
    Math.pow(0.996, age) *
    (sex === "female" ? 0.932 : 1);
  return gfr;
}

export default function CKDEpiPage() {
  const [version, setVersion] = useState<CkdVersion>("2021");
  const [sex, setSex] = useState("female");
  const [ancestry, setAncestry] = useState("other");
  const [age, setAge] = useState(40);

  // Креатинін
  const [unit, setUnit] = useState<Unit>("umol");
  const [creat, setCreat] = useState(80);

  // Цистатин С
  const [cystatin, setCystatin] = useState("");
  const [cystatinUnit, setCystatinUnit] = useState<CystatinUnit>("mg/L");

  const [gfr, setGfr] = useState<number | null>(null);

  // Конвертуємо креатинін до мг/дл для формули
  const creatForCalc = convertToMgDl(creat, unit);

  function handleCalc(e: React.FormEvent) {
    e.preventDefault();
    let res: number | undefined;
    if (version === "2012") {
      const cystatinMgL = convertCystatinToMgL(Number(cystatin), cystatinUnit);
      res = calcCkdEpi2012({
        sex,
        age,
        cystatin: cystatinMgL,
      });
    } else if (version === "2021") {
      res = calcCkdEpi2021({
        sex,
        age,
        creat: creatForCalc,
      });
    } else {
      res = calcCkdEpi2009({
        sex,
        age,
        creat: creatForCalc,
        ancestry,
      });
    }
    setGfr(res !== undefined ? Number(res.toFixed(1)) : null);
  }

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newUnit = e.target.value as Unit;
    if (unit !== newUnit) {
      if (newUnit === "mgdl") setCreat(Number((creat / 88.4).toFixed(2)));
      else setCreat(Number((creat * 88.4).toFixed(0)));
      setUnit(newUnit);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">Калькулятор CKD-EPI</h2>
      <form onSubmit={handleCalc} className="space-y-4 bg-white rounded-xl shadow-lg p-6">
        <div>
          <label className="block mb-1 font-semibold">Виберіть формулу:</label>
          <select value={version} onChange={e => setVersion(e.target.value as CkdVersion)} className="p-2 rounded-lg border w-full">
            <option value="2021">CKD-EPI 2021 (креатинін, без поправки на походження)</option>
            <option value="2009">CKD-EPI 2009 (креатинін, з поправкою на африканське походження)</option>
            <option value="2012">CKD-EPI 2012 (цистатин С)</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Стать:</label>
          <select value={sex} onChange={e => setSex(e.target.value)} className="p-2 rounded-lg border w-full">
            <option value="female">Жіноча</option>
            <option value="male">Чоловіча</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Вік (років):</label>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            className="p-2 rounded-lg border w-full"
            required
          />
        </div>

        {/* Поля для креатиніну або цистатину */}
        {(version === "2009" || version === "2021") && (
          <div>
            <label className="block mb-1 font-semibold">Креатинін:</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={unit === "umol" ? 10 : 0.1}
                max={unit === "umol" ? 2000 : 20}
                value={creat}
                onChange={e => setCreat(Number(e.target.value))}
                className="p-2 rounded-lg border w-full"
                required
              />
              <select value={unit} onChange={handleUnitChange} className="p-2 rounded-lg border">
                <option value="umol">мкмоль/л</option>
                <option value="mgdl">мг/дл</option>
              </select>
            </div>
          </div>
        )}

        {version === "2012" && (
          <div>
            <label className="block mb-1 font-semibold">Цистатин С:</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.01}
                value={cystatin}
                onChange={e => setCystatin(e.target.value)}
                className="p-2 rounded-lg border w-full"
                required
              />
              <select value={cystatinUnit} onChange={e => setCystatinUnit(e.target.value as CystatinUnit)} className="p-2 rounded-lg border">
                <option value="mg/L">мг/л</option>
                <option value="mg/dL">мг/дл</option>
              </select>
            </div>
          </div>
        )}

        {version === "2009" && (
          <div>
            <label className="block mb-1 font-semibold">Походження:</label>
            <select value={ancestry} onChange={e => setAncestry(e.target.value)} className="p-2 rounded-lg border w-full">
              <option value="other">Інше</option>
              <option value="african">Африканського походження</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              * У формулі CKD-EPI (2009) використовується поправка для пацієнтів африканського походження. У версії 2021 ця поправка не застосовується.
            </p>
          </div>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2 font-semibold hover:bg-blue-700 transition">
          Розрахувати
        </button>
      </form>
      {gfr !== null && (
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center shadow">
          <div className="text-xl font-bold mb-2">Результат:</div>
          <div className="text-2xl">
            ШКФ = <span className="font-mono">{gfr}</span> мл/хв/1.73м²
          </div>
        </div>
      )}
      <div className="mt-8">
        <Link href="/kidney-function" className="text-gray-600 hover:text-blue-700">
          ← Назад до функції нирок
        </Link>
      </div>
    </div>
  );
}



