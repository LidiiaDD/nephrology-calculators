'use client';

let wasmExports: Record<string, any> | null = null;

export type Sex = 'female' | 'male';

export type QKidneyArgs = {
  age: number; bmi: number; sbp: number; ethrisk: number; smoke_cat: number; town: number; surv: number;
  b_CCF: number; b_cvd: number; b_pvd: number; b_ra: number; b_treatedhyp: number; b_type1: number; b_type2: number; fh_kidney: number;
  b_nsaid?: number;              // neph3: і у жінок, і у чоловіків
  b_renalstones?: number;        // лише жінки: neph3 & neph5
  b_sle?: number;                // лише жінки: neph3 & neph5
};

// --------- WASM loader (із fallback на arrayBuffer) ----------
export async function loadQKidneyWasm() {
  if (wasmExports) return wasmExports;
  const url = '/wasm/qkidney.wasm';

  // 1) спроба через streaming (швидше, але вимагає правильний MIME)
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('wasm 404');
    const { instance } = await WebAssembly.instantiateStreaming(res);
    wasmExports = instance.exports as Record<string, any>;
    return wasmExports!;
  } catch {
    // 2) fallback: завжди працює, навіть якщо MIME помилковий
    const res2 = await fetch(url, { cache: 'no-store' });
    if (!res2.ok) throw new Error('wasm 404 (fallback)');
    const buf = await res2.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buf, {});
    wasmExports = instance.exports as Record<string, any>;
    return wasmExports!;
  }
}

function pick(name: string) {
  const e = wasmExports as Record<string, any>;
  const f = e?.[name] ?? e?.[`_${name}`];
  if (typeof f !== 'function') throw new Error(`WASM export not found: ${name}`);
  return f as (...a: number[]) => number;
}

// --------- збір аргументів у точному C-порядку ----------
function argsNeph5(sex: Sex, a: QKidneyArgs): number[] {
  if (sex === 'female') {
    // female neph5 (ESRF):
    // age, b_CCF, b_cvd, b_pvd, b_ra, b_renalstones, b_sle,
    // b_treatedhyp, b_type1, b_type2, bmi, ethrisk, fh_kidney,
    // sbp, smoke_cat, surv, town
    return [
      a.age, a.b_CCF, a.b_cvd, a.b_pvd, a.b_ra, a.b_renalstones ?? 0, a.b_sle ?? 0,
      a.b_treatedhyp, a.b_type1, a.b_type2, a.bmi, a.ethrisk, a.fh_kidney,
      a.sbp, a.smoke_cat, a.surv, a.town,
    ];
  }
  // male neph5:
  // age, b_CCF, b_cvd, b_pvd, b_ra, b_treatedhyp, b_type1, b_type2,
  // bmi, ethrisk, fh_kidney, sbp, smoke_cat, surv, town
  return [
    a.age, a.b_CCF, a.b_cvd, a.b_pvd, a.b_ra, a.b_treatedhyp, a.b_type1, a.b_type2,
    a.bmi, a.ethrisk, a.fh_kidney, a.sbp, a.smoke_cat, a.surv, a.town,
  ];
}

function argsNeph3(sex: Sex, a: QKidneyArgs): number[] {
  if (sex === 'female') {
    // female neph3 (CKD 3–5):
    // age, b_CCF, b_cvd, b_nsaid, b_pvd, b_ra, b_renalstones, b_sle,
    // b_treatedhyp, b_type1, b_type2, bmi, ethrisk, fh_kidney,
    // sbp, smoke_cat, surv, town
    return [
      a.age, a.b_CCF, a.b_cvd, a.b_nsaid ?? 0, a.b_pvd, a.b_ra,
      a.b_renalstones ?? 0, a.b_sle ?? 0,
      a.b_treatedhyp, a.b_type1, a.b_type2, a.bmi, a.ethrisk, a.fh_kidney,
      a.sbp, a.smoke_cat, a.surv, a.town,
    ];
  }
  // male neph3:
  // age, b_CCF, b_cvd, b_nsaid, b_pvd, b_ra, b_treatedhyp, b_type1, b_type2,
  // bmi, ethrisk, fh_kidney, sbp, smoke_cat, surv, town
  return [
    a.age, a.b_CCF, a.b_cvd, a.b_nsaid ?? 0, a.b_pvd, a.b_ra, a.b_treatedhyp, a.b_type1, a.b_type2,
    a.bmi, a.ethrisk, a.fh_kidney, a.sbp, a.smoke_cat, a.surv, a.town,
  ];
}

// --------- публічні обгортки ----------
export async function calcNeph3Raw(a: QKidneyArgs, sex: Sex) {
  const e = await loadQKidneyWasm();
  const fn = pick(sex === 'female' ? 'neph3_female_raw' : 'neph3_male_raw');
  return Number(fn(...argsNeph3(sex, a)));
}
export async function calcNeph5Raw(a: QKidneyArgs, sex: Sex) {
  const e = await loadQKidneyWasm();
  const fn = pick(sex === 'female' ? 'neph5_female_raw' : 'neph5_male_raw');
  return Number(fn(...argsNeph5(sex, a)));
}
