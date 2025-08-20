// app/qol/page.tsx
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
    href: "/qol/pdqli16", // лишаю як у вас
    title: "PDQLI-16 (додіалізна ХХН)",
    desc: "Опитувальник якості життя та психоемоційного стану для пацієнтів із ХХН до діалізу.",
    badge: "QOL (до діалізу)",
    emoji: "🧠",
  },
  {
    href: "/qol/kdqol-36",
    title: "KDQOL-36",
    desc: "36 пунктів: SF-12 (PCS/MCS) + нирково-специфічні субшкали для ХХН/діалізу.",
    badge: "Нирково-специфічний",
    emoji: "🧬",
  },
  {
    href: "/qol/sf-36",
    title: "SF-36",
    desc: "Загальна анкета якості життя (8 доменів) із формуванням композитів фізичного/ментального здоров’я.",
    badge: "Загальний",
    emoji: "📊",
  },
  {
    href: "/qol/pdqil-16", // маршрут залишив як у вашому файлі
    title: "PDQLI-16 (перитонеальний діаліз)",
    desc: "Короткий інструмент для оцінки якості життя у пацієнтів на перитонеальному діалізі.",
    badge: "Діаліз (PD)",
    emoji: "💧",
  },
];

export default function QOLPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      {/* Header + breadcrumbs */}
      <header className="mx-auto w-full max-w-6xl px-6 pt-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">Головна</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-700">Якість життя</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Якість життя (HRQoL)
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Оберіть опитувальник. Усі інструменти мають уніфікований інтерфейс:
          порожні поля на старті, миттєве оновлення результатів, підсумкова
          інтерпретація та кнопка копіювання.
        </p>
      </header>

      {/* Grid of cards */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-6">
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
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
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
              <li>Заповніть усі пункти — підрахунок відбувається автоматично.</li>
              <li>Для композитів (PCS/MCS; домени KDQOL-36) результати з’являються у блоці «Результат».</li>
              <li>Скринінгові версії не замінюють повні валідаційні опитувальники.</li>
            </ul>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h3 className="text-base font-semibold">Застереження</h3>
            <p className="mt-2 text-sm leading-6">
              Результати мають довідковий характер і не замінюють клінічного рішення лікаря.
              Деякі опитувальники можуть підпадати під авторські права/ліцензії — дотримуйтесь умов використання.
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
      </section>
    </main>
  );
}
