// app/mental/page.tsx
"use client";

import Link from "next/link";

type Item = {
  href: string;
  title: string;
  desc: string;
  badge: string;
  emoji: string;
};

const ITEMS: Item[] = [
  {
    href: "/mental/bdi",
    title: "BDI — Beck Depression Inventory",
    desc: "Самозвітна шкала депресії: 21 пункт, стратифікація за сумою балів.",
    badge: "Депресія",
    emoji: "🧠",
  },
  {
    href: "/mental/hads",
    title: "HADS — Hospital Anxiety and Depression Scale",
    desc: "Дві підшкали (HADS-A / HADS-D): тривога та депресія у соматичних пацієнтів.",
    badge: "Тривога/Депресія",
    emoji: "🙂",
  },
  {
    href: "/mental/gad7",
    title: "GAD-7 — Генералізований тривожний розлад",
    desc: "Скринінг і градація тяжкості тривоги за 7 пунктами.",
    badge: "Тривога",
    emoji: "😬",
  },
];

export default function MentalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      {/* Header + breadcrumbs */}
      <header className="mx-auto w-full max-w-6xl px-6 pt-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            Головна
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-700">Психоемоційний стан</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Психоемоційний стан
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Оберіть інструмент для скринінгу тривоги/депресії. Усі калькулятори мають
          уніфікований інтерфейс: порожні поля на старті, миттєве оновлення результатів,
          чіткі підказки та підсумкова інтерпретація.
        </p>
      </header>

      {/* Grid of cards */}
      <main className="mx-auto w-full max-w-6xl px-6 pb-14 pt-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  <span aria-hidden>{it.emoji}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {it.title}
                    </h2>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {it.badge}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{it.desc}</p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                    Відкрити
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips + disclaimer */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Підказки щодо введення</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Відповідайте на всі пункти шкали; результат рахується автоматично.</li>
              <li>За потреби використовуйте десяткові «,» або «.» (де це релевантно).</li>
              <li>Інтерпретаційні пороги наведені безпосередньо в кожному інструменті.</li>
            </ul>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h3 className="text-base font-semibold">Застереження</h3>
            <p className="mt-2 text-sm leading-6">
              Результати мають довідковий характер і не замінюють консультацію лікаря або
              спеціаліста з психічного здоров’я. При позитивному скринінгу чи виражених
              симптомах — зверніться по професійну допомогу.
            </p>
          </aside>
        </section>

        {/* Back */}
        <nav className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <span aria-hidden>←</span> На головну
          </Link>
        </nav>
      </main>
    </div>
  );
}


