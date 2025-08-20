"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ===== utils =====
const dec = (s: string) =>
  Number(String(s ?? "").trim().replace(",", ".").replace(/\s+/g, "")) || 0;
const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);

type Mode = "sf" | "full";
type Choice = { label: string; points: number };
type Q = { id: string; label: string; choices: Choice[]; required?: boolean };

// базові питання (без ІМТ/MAC/CC — ними керуємо окремо)
const BASE_SF: Q[] = [
  {
    id: "q1",
    label: "1. Зменшення прийому їжі за останні 3 місяці",
    choices: [
      { label: "Суттєве зменшення", points: 0 },
      { label: "Помірне зменшення", points: 1 },
      { label: "Без змін", points: 2 },
    ],
    required: true,
  },
  {
    id: "q2",
    label: "2. Втрата ваги за останні 3 місяці",
    choices: [
      { label: "> 3 кг", points: 0 },
      { label: "1–3 кг", points: 1 },
      { label: "Без втрати", points: 2 },
    ],
    required: true,
  },
  {
    id: "q3",
    label: "3. Мобільність",
    choices: [
      { label: "Прикутий до ліжка/крісло", points: 0 },
      { label: "Може вставати з ліжка", points: 1 },
      { label: "Повністю мобільний", points: 2 },
    ],
    required: true,
  },
  {
    id: "q4",
    label: "4. Психічний стрес або гостра хвороба останні 3 міс.",
    choices: [
      { label: "Так", points: 0 },
      { label: "Ні", points: 2 },
    ],
    required: true,
  },
  {
    id: "q5",
    label: "5. Нейропсихічний статус",
    choices: [
      { label: "Тяжкі порушення", points: 0 },
      { label: "Легкі порушення", points: 1 },
      { label: "Немає", points: 2 },
    ],
    required: true,
  },
];

const EXTRA_FULL: Q[] = [
  { id: "q7", label: "7. Живе самостійно", choices: [{ label: "Ні", points: 0 }, { label: "Так", points: 1 }], required: true },
  { id: "q8", label: "8. > 3 препаратів на день", choices: [{ label: "Так", points: 0 }, { label: "Ні", points: 1 }], required: true },
  { id: "q9", label: "9. Рани / виразки на шкірі", choices: [{ label: "Так", points: 0 }, { label: "Ні", points: 1 }], required: true },
  { id: "q10", label: "10. Кількість основних прийомів їжі", choices: [{ label: "Один", points: 0 }, { label: "Два", points: 1 }, { label: "Три і більше", points: 2 }], required: true },
  { id: "q11", label: "11. Білкові продукти (мʼясо, молочне, бобові)", choices: [{ label: "Менше 1 разу/день", points: 0 }, { label: "1 раз/день", points: 1 }, { label: "≥ 2 разів/день", points: 2 }], required: true },
  { id: "q12", label: "12. Фрукти / овочі щодня", choices: [{ label: "Ні", points: 0 }, { label: "Так", points: 1 }], required: true },
  { id: "q13", label: "13. Скільки склянок рідини на добу?", choices: [{ label: "< 3", points: 0 }, { label: "3–5", points: 1 }, { label: "> 5", points: 2 }], required: true },
  { id: "q14", label: "14. Самостійність під час їжі", choices: [{ label: "Повна залежність", points: 0 }, { label: "Потребує допомоги", points: 1 }, { label: "Без допомоги", points: 2 }], required: true },
  { id: "q15", label: "15. Здоровʼя vs однолітки", choices: [{ label: "Гірше", points: 0 }, { label: "Не знаю", points: 0.5 }, { label: "Так само", points: 1 }, { label: "Краще", points: 2 }], required: true },
  { id: "q16", label: "16. Самооцінка харчового статусу", choices: [{ label: "Поганий", points: 0 }, { label: "Не впевнений", points: 1 }, { label: "Задовільний", points: 2 }], required: true },
];

// Інтерпретації
const interpSF = (score: number) =>
  score >= 12
    ? { title: "Нормальний нутритивний статус", color: "green" as const }
    : score >= 8
    ? { title: "Ризик недостатності харчування", color: "yellow" as const }
    : { title: "Недостатність харчування", color: "red" as const };

const interpFull = (score: number) =>
  score >= 24
    ? { title: "Нормальний нутритивний статус", color: "green" as const }
    : score >= 17
    ? { title: "Ризик недостатності харчування", color: "yellow" as const }
    : { title: "Недостатність харчування", color: "red" as const };

// Клас для «пігулки»
const pill = (c: "green" | "yellow" | "red") =>
  c === "green"
    ? "bg-green-100 text-green-900"
    : c === "yellow"
    ? "bg-yellow-100 text-yellow-900"
    : "bg-red-100 text-red-900";

// ===== component =====
type Answers = Record<string, number | null>;

const MNA_PAGE_LS = "mna_v2_state";

export default function MNAEnhanced() {
  const [mode, setMode] = useState<Mode>("sf");

  // окремі числові поля для авто-нарахувань
  const [height, setHeight] = useState<string>(""); // см
  const [weight, setWeight] = useState<string>(""); // кг
  const bmi = useMemo(() => {
    const h = dec(height) / 100;
    const w = dec(weight);
    return h > 0 ? w / (h * h) : 0;
  }, [height, weight]);

  const bmiChoice: Choice[] = [
    { label: "< 19", points: 0 },
    { label: "19–21", points: 1 },
    { label: "21–23", points: 2 },
    { label: "≥ 23", points: 3 },
  ];

  // для повної MNA: MAC/CC
  const [mac, setMac] = useState<string>(""); // см
  const [cc, setCc] = useState<string>(""); // см

  // відповіді
  const baseQs = BASE_SF;
  const fullQs = [...BASE_SF, ...EXTRA_FULL];
  const questions: Q[] = mode === "sf" ? baseQs : fullQs;

  const [answers, setAnswers] = useState<Answers>({});

  // авто-підбір балів за ІМТ
  const bmiPoints = useMemo(() => {
    if (!bmi || bmi <= 0) return null;
    if (bmi < 19) return 0;
    if (bmi < 21) return 1;
    if (bmi < 23) return 2;
    return 3;
  }, [bmi]);

  // авто-бали для MAC/CC у повній MNA
  const macPts = useMemo(() => {
    const v = dec(mac);
    if (!v) return null;
    if (v < 21) return 0;
    if (v < 22) return 0.5;
    return 1;
  }, [mac]);

  const ccPts = useMemo(() => {
    const v = dec(cc);
    if (!v) return null;
    return v < 31 ? 0 : 1;
  }, [cc]);

  // завантаження/збереження
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MNA_PAGE_LS);
      if (raw) {
        const s = JSON.parse(raw);
        setMode(s.mode ?? "sf");
        setAnswers(s.answers ?? {});
        setHeight(s.height ?? "");
        setWeight(s.weight ?? "");
        setMac(s.mac ?? "");
        setCc(s.cc ?? "");
      }
    } catch {}
  }, []);
  useEffect(() => {
    const payload = { mode, answers, height, weight, mac, cc };
    localStorage.setItem(MNA_PAGE_LS, JSON.stringify(payload));
  }, [mode, answers, height, weight, mac, cc]);

  const setAns = (id: string, idx: number) =>
    setAnswers((p) => ({ ...p, [id]: idx }));

  // підрахунок
  const baseScore = useMemo(() => {
    return questions.reduce((sum, q) => {
      const idx = answers[q.id];
      if (idx == null) return sum;
      return sum + (q.choices[idx]?.points ?? 0);
    }, 0);
  }, [questions, answers]);

  // додаємо авто-частини
  const totalScore = useMemo(() => {
    let add = 0;
    // ІМТ — це 6-й пункт SF (макс 3 бали)
    add += bmiPoints ?? 0;
    if (mode === "full") {
      // у повній MNA ще MAC (1 бал) і CC (1 бал)
      add += macPts ?? 0;
      add += ccPts ?? 0;
    }
    return +(baseScore + add).toFixed(1);
  }, [baseScore, bmiPoints, macPts, ccPts, mode]);

  const maxScore = mode === "sf" ? 14 : 30;
  const interp = mode === "sf" ? interpSF(totalScore) : interpFull(totalScore);

  // валідація / прогрес
  const requiredIds = (mode === "sf" ? baseQs : fullQs)
    .filter((q) => q.required)
    .map((q) => q.id);

  const answeredRequired = requiredIds.filter((id) => answers[id] != null).length;
  const allAnswered = answeredRequired === requiredIds.length;

  // копіювання
  const copy = async () => {
    const txt = `MNA-${mode === "sf" ? "SF" : "Full"}: ${totalScore}/${maxScore} — ${interp.title}`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Скопійовано у буфер обміну.");
    } catch {
      alert(txt);
    }
  };

  const reset = () => {
    setAnswers({});
    setHeight("");
    setWeight("");
    setMac("");
    setCc("");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-2">Mini Nutritional Assessment</h1>
      <p className="text-gray-600 mb-4">
        Оберіть коротку версію (MNA-SF) або повну (18 пунктів). Для зручності можна ввести зріст/вагу — ІМТ та бали
        нарахуються автоматично. Десятковий роздільник — «,» або «.»
      </p>

      {/* режим */}
      <div className="inline-flex rounded-xl overflow-hidden mb-4 shadow">
        <button
          onClick={() => setMode("sf")}
          className={`px-4 py-2 font-medium ${mode === "sf" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          MNA-SF (6)
        </button>
        <button
          onClick={() => setMode("full")}
          className={`px-4 py-2 font-medium ${mode === "full" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          Повна MNA (18)
        </button>
      </div>

      {/* прогрес */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Заповнено обовʼязкових: {answeredRequired} / {requiredIds.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(answeredRequired / requiredIds.length) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* авто-розрахунки */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 bg-white rounded-xl p-4 shadow">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Зріст, см</label>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            inputMode="decimal"
            placeholder="наприклад, 165"
            className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Вага, кг</label>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            placeholder="наприклад, 62.5"
            className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ІМТ (авто)</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={bmi ? bmi.toFixed(1) : ""}
              placeholder="—"
              className="w-full border bg-gray-50 rounded-xl px-3 py-2"
            />
            <span
              className={`text-xs px-2 py-1 rounded-full ${bmiPoints == null ? "bg-gray-100 text-gray-500" : pill(bmiPoints >= 3 ? "green" : bmiPoints >= 1 ? "yellow" : "red")}`}
              title="Автоматичні бали за пункт 6 (ІМТ)"
            >
              {bmiPoints == null ? "—" : `${bmiPoints} б.`}
            </span>
          </div>
        </div>

        {mode === "full" && (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">MAC — окружність передпліччя, см</label>
              <input
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                inputMode="decimal"
                placeholder="наприклад, 23"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">Бали: {macPts == null ? "—" : macPts}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">CC — окружність гомілки, см</label>
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                inputMode="decimal"
                placeholder="наприклад, 31.5"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">Бали: {ccPts == null ? "—" : ccPts}</div>
            </div>
          </>
        )}
      </div>

      {/* форма питань */}
      <form className="bg-white rounded-xl p-4 md:p-6 shadow space-y-5">
        {questions.map((q) => {
          const sel = answers[q.id];
          const isMissing = q.required && sel == null;
          return (
            <div key={q.id} className={isMissing ? "border-l-4 border-red-400 pl-3" : ""}>
              <div className="font-medium mb-2">{q.label}</div>
              <div className="flex flex-wrap gap-3">
                {q.choices.map((c, i) => (
                  <label key={i} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name={q.id}
                      checked={sel === i}
                      onChange={() => setAns(q.id, i)}
                    />
                    <span className="text-sm">{c.label}</span>
                    <span className="text-xs text-gray-500">({c.points} б.)</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* довідка для пункту 6 (ІМТ) — на випадок ручного введення */}
        <div className="text-xs text-gray-500 -mt-3">
          Пункт 6 (ІМТ): {bmiChoice.map((c) => c.label).join(" / ")} → 0/1/2/3 бали.
          Якщо введено зріст та вагу — бали за цей пункт виставляються автоматично.
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={copy}
            disabled={!allAnswered}
            className={`rounded-xl px-5 py-2 font-semibold transition ${
              allAnswered ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500"
            }`}
            title={allAnswered ? "Скопіювати підсумок" : "Заповніть усі обовʼязкові пункти"}
          >
            Копіювати результат
          </button>
          <button type="button" onClick={reset} className="rounded-xl px-5 py-2 bg-gray-100 hover:bg-gray-200">
            Скинути форму
          </button>
        </div>
      </form>

      {/* результат */}
      <div className="mt-6">
        <div className="rounded-2xl border shadow bg-white p-4 md:p-6">
          <div className="text-lg md:text-xl font-bold">
            Підсумок: <span className="font-mono">{totalScore}</span> / {maxScore}
          </div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${pill(interp.color)}`}>{interp.title}</span>
            <span className="text-gray-500">({mode === "sf" ? "MNA-SF" : "Повна MNA"})</span>
          </div>
          {!allAnswered && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              Заповніть усі обовʼязкові пункти для коректної інтерпретації.
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500">
            Результат має довідковий характер і не замінює консультацію лікаря.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/nutrition" className="text-gray-600 hover:text-blue-700">
          ← Назад до нутритивних шкал
        </Link>
      </div>
    </div>
  );
}
