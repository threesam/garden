Place compiled Rust WASM binaries here.

Expected file for this scaffold:

- `garden_math.wasm` — hero particle field + physarum (`pnpm wasm:build:garden_math`)
- `wetyu.wasm` — the looper engine, run inside an AudioWorklet (`pnpm wasm:build:wetyu`)

The hero system will lazy-load this file at runtime and gracefully fall back to
JS math when unavailable.
