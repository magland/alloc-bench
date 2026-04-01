# alloc-bench

Allocation benchmark for `Float64Array` under different workload patterns: small churn, medium churn, large blocks, interleaved lifecycles, burst-then-free, and matrix multiply chains.

## Usage

```bash
npm install
npm run bench          # full run
npm run bench:quick    # quick subset
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

### Custom backends

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
