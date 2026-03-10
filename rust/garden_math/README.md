# garden_math (Rust -> WASM example)

This crate exposes a tiny exported function used by the hero particle field:

- `wave(x, y, time, audio_level) -> f32`

Build and copy output:

```bash
cargo build --manifest-path rust/garden_math/Cargo.toml --target wasm32-unknown-unknown --release
cp rust/garden_math/target/wasm32-unknown-unknown/release/garden_math.wasm public/wasm/garden_math.wasm
```

If the WASM binary is missing, the website falls back to a JS equivalent.
