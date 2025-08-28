// app/api/qkidney/route.ts
import { NextRequest, NextResponse } from 'next/server';

/** Вхідні дані (підженiть коди/порядок під офіційний C-інтерфейс ClinRisk) */
export type QKidneyInput = {
  sex: 0 | 1;                 // 0=female, 1=male
  age: number;
  ethnicityCode: number;
  smokingCode: number;
  bmi: number;
  sbp: number;
  diabetes: 0 | 1 | 2;
  treatedHypertension: 0 | 1;
  cvd: 0 | 1;
  heartFailure: 0 | 1;
  pvd: 0 | 1;
  rheumatoid: 0 | 1;
  sle: 0 | 1;
  kidneyStones: 0 | 1;
  nsaids: 0 | 1;
  townsend: number;
};

type WasmExports = {
  memory: WebAssembly.Memory;
  malloc(n: number): number;
  free(p: number): void;

  // Імена функцій — як у вашому збірному .wasm (див. -s EXPORTED_FUNCTIONS)
  qkidney_ckd_female(ptr: number): number;
  qkidney_ckd_male(ptr: number): number;
  qkidney_esrf_female(ptr: number): number;
  qkidney_esrf_male(ptr: number): number;
};

// Кеш інстансу між інвокаціями лямбди
let wasm: WasmExports | null = null;

/** Завантаження WASM з /public через fetch (працює і локально, і на Netlify) */
async function loadWasmFromPublic(req: NextRequest): Promise<WasmExports> {
  if (wasm) return wasm;
  const wasmUrl = new URL('/wasm/qkidney.wasm', req.url);
  const res = await fetch(wasmUrl);
  if (!res.ok) throw new Error(`WASM download failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const e: any = instance.exports;

  wasm = {
    memory: e.memory,
    malloc: e._malloc ?? e.malloc,
    free: e._free ?? e.free,
    qkidney_ckd_female: e._qkidney_ckd_female ?? e.qkidney_ckd_female,
    qkidney_ckd_male:   e._qkidney_ckd_male   ?? e.qkidney_ckd_male,
    qkidney_esrf_female:e._qkidney_esrf_female?? e.qkidney_esrf_female,
    qkidney_esrf_male:  e._qkidney_esrf_male  ?? e.qkidney_esrf_male,
  } as WasmExports;

  return wasm!;
}

/** Пакуємо параметри у пам’ять WASM.
 *  ВАЖЛИВО: порядок/типи ЗБІГАТИСЯ з тим, що читає C-код.
 */
function packInput(e: WasmExports, inp: QKidneyInput): number {
  const arr = new Float64Array([
    inp.age,
    inp.ethnicityCode,
    inp.smokingCode,
    inp.bmi,
    inp.sbp,
    inp.diabetes,
    inp.treatedHypertension,
    inp.cvd,
    inp.heartFailure,
    inp.pvd,
    inp.rheumatoid,
    inp.sle,
    inp.kidneyStones,
    inp.nsaids,
    inp.townsend,
    inp.sex,
  ]);
  const buf = new Uint8Array(arr.buffer);
  const ptr = e.malloc(buf.length);
  new Uint8Array(e.memory.buffer).set(buf, ptr);
  return ptr;
}

async function compute(kind: 'ckd'|'esrf', input: QKidneyInput, req: NextRequest): Promise<number> {
  const e = await loadWasmFromPublic(req);
  const p = packInput(e, input);
  try {
    const val =
      kind === 'ckd'
        ? (input.sex === 0 ? e.qkidney_ckd_female(p) : e.qkidney_ckd_male(p))
        : (input.sex === 0 ? e.qkidney_esrf_female(p) : e.qkidney_esrf_male(p));
    // Якщо ваш C повертає 0..1 — розкоментуйте множення на 100:
    // return val * 100;
    return val;
  } finally {
    e.free(p);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { kind, input } = (await req.json()) as { kind: 'ckd'|'esrf'; input: QKidneyInput; };
    const risk = await compute(kind, input, req);
    return NextResponse.json({ risk });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
