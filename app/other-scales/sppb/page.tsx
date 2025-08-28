"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/**
 * SPPB — Short Physical Performance Battery (0–12)
 * Рівновага (side/semi/tandem, до 10 с), ходьба 4 м (м/с), підйом зі стільця (5 разів).
 * Поля спочатку порожні. Десятковий роздільник — «,» або «.».
 */

type Balance = { side: string; semi: string; tandem: string; unable: boolean };
type Gait = { distance: string; time: string; unable: boolean };
type Chair = { time: string; unable: boolean };

function toNum(s: string): number | null {
  if (!s.trim()) return null;
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

function badgeColor(score: number | null) {
  if (score === null) return "bg-gray-200 text-gray-700";
  if (score >= 4) return "bg-green-100 text-green-800";
  if (score >= 2) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function interpTotal(t: number) {
  if (t >= 10) return { text: "Добра фізична функція", cls: "bg-green-100 text-green-800" };
  if (t >= 7) return { text: "Легкі/помірні порушення", cls: "bg-yellow-100 text-yellow-800" };
  if (t >= 4) return { text: "Помірні порушення", cls: "bg-orange-100 text-orange-800" };
  return { text: "Виражені порушення", cls: "bg-red-100 text-red-800" };
}

export default function Page() {
  const [balance, setBalance] = useState<Balance>({
    side: "",
    semi: "",
    tandem: "",
    unable: false,
  });
  const [gait, setGait] = useState<Gait>({ distance: "4", time: "", unable: false });
  const [chair, setChair] = useState<Chair>({ time: "", unable: false });

  // Рівновага → 0–4 (або null)
  const balanceScore = useMemo<number | null>(() => {
    if (balance.unable) return 0;
    const side = toNum(balance.side);
    const semi = toNum(balance.semi);
    const tandem = toNum(balance.tandem);
    if (side === null || semi === null || tandem === null) return null;

    if (side < 10) return 0;
    if (semi < 10) return 1;
    if (tandem < 3) return 2;
    if (tandem < 10) return 3;
    return 4;
  }, [balance]);

  // Ходьба → 0–4 (або null)
  const gaitScore = useMemo<number | null>(() => {
    if (gait.unable) return 0;
    const dist = toNum(gait.distance);
    const time = toNum(gait.time);
    if (dist === null || time === null || time <= 0) return null;

    const speed = dist / time; // м/с
    if (speed < 0.4) return 1;
    if (speed < 0.6) return 2;
    if (speed < 0.8) return 3;
    return 4;
  }, [gait]);

  // Стілець → 0–4 (або null)
  const chairScore = useMemo<number | null>(() => {
    if (chair.unable) return 0;
    const t = toNum(chair.time);
    if (t === null || t <= 0) return null;

    if (t <= 11.19) return 4;
    if (t < 13.70) return 3;
    if (t < 16.70) return 2;
    return 1;
  }, [chair]);

  const partials: Array<number | null> = [balanceScore, gaitScore, chairScore];
  const completed = partials.filter((s) => s !== null).length;

  // ✅ Явний тип акумулятора — number
  const total = partials.reduce<number>((acc, v) => acc + (v ?? 0), 0);

  const done = completed === partials.length;

  async function copyToClipboard() {
    const lines: string[] = [
      "SPPB (Short Physical Performance Battery)",
      `Рівновага: ${balanceScore ?? "—"} / 4`,
      `Ходьба 4 м: ${gaitScore ?? "—"} / 4`,
      `Підйом зі стільця (5 разів): ${chairScore ?? "—"} / 4`,
      `Сума: ${done ? total : "—"} / 12`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      alert("Скопійовано в буфер обміну.");
    } catch {
      alert("Не вдалося скопіювати.");
    }
  }

  function resetAll() {
    setBalance({ side: "", semi: "", tandem: "", unable: false });
    setGait({ distance: "4", time: "", unable: false });
    setChair({ time: "", unable: false });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">SPPB — коротка батарея фізичної працездатності</h1>
      <p className="mb-6 text-gray-600">
        Поля спочатку порожні. Десятковий роздільник — «,» або «.».
        Порогові значення відповідають поширеним протоколам SPPB; у вашому центрі вони можуть відрізнятися.
      </p>

      {/* Головний прогрес */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${(completed / partials.length) * 100}%` }}
          />
        </div>
        <div className="min-w-[90px] text-sm text-gray-600">
          Заповнено: {completed} / {partials.length}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ФОРМА */}
        <div className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm">
          {/* Рівновага */}
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold">1) Рівновага (утримання позицій, сек до 10)</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badgeColor(balanceScore)}`}>
                {balanceScore === null ? "незаповнено" : `${balanceScore} / 4`}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm text-gray-600">Side-by-side (ноги разом)</label>
                <input
                  inputMode="decimal"
                  placeholder="сек"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                    balanceScore === null && !balance.unable && balance.side === ""
                      ? "border-rose-300 ring-rose-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={balance.side}
                  onChange={(e) => setBalance((s) => ({ ...s, side: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Semi-tandem (п'ятка біля носка)</label>
                <input
                  inputMode="decimal"
                  placeholder="сек"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                    balanceScore === null && !balance.unable && balance.semi === ""
                      ? "border-rose-300 ring-rose-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={balance.semi}
                  onChange={(e) => setBalance((s) => ({ ...s, semi: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tandem (п'ятка до носка)</label>
                <input
                  inputMode="decimal"
                  placeholder="сек"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                    balanceScore === null && !balance.unable && balance.tandem === ""
                      ? "border-rose-300 ring-rose-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={balance.tandem}
                  onChange={(e) => setBalance((s) => ({ ...s, tandem: e.target.value }))}
                />
              </div>
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={balance.unable}
                onChange={(e) => setBalance((s) => ({ ...s, unable: e.target.checked }))}
              />
              Не може виконати тест на рівновагу
            </label>
          </section>

          {/* Ходьба */}
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold">2) Ходьба (4 метри)</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badgeColor(gaitScore)}`}>
                {gaitScore === null ? "незаповнено" : `${gaitScore} / 4`}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm text-gray-600">Дистанція, м</label>
                <input
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  value={gait.distance}
                  onChange={(e) => setGait((s) => ({ ...s, distance: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Час проходження, сек</label>
                <input
                  inputMode="decimal"
                  placeholder="сек"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                    gaitScore === null && !gait.unable && gait.time === ""
                      ? "border-rose-300 ring-rose-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={gait.time}
                  onChange={(e) => setGait((s) => ({ ...s, time: e.target.value }))}
                />
              </div>
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={gait.unable}
                onChange={(e) => setGait((s) => ({ ...s, unable: e.target.checked }))}
              />
              Не може самостійно пройти дистанцію
            </label>
          </section>

          {/* Підйом зі стільця */}
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold">3) Підйом зі стільця — 5 разів</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badgeColor(chairScore)}`}>
                {chairScore === null ? "незаповнено" : `${chairScore} / 4`}
              </span>
            </div>

            <div className="mt-2">
              <label className="text-sm text-gray-600">Час виконання, сек</label>
              <input
                inputMode="decimal"
                placeholder="сек"
                className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                  chairScore === null && !chair.unable && chair.time === ""
                    ? "border-rose-300 ring-rose-200"
                    : "border-gray-300 focus:ring-blue-200"
                }`}
                value={chair.time}
                onChange={(e) => setChair((s) => ({ ...s, time: e.target.value }))}
              />
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chair.unable}
                onChange={(e) => setChair((s) => ({ ...s, unable: e.target.checked }))}
              />
              Не може виконати підйом 5 разів без допомоги рук
            </label>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={copyToClipboard}
              type="button"
              className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Копіювати результат
            </button>
            <button
              onClick={resetAll}
              type="button"
              className="rounded-xl bg-gray-200 px-5 py-2 hover:bg-gray-300"
            >
              Скинути
            </button>
          </div>
        </div>

        {/* РЕЗУЛЬТАТ */}
        <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Результат</h2>

          <div className="grid gap-3">
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-sm text-gray-600">Рівновага</div>
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-2 py-0.5 text-sm ${badgeColor(balanceScore)}`}>
                  {balanceScore === null ? "незаповнено" : `${balanceScore} / 4`}
                </div>
                <div className="text-xs text-gray-500">
                  side: {balance.side || "—"} c, semi: {balance.semi || "—"} c, tandem:{" "}
                  {balance.tandem || "—"} c
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-1 text-sm text-gray-600">Ходьба 4 м</div>
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-2 py-0.5 text-sm ${badgeColor(gaitScore)}`}>
                  {gaitScore === null ? "незаповнено" : `${gaitScore} / 4`}
                </div>
                <div className="text-xs text-gray-500">
                  дистанція: {gait.distance || "—"} м, час: {gait.time || "—"} c
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-1 text-sm text-gray-600">Підйом зі стільця</div>
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-2 py-0.5 text-sm ${badgeColor(chairScore)}`}>
                  {chairScore === null ? "незаповнено" : `${chairScore} / 4`}
                </div>
                <div className="text-xs text-gray-500">час: {chair.time || "—"} c</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-1 text-sm text-gray-600">Сумарний бал</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-mono">{done ? total : "—"} / 12</div>
              {done && (
                <span className={`rounded-full px-2 py-1 text-sm ${interpTotal(total).cls}`}>
                  {interpTotal(total).text}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2">
            <div className="mb-1 text-sm text-gray-600">
              Заповнено: {completed} / {partials.length}
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${(completed / partials.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-amber-50 p-3 text-sm text-amber-900">
            Результат є довідковим і не замінює консультацію лікаря. Для клінічних рішень
            користуйтеся офіційним протоколом вашого закладу.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/other-scales" className="text-gray-600 hover:text-blue-700">
          ← Назад до інших шкал
        </Link>
      </div>
    </div>
  );
}
