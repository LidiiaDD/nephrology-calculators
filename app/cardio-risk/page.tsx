// app/cardio-risk/page.tsx
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Серцево-судинні ризики | NephroCalc",
  description:
    "Вибір інструментів для оцінювання серцево-судинного ризику: Charlson, SCORE2/SCORE2-OP, QKidney.",
};

type CardProps = {
  href: string;
  title: string;
  subtitle: string;
  tag?: string;
  icon: ReactNode; // emoji/невеликий символ — без додаткових ікон-пакетів
};

function Card({ href, title, subtitle, tag = "Інструмент", icon }: CardProps) {
  return (
    <Link
      href={href}
      className="
        group relative flex flex-col rounded-2xl border bg-white/70 p-5 shadow-sm
        transition hover:-translate-y-0.5 hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-400/50
      "
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl"
          aria-hidden
        >
          {icon}
        </div>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {tag}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-gray-900">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-gray-600">{subtitle}</p>

      <span
        className="
          mt-4 inline-flex items-center gap-1 self-start rounded-lg
          bg-blue-600 px-3 py-1.5 text-sm font-medium text-white
        "
      >
        Відкрити
        <span
          className="transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
          aria-hidden
        >
          →
        </span>
      </span>
    </Link>
  );
}

const CARDS: CardProps[] = [
  {
    href: "/cardio-risk/charlson",
    title: "Індекс Чарлсона (Charlson Comorbidity Index)",
    subtitle:
      "Зважена коморбідність для прогнозу 10-річної смертності; оцінка загального тягаря хвороб.",
    tag: "Шкала",
    icon: "📋",
  },
  {
    href: "/cardio-risk/score2",
    title: "SCORE2 / SCORE2-OP (10-річний ризик ССЗ)",
    subtitle:
      "Європейський інструмент для комбінованого фатального + нефатального ризику; варіант для ≥70 років (SCORE2-OP).",
    tag: "Калькулятор",
    icon: "❤️",
  },
  {
    href: "/cardio-risk/qkidney",
    title: "QKidney Risk",
    subtitle:
      "Ризик тяжких ниркових подій з урахуванням кардіо-метаболічних факторів у практиці ЗП.",
    tag: "Калькулятор",
    icon: "🩺",
  },
];

export default function CardioRiskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white">
      <header className="mx-auto max-w-6xl px-6 pb-2 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Серцево-судинні ризики
        </h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Оберіть калькулятор або шкалу для оцінки індивідуального ризику та
          стратифікації пацієнтів.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-12">
        {/* Ґрід карток */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Card key={c.href} {...c} />
          ))}
        </div>

        {/* Підказки / зауваги */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="mb-3 text-base font-semibold">Підказки щодо введення</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>
                Для <span className="font-medium">SCORE2-OP</span> вік має бути{" "}
                <span className="whitespace-nowrap">≥70&nbsp;років</span>.
              </li>
              <li>
                Десятковий роздільник — «, » або «. ». Порожні поля допускаються
                лише там, де це прямо дозволено.
              </li>
              <li>
                Якщо потрібні одиниці, вводьте значення у підписаних одиницях поля.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-amber-50 p-5">
            <h2 className="mb-3 text-base font-semibold">Застереження</h2>
            <p className="text-sm text-amber-900">
              Результати мають довідковий характер і не замінюють клінічного рішення
              лікаря. Для окремих нозологій можуть існувати локальні протоколи й
              порогові значення.
            </p>
          </div>
        </section>

        {/* Навігація */}
        <nav className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            ← На головну
          </Link>
        </nav>
      </main>
    </div>
  );
}
