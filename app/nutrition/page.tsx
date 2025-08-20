"use client";

import Link from "next/link";

export default function NutritionPage() {
  const cards = [
    {
      href: "/nutrition/mna",
      title: "MNA — Mini Nutritional Assessment",
      badge: "Скринінг",
      desc: "Коротка MNA-SF і повна MNA-18 для оцінки нутритивного ризику.",
      icon: "🧪",
      tint: "from-emerald-50 to-white",
    },
    {
      href: "/nutrition/sga",
      title: "SGA — Subjective Global Assessment",
      badge: "Клінічна оцінка",
      desc: "Суб’єктивна комплексна оцінка харчового статусу.",
      icon: "🩺",
      tint: "from-cyan-50 to-white",
    },
    {
      href: "/nutrition/nri",
      title: "NRI — Nutritional Risk Index",
      badge: "Індекс",
      desc: "Альбумін + маса тіла: індекс нутритивного ризику.",
      icon: "📉",
      tint: "from-sky-50 to-white",
    },
    {
      href: "/nutrition/conut",
      title: "CONUT — Controlling Nutritional Status",
      badge: "Індекс",
      desc: "Альбумін, холестерин, лімфоцити — сумарний бал ризику.",
      icon: "📊",
      tint: "from-indigo-50 to-white",
    },
    {
      href: "/nutrition/anthropometry",
      title: "Антропометричні розрахунки",
      badge: "Розрахунки",
      desc: "ІМТ, інтерпретації за віком/статтю, динаміка маси, нутритивні індикатори.",
      icon: "📏",
      tint: "from-amber-50 to-white",
    },
    {
      href: "/nutrition/biochemistry",
      title: "Біохімічні показники",
      badge: "Лабораторія",
      desc: "Альбумін, преальбумін, трансферин та інші маркери харчового статусу.",
      icon: "🧬",
      tint: "from-rose-50 to-white",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Хедер + breadcrumbs */}
      <header className="mx-auto w-full max-w-6xl px-6 pt-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            Головна
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700 font-medium">Нутритивний статус</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Нутритивний статус
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Оберіть інструмент для скринінгу, індексів та розрахунків харчового статусу.
        </p>
      </header>

      {/* Карти-навігатори */}
      <main className="mx-auto w-full max-w-6xl px-6 pb-14 pt-6">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group rounded-2xl border bg-gradient-to-br ${c.tint} p-5 transition-shadow hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  <span className="text-xl" aria-hidden>
                    {c.icon}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-900/10">
                      {c.badge}
                    </span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">
                    {c.title}
                  </h2>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{c.desc}</p>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                    Відкрити
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Підказки щодо введення */}
        <section className="mt-10 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Підказки щодо введення</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Використовуйте коректні одиниці вимірювання (ммоль/л, г/л, кг, см тощо).</li>
            <li>
              MNA-SF — швидкий скринінг; при ризику переходьте до повної MNA-18 або SGA.
            </li>
            <li>
              Для індексів (NRI, CONUT) потрібні актуальні лабораторні дані та антропометрія.
            </li>
            <li>Результати слугують довідковою інформацією та не замінюють консультацію лікаря.</li>
          </ul>
        </section>

        {/* Навігація */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <span aria-hidden>←</span> На головну
          </Link>
        </div>
      </main>
    </div>
  );
}
