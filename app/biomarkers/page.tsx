// app/biomarkers/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Біомаркери | NephroCalc",
  description:
    "Швидкий перехід до розрахунків UACR, уромодулінового профілю та тубулярних біомаркерів.",
};

/* ---------- Локальні мінімалістичні SVG-іконки ---------- */
type IconProps = { className?: string };

function TestTubes({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="3" width="5" height="18" rx="2" />
      <rect x="14" y="3" width="5" height="18" rx="2" />
      <path d="M5 8h5M14 8h5" />
    </svg>
  );
}
function Droplets({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3c-3 4-5 6-5 9a5 5 0 1 0 10 0c0-3-2-5-5-9z" />
    </svg>
  );
}
function FlaskConical({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 2h4M9 2v5L4 20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L15 7V2" />
      <path d="M8 13h8" />
    </svg>
  );
}
function ArrowLeft({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function Info({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8h.01M11 12h2v6h-2z" />
    </svg>
  );
}
/* -------------------------------------------------------- */

type CardProps = {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  badge?: string;
};

function BiomarkerCard({ href, title, subtitle, icon, badge }: CardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      {badge ? (
        <span className="mt-4 w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {badge}
        </span>
      ) : null}

      <div className="pointer-events-none mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
        Перейти
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>

      {/* декоративний градієнт у правому нижньому куті */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-blue-50/60 blur-2xl" />
    </Link>
  );
}

export default function BiomarkersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:py-10">
        {/* Хедер */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Біомаркери</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Оберіть потрібний модуль для інтерпретації лабораторних показників.
              Поля в калькуляторах початково порожні, підтримуються «,» та «.» як
              десяткові роздільники, одиниці вказані для кожного інструменту.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            На головну
          </Link>
        </div>

        {/* Сітка карток */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BiomarkerCard
            href="/biomarkers/uacr"
            title="UACR"
            subtitle="Альбумін/креатинін у сечі; класифікація A1–A3 за KDIGO."
            icon={<Droplets />}
            badge="Сеча"
          />

          <BiomarkerCard
            href="/biomarkers/umodulin"
            title="Уромодулін (профіль)"
            subtitle="Uromodulin (Tamm–Horsfall): індекси, фракції та співвідношення для клінічної інтерпретації."
            icon={<FlaskConical />}
            badge="Профіль"
          />

          <BiomarkerCard
            href="/biomarkers/tubular"
            title="Тубулярні біомаркери"
            subtitle="L-FABP, NGAL, KIM-1 — ранні маркери тубулярного ураження; пороги та підсумкова оцінка."
            icon={<TestTubes />}
            badge="Панель"
          />
        </div>

        {/* Інфо-блок */}
        <div className="mt-10 rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Info />
            </div>
            <p className="text-sm leading-6 text-gray-600">
              Результати розрахунків є довідковими й не замінюють консультацію
              лікаря. Для сироватки/плазми та сечі застосовуються різні референтні
              інтервали — звертайте увагу на одиниці вимірювання та підказки в
              кожному модулі.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
