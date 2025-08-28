// app/cardio-risk/qkidney/EngineBadge.tsx
'use client';

import { useEffect, useState } from 'react';

export default function EngineBadge() {
  const [engine, setEngine] = useState<'wasm' | 'demo'>('demo');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/wasm/qkidney.wasm', { cache: 'no-store' });
        if (!res.ok) throw new Error('no wasm');

        const buf = await res.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buf);
        const exports = instance.exports as Record<string, unknown>;

        const hasAll = ['neph3_male_raw', 'neph5_male_raw', 'neph3_female_raw', 'neph5_female_raw']
          .every((name) => name in exports);

        setEngine(hasAll ? 'wasm' : 'demo');
      } catch {
        setEngine('demo');
      }
    })();
  }, []);

  return (
    <span
      className={
        engine === 'wasm'
          ? 'rounded-md bg-green-100 text-green-800 px-2 py-1 text-xs'
          : 'rounded-md bg-yellow-100 text-yellow-800 px-2 py-1 text-xs'
      }
      title={
        engine === 'wasm'
          ? 'Розрахунок виконує офіційний WASM від ClinRisk'
          : 'Поки працюють демо-формули'
      }
    >
      Джерело розрахунку:{' '}
      <strong>{engine === 'wasm' ? 'офіційний (WASM ClinRisk)' : 'демо'}</strong>
    </span>
  );
}
