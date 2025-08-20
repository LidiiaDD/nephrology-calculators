"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ───────── helpers ───────── */
const sanitizeDecimal = (s: string) => (s ?? "").replace(/[^\d.,-]/g, "");
const toNum = (s: string): number | null => {
  const t = (s ?? "").trim();
  if (!t) return null;
  const v = parseFloat(t.replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const inRange = (n: number | null, min: number, max: number) =>
  n != null && n >= min && n <= max;

const pill = (t: "green" | "yellow" | "orange" | "red") =>
  t === "green"
    ? "bg-green-100 text-green-900"
    : t === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : t === "orange"
    ? "bg-orange-100 text-orange-900"
    : "bg-red-100 text-red-900";

function ktvBand(x: number) {
  if (x >= 1.2) return { label: "Ціль досягнута (≥1.2)", tone: "green" as const };
  if (x >= 1.0) return { label: "Погранично (1.0–1.19)", tone: "yellow" as const };
  if (x >= 0.8) return { label: "Низька доза (0.8–0.99)", tone: "orange" as const };
  return { label: "Недостатньо (<0.8)", tone: "red" as const };
}
function urrBand(p: number) {
  if (p >= 65) return { label: "URR ≥65% (ок)", tone: "green" as const };
  if (p >= 60) return { label: "URR 60–64% (погранично)", tone: "yellow" as const };
  return { label: "URR <60% (недостатньо)", tone: "red" as const };
}

const LS_KEY = "ktv_daugirdas_v3";

/* ───────── page ───────── */
export default function KtVPage() {
  // зберігаємо РЯДКИ → поля можуть бути порожні
  const [preStr, setPreStr] = useState("");
  const [postStr, setPostStr] = useState("");
  const [tStr, setTStr] = useState("");   // тривалість (год)
  const [ufStr, setUfStr] = useState(""); // ультрафільтрація (л)
  const [wStr, setWStr] = useState("");   // маса тіла (кг)

  // відновлення/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setPreStr(v.preStr ?? "");
        setPostStr(v.postStr ?? "");
        setTStr(v.tStr ?? "");
        setUfStr(v.ufStr ?? "");
        setWStr(v.wStr ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ preStr, postStr, tStr, ufStr, wStr }));
  }, [preStr, postStr, tStr, ufStr, wStr]);

  // парсинг + валідація
  const pre = toNum(preStr);     // ммоль/л
  const post = toNum(postStr);   // ммоль/л
  const t = toNum(tStr);         // год
  const uf = toNum(ufStr);       // л
  const w = toNum(wStr);         // кг

  const preOk = inRange(pre, 1, 50);
  const postOk = inRange(post, 0.1, 50) && (pre != null ? post! < pre! : true);
  const tOk = inRange(t, 1, 8);
  const ufOk = inRange(uf, 0, 10);
  const wOk = inRange(w, 20, 250);

  const ready = preOk && postOk && tOk && ufOk && wOk;

  // розрахунки
  const R = ready ? post! / pre! : null;                // post/pre
  const lnArg = ready ? R! - 0.008 * t! : null;         // аргумент для ln
  const lnOk = lnArg != null && lnArg > 0;              // має бути >0

  const spKtv = useMemo(() => {
    if (!ready || !lnOk) return null;
    // Daugirdas II: spKt/V = -ln(R - 0.008*t) + (4 - 3.5*R) * UF/W
    const lnPart = -Math.log(lnArg!);
    const ufPart = (4 - 3.5 * R!) * (uf! / w!);
    const val = lnPart + ufPart;
    return +(val.toFixed(2));
  }, [ready, lnOk, lnArg, R, uf, w]);

  const eKtv = useMemo(() => {
    if (spKtv == null || !tOk) return null;
    // приблизна корекція до eKt/V (Tattersall): eKt/V ≈ spKt/V − 0.6·spKt/V/t + 0.03
    const val = spKtv - (0.6 * spKtv) / (t as number) + 0.03;
    return +val.toFixed(2);
  }, [spKtv, tOk, t]);

  const urr = useMemo(() => {
    if (!ready) return null;
    const p = (1 - (post! / pre!)) * 100;
    return +p.toFixed(1);
  }, [ready, pre, post]);

  // автоскрол, коли зʼявився результат
  const resRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnce = useRef(false);
  useEffect(() => {
    if (spKtv != null && !scrolledOnce.current) {
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledOnce.current = true;
    }
  }, [spKtv]);

  // прогрес-бар
  const progress = useMemo(
    () => [preStr, postStr, tStr, ufStr, wStr].filter((s) => (s ?? "").trim()).length,
    [preStr, postStr, tStr, ufStr, wStr]
  );

  const onReset = () => {
    setPreStr(""); setPostStr(""); setTStr(""); setUfStr(""); setWStr("");
    scrolledOnce.current = false;
  };

  const onCopy = async () => {
    if (spKtv == null) return;
    const parts = [
      `spKt/V ${spKtv}`,
      ...(eKtv != null ? [`eKt/V ${eKtv}`] : []),
      ...(urr != null ? [`URR ${urr}%`] : []),
    ];
    const txt = parts.join("; ");
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-2">Kt/V — адекватність гемодіалізу (Daugirdas II)</h2>
      <p className="text-gray-600 mb-4">
        Формула: <span className="font-mono">spKt/V = −ln(R − 0.008·t) + (4 − 3.5·R) · (UF/W)</span>, де R = пост/перед,
        <b> t</b> — година, <b>UF</b> — ультрафільтрація (л), <b>W</b> — маса (кг). Роздільник: «,» або «.»
      </p>

      {/* Прогрес */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено: {progress} / 5</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(progress / 5) * 100 || 0}%` }} />
        </div>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Сечовина перед діалізом (ммоль/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 20.0"
              value={preStr}
              onChange={(e) => setPreStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${preStr && !preOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Сечовина після діалізу (ммоль/л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 5.2"
              value={postStr}
              onChange={(e) => setPostStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${postStr && !postOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Тривалість сеансу (год)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 4"
              value={tStr}
              onChange={(e) => setTStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${tStr && !tOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Ультрафільтрація (л)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 2.0"
              value={ufStr}
              onChange={(e) => setUfStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${ufStr && !ufOk ? "border-red-400" : ""}`}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Маса тіла (кг)</label>
            <input
              inputMode="decimal"
              placeholder="напр., 70"
              value={wStr}
              onChange={(e) => setWStr(sanitizeDecimal(e.target.value))}
              className={`p-2 rounded-lg border w-full ${wStr && !wOk ? "border-red-400" : ""}`}
            />
          </div>
        </div>

        {/* Діагностика формули */}
        {ready && !lnOk && (
          <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            Неможливо обчислити: вираз <span className="font-mono">R − 0.008·t</span> має бути &gt; 0.
            Перевірте дані (надто мала постдіалізна сечовина або завелика тривалість).
          </div>
        )}

        {ready && lnOk && (
          <div className="text-xs text-gray-600">
            R = {R!.toFixed(3)}; аргумент ln = {(lnArg as number).toFixed(3)}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onReset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={spKtv == null}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              spKtv != null ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
            }`}
            title={spKtv != null ? "Скопіювати підсумок" : "Заповніть усі поля коректно"}
          >
            Копіювати
          </button>
        </div>
      </div>

      {/* Результат */}
      <div ref={resRef} className="mt-6" aria-live="polite">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            spKt/V:&nbsp;<span className="font-mono">{spKtv ?? "—"}</span>
          </div>

          {spKtv != null ? (
            <>
              <div className="mt-2 inline-flex items-center gap-2 text-sm">
                <span className={`px-3 py-1 rounded-full ${pill(ktvBand(spKtv).tone)}`}>{ktvBand(spKtv).label}</span>
              </div>

              <div className="mt-3 text-gray-700">
                eKt/V (приблизно): <span className="font-mono">{eKtv ?? "—"}</span>
              </div>

              <div className="mt-1 text-gray-700">
                URR:&nbsp;<span className="font-mono">{urr}%</span>{" "}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${pill(urrBand(urr!).tone)}`}>
                  {urrBand(urr!).label}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-gray-600">Заповніть усі поля для автоматичного розрахунку.</div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Примітка: пороги орієнтовні; інтерпретація залежить від частоти діалізу, розподілу сечовини, часу забору
            зразків тощо. eKt/V наведено за простою корекцією і може відрізнятися від формального моделювання.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dialysis" className="text-gray-600 hover:text-blue-700">
          ← Назад до діалізу
        </Link>
      </div>
    </div>
  );
}

