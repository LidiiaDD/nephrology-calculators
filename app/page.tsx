'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

type Category = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  tint: string; // tailwind bg tint for icon bubble
};

const CATEGORIES: Category[] = [
  { slug: 'kidney-function',  title: 'Функція нирок',         description: 'CKD-EPI, MDRD, Cockcroft–Gault', emoji: '🧮', tint: 'bg-blue-100' },
  { slug: 'ckd-classification', title: 'Класифікації ХХН',    description: 'KDIGO, KFRE, G/A staging',        emoji: '🗂️', tint: 'bg-violet-100' },
  { slug: 'cardio-risk',       title: 'Серцево-судинні ризики', description: 'SCORE2/OP, QKidney, Charlson',  emoji: '❤️', tint: 'bg-rose-100' },
  { slug: 'nutrition',         title: 'Нутритивний статус',    description: 'SGA, MIS, PEW',                  emoji: '🍎', tint: 'bg-emerald-100' },
  { slug: 'dialysis',          title: 'Діаліз',                description: 'Kt/V, URR, DSI',                  emoji: '💧', tint: 'bg-cyan-100' },
  { slug: 'qol',               title: 'Якість життя',          description: 'KDQOL-36, PDQLI-16, SF-36',      emoji: '🙂', tint: 'bg-amber-100' },
  { slug: 'mental',            title: 'Психоемоційний стан',   description: 'BDI, HADS, GAD-7',               emoji: '🧠', tint: 'bg-sky-100' },
  { slug: 'biomarkers',        title: 'Біомаркери',            description: 'UACR, NGAL, Uromodulin',         emoji: '🧪', tint: 'bg-lime-100' },
  { slug: 'other-scales',      title: 'Інші шкали',            description: 'Oxford MEST-C, Renal Risk Score',emoji: '📏', tint: 'bg-zinc-100' },
];

export default function Home() {
  // ── state
  const [query, setQuery]   = useState('');
  const [pinned, setPinned] = useState<string[]>([]);

  // ── load/save pinned to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nephro:pinned');
      if (raw) setPinned(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('nephro:pinned', JSON.stringify(pinned));
    } catch {}
  }, [pinned]);

  // ── helpers
  const togglePin = (slug: string) =>
    setPinned(p => (p.includes(slug) ? p.filter(s => s !== slug) : [...p, slug]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? CATEGORIES.filter(c =>
          [c.title, c.description, c.slug].some(v => v.toLowerCase().includes(q))
        )
      : CATEGORIES.slice();

    // Піднімаємо «обране» нагору
    return base.sort((a, b) => {
      const ap = pinned.includes(a.slug) ? 1 : 0;
      const bp = pinned.includes(b.slug) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return a.title.localeCompare(b.title, 'uk');
    });
  }, [query, pinned]);

  const total = CATEGORIES.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <section className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Бібліотека калькуляторів для нефрології
          </h1>
          <p className="mt-2 text-slate-600">
            Швидкий доступ до розділів. Поля більшості калькуляторів підтримують
            десяткові «,»/«.» та миттєві підрахунки.
          </p>

          {/* Search + stats */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-[420px]">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Пошук розділу або калькулятора…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Пошук"
              />
              <span className="pointer-events-none absolute left-3 top-2.5 select-none text-xl">🔎</span>
            </div>

            <div className="text-sm text-slate-600">
              Розділів: <span className="font-semibold text-slate-900">{total}</span>
              {query && (
                <>
                  {' · '}знайдено:{' '}
                  <span className="font-semibold text-slate-900">{filtered.length}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {pinned.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Обране
            </div>
            <Grid
              items={filtered.filter(c => pinned.includes(c.slug))}
              pinned={pinned}
              onPin={togglePin}
            />
          </div>
        )}

        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Усі розділи
        </div>
        <Grid items={filtered} pinned={pinned} onPin={togglePin} />
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-600">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Результати мають довідковий характер і не замінюють консультацію лікаря.
              Дані не зберігаються на сервері; «Обране» – лише в браузері.
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">Примітка.</span>{' '}
              Бібліотеку калькуляторів створено на кафедрі нефрології та нирковозамісної терапії
              НУОЗ України імені П. Л. Шупика.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** Картки + сітка */
function Grid({
  items,
  pinned,
  onPin,
}: {
  items: Category[];
  pinned: string[];
  onPin: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(cat => (
        <article
          key={cat.slug}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          {/* Pin */}
          <button
            aria-label={pinned.includes(cat.slug) ? 'Видалити з обраного' : 'Додати в обране'}
            onClick={e => {
              e.preventDefault();
              onPin(cat.slug);
            }}
            className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-xs transition ${
              pinned.includes(cat.slug)
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {pinned.includes(cat.slug) ? '★ Обране' : '☆ Обране'}
          </button>

          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${cat.tint}`}>
              <span className="text-xl" aria-hidden>
                {cat.emoji}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{cat.title}</h2>
              <p className="text-sm text-slate-600">{cat.description}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link
              href={`/${cat.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Переглянути
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>

            <span className="text-xs text-slate-500">/ {cat.slug}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
