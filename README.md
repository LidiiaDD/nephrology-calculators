# Nephrology Calculators

Бібліотека клінічних калькуляторів та шкал з нефрології. Проєкт створено на **Next.js + TypeScript + Tailwind** з фокусом на швидкість, доступність та консистентний UX.

> **Застереження.** Інструменти призначені **лише** для довідкової/навчальної мети і **не замінюють** клінічне рішення лікаря.

---

## 🔎 Що це
- Розрахунок eGFR (CKD-EPI 2009/2021, MDRD), CrCl (Cockcroft-Gault), Schwartz/Filler у дітей.
- Стадіювання ХХН за KDIGO (класи **G/A**), **KFRE** (2/5-річний ризик).
- Серцево-судинний ризик (**SCORE2/SCORE2-OP**).
- Діалізні показники (Kt/V, URR, DSI).
- Біомаркери: UACR/UPCR, NGAL/L-FABP/KIM-1-панель тощо (з позначенням **для сечі/сироватки**).
- Якість життя (**KDQOL-36**, SF-12 зведені, PDQLI), психоемоційні шкали (BDI, HADS).
- Функціональні індекси: IADL (Lawton), SPPB, SARC-F, Frailty скринінг.
- Антропометричні та нутритивні модулі (SGA, MIS, PEW, ін.).

> Повний список див. у директоріях `app/*` або на головній сторінці застосунку.

---

## 🧱 Технології
- **Next.js 15**, **React**, **TypeScript**
- **Tailwind CSS**
- Лінтинг/форматування: **ESLint**, **Prettier**
- Готовність до статичного експорту (`next export`) для Netlify

---

## 🚀 Швидкий старт (локально)

```bash
# 1) Клон
git clone https://github.com/LidiiaDD/nephrology-calculators.git
cd nephrology-calculators

# 2) Встановлення
npm ci   # або npm install

# 3) Розробка
npm run dev  # http://localhost:3000

# 4) Продакшн-збірка
npm run build

# 5) Статичний експорт (для Netlify)
npm run export   # збірка у папку /out
