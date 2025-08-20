// app/other-scales/page.tsx
import Link from "next/link";

type Tool = {
  href: string;
  title: string;
  desc: string;
  badge: string;
  emoji: string;
};

const tools: Tool[] = [
  {
    href: "/other-scales/barthel",
    title: "Barthel Index",
    desc: "Оцінка повсякденної активності (ADL) та рівня залежності.",
    badge: "ADL",
    emoji: "🧩",
  },
  {
    href: "/other-scales/frailty",
    title: "Frailty Index",
    desc: "Крихкість/функціональний статус: стратифікація ризику в геріатрії.",
    badge: "Геріатрія",
    emoji: "🧓",
  },
  {
    href: "/other-scales/lawton",
    title: "Lawton IADL",
    desc: "Складні інструментальні дії щоденного життя (IADL).",
    badge: "IADL",
    emoji: "🛒",
  },
  {
    href: "/other-scales/katz",
    title: "Katz ADL",
    desc: "Базова повсякденна активність: швидка оцінка незалежності.",
    badge: "ADL",
    emoji: "📋",
  },
  {
    href: "/other-scales/sppb",
    title: "SPPB",
    desc: "Коротка батарея фізичної працездатності (баланс, ходьба, стілець).",
    badge: "Функція",
    emoji: "🏃",
  },
  {
    href: "/other-scales/sarc-f",
    title: "SARC-F",
    desc: "Швидкий скринінг саркопенії (5 пунктів, cut-off ≥ 4).",
    badge: "Саркопенія",
    emoji: "💪",
  },
  {
    href: "/other-scales/karnofsky",
    title: "Karnofsky Performance Status",
    desc: "Функціональний статус у онкології/хронічних станах (0–100).",
    badge: "KPS",
    emoji: "📈",
  },
];

export default function OtherScalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <header className="mx-auto max-w-6xl px-6 pt-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Інші шкали та тести
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Оберіть інструмент для оцінки функціонального статусу, крихкості та
          повсякденної активності. Усі калькулятори мають уніфікований інтерфейс.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-14 pt-6">
        {/* Ґрід карток */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Відкрити ${t.title}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  <span aria-hidden>{t.emoji}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {t.title}
                    </h2>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {t.badge}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{t.desc}</p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
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

        {/* Підказки / дисклеймер */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Підказки щодо введення
            </h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Поля спочатку порожні; обирайте варіанти або вводьте значення у вказаних одиницях.</li>
              <li>Десятковий роздільник у числових полях — «,» або «.».</li>
              <li>Результати з’являються та оновлюються миттєво.</li>
            </ul>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h3 className="text-base font-semibold">Застереження</h3>
            <p className="mt-2 text-sm leading-6">
              Результати мають довідковий характер і не замінюють клінічне рішення лікаря.
              Користуйтеся офіційними протоколами вашого закладу.
            </p>
          </aside>
        </section>

        {/* Навігація */}
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
