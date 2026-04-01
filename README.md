# alloc-bench

Allocation benchmark for `Float64Array` under different workload patterns: small churn, medium churn, large blocks, interleaved lifecycles, burst-then-free, and matrix multiply chains.

## Usage

```bash
npm install
npm run bench          # full run (JS baseline only)
npm run bench:quick    # quick subset (JS baseline only)
```

### With the WASM TLSF backend

A pre-built [numbl-allocator](https://github.com/DiamonDinoia/numbl-allocator) WASM binary is included. To benchmark it against the JS baseline:

```bash
npm run bench -- --backend ./backends/wasm-tlsf.ts
npm run bench:quick -- --backend ./backends/wasm-tlsf.ts
```

### Options

```
--list             List available scenarios and backends
--quick            Reduced scenario set + shorter runs
--scenario <csv>   Filter scenarios by id
--backend <path>   Load additional backend module (must export createBackend)
--output <path>    Write JSON results
--markdown <path>  Write markdown report
```

## Sample results

| Scenario | JS median | WASM TLSF median | Speedup |
|----------|-----------|------------------|---------|
| small-churn | 0.707ms | 0.129ms | 5.5x |
| medium-churn | 1.500ms | 0.013ms | 119x |
| large-alloc | 1.543ms | 0.001ms | 1094x |
| interleaved | 0.378ms | 0.026ms | 14.8x |
| burst-then-free | 0.610ms | 0.153ms | 4.0x |
| matmul-chain | 0.009ms | 0.001ms | 15.8x |

## Custom backends

You can plug in custom allocator backends via `--backend`:

```bash
npm run bench -- --backend ./my-wasm-backend.ts
```

The module must export a `createBackend()` function returning an `AllocBenchBackend`:

```ts
import type { AllocBenchBackend } from "./src/alloc-bench-core.js";

export async function createBackend(): Promise<AllocBenchBackend | null> {
  return {
    id: "my-allocator",
    label: "My custom allocator",
    alloc: (n: number) => new Float64Array(n),
    free: (arr: Float64Array) => { /* ... */ },
  };
}
```
