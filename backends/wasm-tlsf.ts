import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AllocBenchBackend } from "../src/alloc-bench-core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "..", "wasm", "numbl_allocator.wasm");

// 256 initial pages = 16 MB, max 16384 pages = 1 GB
const INITIAL_PAGES = 256;
const MAX_PAGES = 16384;

export async function createBackend(): Promise<AllocBenchBackend | null> {
  const wasmBytes = readFileSync(wasmPath);
  const memory = new WebAssembly.Memory({
    initial: INITIAL_PAGES,
    maximum: MAX_PAGES,
  });
  const importObject = {
    wasi_snapshot_preview1: {
      fd_write: () => 0,
    },
    env: { memory },
  };
  const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);
  const wasmExports = instance.exports as Record<string, unknown>;
  const init = wasmExports.numbl_alloc_init as (n: number) => number;
  const alloc = wasmExports.numbl_alloc as (n: number) => number;
  const free = wasmExports.numbl_free as (offset: number) => void;
  const initialize = wasmExports._initialize as (() => void) | undefined;

  if (initialize) initialize();
  if (init(0) !== 0) throw new Error("numbl_alloc_init failed");

  const offsets = new Map<Float64Array, number>();

  return {
    id: "wasm-tlsf",
    label: "WASM TLSF allocator",
    alloc: (n: number) => {
      const bytes = n * 8;
      const offset = alloc(bytes);
      if (offset === 0) throw new Error("WASM alloc failed");
      const arr = new Float64Array(memory.buffer, offset, n);
      offsets.set(arr, offset);
      return arr;
    },
    free: (arr: Float64Array) => {
      const offset = offsets.get(arr);
      if (offset !== undefined) {
        free(offset);
        offsets.delete(arr);
      }
    },
  };
}
