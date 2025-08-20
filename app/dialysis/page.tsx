// app/dialysis/page.tsx
import Link from "next/link";

type Tool = {
  href: string;
  badge: string;
  title: string;
  description: string;
};

const tools: Tool[] = [
  {
    href: "/dialysis/ktv",
    badge: "Адекватність",
    title: "Kt/V (Daugirdas II)",
    description:
      "Оцінка дози гемодіалізу за формулою Daugirdas II: pre/post сечовина, UF, тривалість, маса тіла.",
  },
  {
    href: "/dialysis/urr",
    badge: "Сечовина",
    title: "URR (Urea Reduction Ratio)",
    description:
      "Простий показник зниження рівня сечовини під час сеансу; швидка орієнтовна оцінка адекватності.",
  },
  {
    href: "/dialysis/dsi",
    badge: "Пацієнт-орієнтовано",
    title: "DSI (Dialysis Symptom Index)",
    description:
      "Опитувальник симптомів при діалізі: відстеження тягаря симптомів, моніторинг динаміки лікування.",
  },
];

export default function DialysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Головна
          </Link>
          <span className="px-2">/</span>
          <span className="font-medium text-slate-700">Діаліз</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Діаліз — інструменти та калькулятори
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Оберіть потрібний інструмент для розрахунку дози діалізу, швидкої
          перевірки адекватності або оцінки симптомів.
        </p>
      </header>

      {/* Tools grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                  {tool.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tool.description}
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-700">
                Відкрити
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7.5 4.5a1 1 0 0 1 1.7-.7l5 5a1 1 0 0 1 0 1.4l-5 5A1 1 0 0 1 7.5 14.5L11.3 10 7.5 6.2a1 1 0 0 1-.3-.7z" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips / notes */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Підказки щодо введення
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
              <li>
                Використовуйте коректні одиниці (ммоль/л або мг/дл) згідно з
                формулами на сторінках інструментів.
              </li>
              <li>
                Для Kt/V бажано вводити точні <i>pre/post</i> значення сечовини,
                ультрафільтрацію (UF) та тривалість сеансу.
              </li>
              <li>
                URR — швидкий орієнтир, а не заміна розрахунку Kt/V.
              </li>
              <li>DSI допомагає відстежувати тягар симптомів у динаміці.</li>
            </ul>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
            <h2 className="text-base font-semibold">Застереження</h2>
            <p className="mt-2 text-sm leading-6">
              Результати мають довідковий характер і не замінюють клінічне
              рішення лікаря. Уточнюйте налаштування апарата, параметри діалізу,
              гідратацію та лабораторні дані відповідно до локального протоколу.
            </p>
            <div className="mt-3 text-sm">
              <Link
                href="/"
                className="font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
              >
                Повернутися на головну
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

