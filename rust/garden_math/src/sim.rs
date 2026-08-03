//! Shared scaffolding for the agent simulations.
//!
//! Both sims run on the same fixed square grid and hand JS the same thing: a
//! pointer to an RGBA buffer in linear memory that is allocated once and never
//! moved. Growing wasm memory detaches every `TypedArray` view the host holds,
//! silently — the views do not throw, they read zero — so nothing here
//! reallocates after init.

use core::cell::UnsafeCell;

/// Grid edge. A power of two so `& MASK` replaces `% GRID` for wrapping —
/// faster than modulo in the hot loop, and provably in range, which is what
/// lets the bounds checks be elided in safe Rust.
///
/// 512 rather than 1024 because the fixed per-frame grid pass is the wall, not
/// the agent count: at 1024 the blur alone exceeded a 60fps budget before a
/// single agent moved. See the table in `physarum`.
pub const GRID: usize = 512;
pub const MASK: i32 = (GRID as i32) - 1;
pub const CELLS: usize = GRID * GRID;

/// Single-threaded interior mutability.
///
/// wasm32-unknown-unknown has no threads, so there is no data race to have.
/// This exists because the alternative — `static mut` — is a lint error in
/// newer editions and a footgun in any of them.
pub struct Global<T>(UnsafeCell<T>);
unsafe impl<T> Sync for Global<T> {}

impl<T> Global<T> {
    pub const fn new(value: T) -> Self {
        Self(UnsafeCell::new(value))
    }
    /// # Safety
    /// Single-threaded target; callers must not hold two live borrows.
    #[allow(clippy::mut_from_ref)]
    pub fn get(&self) -> &mut T {
        unsafe { &mut *self.0.get() }
    }
}

#[inline(always)]
pub fn wrap(v: i32) -> usize {
    (v & MASK) as usize
}

/// A grid buffer as a fixed-size array reference.
///
/// The conversion is the point: indexing a `Vec`/slice emits a bounds check per
/// access, and across millions of grid accesses a frame that was measurably the
/// largest single cost. With the length known statically LLVM proves every
/// masked index in range and drops the checks — safe Rust, no `get_unchecked`.
#[inline(always)]
pub fn grid(v: &mut [f32]) -> &mut [f32; CELLS] {
    v.try_into().expect("grid buffer is CELLS long")
}

/// 3x3 box blur, blended and decayed, written into `out`.
///
/// Shared because physarum and dictyostelium had byte-identical copies of it
/// under different parameter names. Blends TOWARD the blur rather than
/// replacing with it: a full box blur every frame smears every filament into a
/// handful of thick channels within a few hundred steps, and the fine structure
/// only survives if most of each cell's own value carries forward.
pub fn diffuse_field(src: &[f32; CELLS], out: &mut [f32; CELLS], decay: f32, diffuse: f32) {
    let k = 1.0 / 9.0;
    for y in 0..GRID {
        let up = ((y + GRID - 1) & (GRID - 1)) * GRID;
        let mid = y * GRID;
        let down = ((y + 1) & (GRID - 1)) * GRID;
        for x in 0..GRID {
            let xl = (x + GRID - 1) & (GRID - 1);
            let xr = (x + 1) & (GRID - 1);
            let sum = src[up + xl]
                + src[up + x]
                + src[up + xr]
                + src[mid + xl]
                + src[mid + x]
                + src[mid + xr]
                + src[down + xl]
                + src[down + x]
                + src[down + xr];
            let here = src[mid + x];
            out[mid + x] = (here + (sum * k - here) * diffuse) * decay;
        }
    }
}

pub fn xorshift(s: &mut u32) -> u32 {
    let mut x = *s;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *s = x;
    x
}

pub fn rand01(s: &mut u32) -> f32 {
    (xorshift(s) >> 8) as f32 / 16_777_216.0
}
