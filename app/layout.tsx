// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NephroCalc',
  description: 'Nephrology calculators',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ВАЖЛИВО: lang статичний, без жодної клієнтської зміни
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
