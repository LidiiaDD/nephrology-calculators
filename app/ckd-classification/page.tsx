// app/ckd-classification/page.tsx
import Link from "next/link";

export default function CKDClassificationPage() {
  const tools = [
    {
      href: "/ckd-classification/kfre",
      title: "KFRE — Kidney Failure Risk Equation",
      desc: "Оцінка 2/5-річного ризику прогресування до ниркової недостатності (початок ЗНТ/трансплантації).",
      badge: "Ризик-прогноз",
    },
    {
      href: "/ckd-classification/kdigo-staging",
      title: "KDIGO staging — класи G/A",
      desc: "Класифікація ХХН за eGFR (G1–G5) та альбумінурією (A1–A3) з короткою інтерпретацією ризику.",
      badge: "Стадії ХХН",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Класифікації ХХН
          </h1>
          <p className="mt-2 text-slate-600">
            Оберіть потрібний інструмент: прогноз ризику за KFRE або стадіювання
            за рекомендаціями KDIGO.
          </p>
        </header>

        {/* Cards */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {tools.map((t) => (
            <div
              key={t.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {t.badge}
                </span>
              </div>
              <h2 className="text-lg font-semibold leading-snug">{t.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{t.desc}</p>

              <div className="mt-5">
                <Link
                  href={t.href}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Відкрити
                  <svg
                    className="ml-2 h-4 w-4 opacity-90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Helpful / Back */}
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-700">
              Підказки щодо введення
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              <li>eGFR та альбумінурія — у відповідних одиницях калькулятора.</li>
              <li>
                Для KFRE коректність розрахунку залежить від вибраної формули
                eGFR (у твоєму проєкті — CKD-EPI 2021).
              </li>
              <li>
                Результати є довідковими та не замінюють клінічне рішення
                спеціаліста.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-700">Навігація</h3>
            <div className="mt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                На головну
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
