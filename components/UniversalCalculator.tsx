"use client";
import React, { useState } from "react";

type UniversalCalculatorProps<T extends { result?: number }> = {
  label: string;
  description?: string;
  FormComponent: React.ComponentType<{ onCalc: (data: T) => void }>;
  interpretFn?: (result: number, data: T) => string;
  guidelineUrl?: string;
  guidelineLabel?: string;
};

export default function UniversalCalculator<T extends { result?: number }>({
  label,
  description,
  FormComponent,
  interpretFn,
  guidelineUrl,
  guidelineLabel,
}: UniversalCalculatorProps<T>) {
  const [result, setResult] = useState<number | null>(null);
  const [inputData, setInputData] = useState<T | null>(null);

  function handleExport() {
    if (result === null || !inputData) return;
    const resText = `${label}\n\nДані: ${JSON.stringify(inputData, null, 2)}\n\nРезультат: ${result}\n${
      interpretFn ? "Інтерпретація: " + interpretFn(result, inputData) : ""
    }`;
    navigator.clipboard.writeText(resText);
    alert("Результат скопійовано у clipboard!");
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-3">{label}</h2>
      {description && <p className="mb-4 text-gray-600">{description}</p>}
      <FormComponent
        onCalc={(data: T) => {
          setInputData(data);
          setResult(data.result ?? null);
        }}
      />
      {result !== null && (
        <div className="mt-8 bg-blue-50 rounded-xl p-4 shadow text-base">
          <div className="text-xl font-semibold mb-1">Результат: <span className="font-mono">{result}</span></div>
          {interpretFn && inputData && (
            <div className="mt-2">
              <b>Інтерпретація:</b> {interpretFn(result, inputData)}
            </div>
          )}
          <button
            onClick={handleExport}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Скопіювати результат
          </button>
        </div>
      )}
      {guidelineUrl && (
        <div className="mt-6 text-xs text-gray-500">
          Джерело:{" "}
          <a href={guidelineUrl} target="_blank" className="text-blue-700 underline">
            {guidelineLabel || guidelineUrl}
          </a>
        </div>
      )}
    </div>
  );
}

