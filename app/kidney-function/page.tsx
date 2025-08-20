import Link from "next/link";

type Tool = {
  href: string;
  title: string;
  badge: string;
  desc: string;
  emoji: string;
};

const tools: Tool[] = [
  {
    href: "/kidney-function/ckd-epi",
    title: "CKD-EPI",
    badge: "eGFR",
    desc: "Актуальна формула оцінки швидкості клубочкової фільтрації (креатинін; варіанти 2009/2021).",
    emoji: "📈",
  },
  {
    href: "/kidney-function/mdrd",
    title: "MDRD",
    badge: "eGFR",
    desc: "Історично поширена формула eGFR. Корисна для порівняння з попередніми даними.",
    emoji: "📊",
  },
  {
    href: "/kidney-function/cockcroft-gault",
    title: "Cockcroft–Gault",
    badge: "CrCl",
    desc: "Кліренс креатиніну (мл/хв) — часто потрібен для дозування ліків.",
    emoji: "🧮",
  },
  {
    href: "/kidney-function/schwartz",
    title: "Schwartz (діти)",
    badge: "pediatrics",
    desc: "Дитячий розрахунок eGFR із урахуванням зросту/віку (варіанти k-коефіцієнтів).",
    emoji: "🧒",
  },
];

export default function KidneyFunctionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Функція нирок — eGFR та кліренс креатиніну
          </h1>
          <p className="mt-3 text-gray-600">
            Оберіть калькулятор для дорослих або дітей. Інтерфейс уніфіковано з іншими
            розділами, поля спочатку порожні, розрахунок — миттєвий.
          </p>
        </header>

        {/* Cards */}
        <section className="grid gap-6 sm:grid-cols-2">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Відкрити ${t.title}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  <span aria-hidden>{t.emoji}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-semibold text-gray-900">
                      {t.title}
                    </h2>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {t.badge}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.desc}</p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                    Перейти
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
        </section>

        {/* Tips */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
          <h3 className="mb-2 text-base font-semibold text-gray-900">Підказки</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Поля початково порожні. Десятковий роздільник — «,» або «.».</li>
            <li>
              Одиниці креатиніну: мкмоль/л або мг/дл (перемикач у відповідних формах).
            </li>
            <li>
              eGFR наводиться в <span className="font-medium">мл/хв/1.73м²</span>.
              Cockcroft–Gault — у <span className="font-medium">мл/хв</span>.
            </li>
            <li>
              Результат є довідковим і не замінює клінічне рішення спеціаліста.
            </li>
          </ul>
        </section>

        {/* Back link */}
        <nav className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 transition hover:text-blue-700"
          >
            <span aria-hidden>←</span> На головну
          </Link>
        </nav>
      </div>
    </main>
  );
}
