Place compiled Rust WASM binaries here.

Expected file for this scaffold:

- `/public/wasm/garden_math.wasm`

The hero system will lazy-load this file at runtime and gracefully fall back to
JS math when unavailable.
