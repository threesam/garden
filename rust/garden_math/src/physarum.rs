//! Physarum transport-network simulation.
//!
//! Each agent senses three points ahead of itself on a shared trail map, rotates
//! toward the strongest reading, steps forward, and deposits. The map is blurred
//! and decayed every frame. Nobody tells the agents to build a network; the
//! feedback loop between depositing and sensing is the whole algorithm, and the
//! branching transport networks fall out of it.
//!
//! *Physarum polycephalum* is a slime mould — a protist. It is not a fungus, has
//! no hyphae and no fruiting body. The resemblance to the mushroom work in this
//! repo is superficial and the two share no biology.
//!
//! ## Memory
//!
//! Everything lives in wasm linear memory for the lifetime of the page and is
//! allocated exactly once, in [`physarum_init`]. Growing wasm memory detaches
//! every `TypedArray` view JS is holding, and it does so silently — the views do
//! not throw, they just read zero. So the buffers are sized up front and the
//! host is handed pointers that stay valid.
//!
//! Agents never cross the JS boundary. JS reads one thing: the pixel buffer.

use core::cell::UnsafeCell;

/// Grid edge. A power of two so `& MASK` replaces `% GRID` for wrapping —
/// faster than modulo in the hot loop, and provably in range, which is also
/// what keeps the indexing safe without bounds-check noise.
///
/// 512, not the 1024 originally planned. Measured on this machine (node/V8,
/// ms per step, so the frame budget is 16.7):
///
/// | agents | 1024 grid | 512 grid |
/// |--------|-----------|----------|
/// | 0      | 25.9      | 6.5      |
/// | 100k   | —         | 14.6     |
/// | 150k   | —         | 16.9     |
/// | 200k   | 36.1      | 19.4     |
/// | 1M     | 74.0      | 55.3     |
///
/// The fixed grid pass is the wall, not the agents: at 1024 it costs 26ms
/// before a single agent moves, so 60fps is unreachable there at ANY agent
/// count, including zero. At 512 the same pass is 6.5ms and ~150k agents lands
/// on 60fps in 7MB. Raise this to 1024 if detail matters more than framerate.
///
/// So the issue's estimate of 1M agents at 60fps is out by roughly 7x on this
/// hardware. 1M runs, at about 18fps.
const GRID: usize = 512;
const MASK: i32 = (GRID as i32) - 1;
const CELLS: usize = GRID * GRID;

/// Single-threaded interior mutability.
///
/// wasm32-unknown-unknown has no threads, so there is no data race to have. This
/// exists because the alternative — `static mut` — is a lint error in newer
/// editions and a footgun in any of them.
struct Global<T>(UnsafeCell<T>);
unsafe impl<T> Sync for Global<T> {}
impl<T> Global<T> {
    const fn new(value: T) -> Self {
        Self(UnsafeCell::new(value))
    }
    /// # Safety
    /// Single-threaded target; callers must not hold two live borrows.
    #[allow(clippy::mut_from_ref)]
    fn get(&self) -> &mut T {
        unsafe { &mut *self.0.get() }
    }
}

struct State {
    /// Interleaved x, y, dx, dy — one contiguous allocation, not four.
    ///
    /// Heading is a unit VECTOR, not an angle. Stored as an angle, every agent
    /// needs sin+cos for each of three sensors plus its own step: eight
    /// transcendentals per agent per frame, eight million at a million agents,
    /// which measured at ~190ms/frame and dominated everything else combined.
    /// As a vector, turning is a multiply by a rotation constant that is fixed
    /// for the whole frame, and the hot loop calls no trig at all.
    agents: Vec<f32>,
    trail: Vec<f32>,
    /// Blur target. Double-buffered because a 3x3 blur read in place would
    /// sample cells this frame already wrote.
    scratch: Vec<f32>,
    pixels: Vec<u8>,
    count: usize,
    rng: u32,
    // Tunables, set once at init.
    sensor_dist: f32,
    sensor_angle: f32,
    turn_angle: f32,
    speed: f32,
    deposit: f32,
    decay: f32,
    diffuse: f32,
}

static STATE: Global<Option<State>> = Global::new(None);

fn xorshift(s: &mut u32) -> u32 {
    let mut x = *s;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *s = x;
    x
}

fn rand01(s: &mut u32) -> f32 {
    (xorshift(s) >> 8) as f32 / 16_777_216.0
}

/// Allocate and scatter. Safe to call again; it reallocates rather than growing.
///
/// Uniform scatter with random headings. A ring was tried first, on the theory
/// that a growing front reads as more alive than a network condensing out of
/// noise. It does not work: a symmetric ring is a stable attractor. Every
/// agent's forward sensor points into empty space while both flanks read the
/// dense ring it is standing in, so the whole swarm turns to follow the ring
/// and orbits there indefinitely. It renders as a perfect glowing donut and
/// never branches. Symmetry has to be broken at init or the feedback loop
/// preserves it.
#[no_mangle]
pub extern "C" fn physarum_init(count: u32, seed: u32) -> *const u8 {
    let count = (count as usize).min(4_000_000);
    let mut rng = if seed == 0 { 0x9E3779B9 } else { seed };

    let mut agents = vec![0.0_f32; count * 4];
    let centre = GRID as f32 * 0.5;
    for i in 0..count {
        // Scattered inside a disc, so the field has an edge to grow toward
        // rather than filling a square corner to corner.
        let angle = rand01(&mut rng) * core::f32::consts::TAU;
        let radius = centre * 0.92 * rand01(&mut rng).sqrt();
        let facing = rand01(&mut rng) * core::f32::consts::TAU;
        agents[i * 4] = centre + angle.cos() * radius;
        agents[i * 4 + 1] = centre + angle.sin() * radius;
        agents[i * 4 + 2] = facing.cos();
        agents[i * 4 + 3] = facing.sin();
    }

    let state = State {
        agents,
        trail: vec![0.0_f32; CELLS],
        scratch: vec![0.0_f32; CELLS],
        pixels: vec![0_u8; CELLS * 4],
        count,
        rng,
        // Defaults picked by rendering a parameter sweep, not by taste alone.
        // A short sensor reach with weak diffusion gives the fine branching
        // network; longer reach merges filaments into a few fat channels.
        sensor_dist: 5.0,
        sensor_angle: 0.40,
        turn_angle: 0.32,
        speed: 1.0,
        deposit: 1.0,
        decay: 0.96,
        diffuse: 0.10,
    };

    let slot = STATE.get();
    *slot = Some(state);
    slot.as_ref().map_or(core::ptr::null(), |s| s.pixels.as_ptr())
}

/// Override the defaults. Every value is a feel knob, not a physical constant.
#[no_mangle]
pub extern "C" fn physarum_tune(
    sensor_dist: f32,
    sensor_angle: f32,
    turn_angle: f32,
    speed: f32,
    deposit: f32,
    decay: f32,
    diffuse: f32,
) {
    if let Some(s) = STATE.get().as_mut() {
        s.sensor_dist = sensor_dist;
        s.sensor_angle = sensor_angle;
        s.turn_angle = turn_angle;
        s.speed = speed;
        s.deposit = deposit;
        // Clamped: a decay of 1.0 never forgets, so the map saturates to solid
        // white within seconds and every sensor reading ties.
        s.decay = decay.clamp(0.5, 0.999);
        s.diffuse = diffuse.clamp(0.0, 1.0);
    }
}

#[inline(always)]
fn wrap(v: i32) -> usize {
    (v & MASK) as usize
}

#[inline(always)]
fn sense(trail: &[f32; CELLS], x: f32, y: f32, dx: f32, dy: f32, dist: f32) -> f32 {
    let sx = wrap((x + dx * dist) as i32);
    let sy = wrap((y + dy * dist) as i32);
    trail[sy * GRID + sx]
}

/// A grid buffer as a fixed-size array reference.
///
/// The conversion is the point: indexing a `Vec`/slice emits a bounds check per
/// access, and across two million grid accesses a frame that was measurably the
/// largest single cost in the step. With the length known statically LLVM can
/// prove every masked index in range and drop the checks — in safe Rust, with
/// no `get_unchecked`.
#[inline(always)]
fn grid(v: &mut [f32]) -> &mut [f32; CELLS] {
    v.try_into().expect("grid buffer is CELLS long")
}

/// One frame: sense, rotate, move, deposit, then diffuse and decay.
#[no_mangle]
pub extern "C" fn physarum_step() {
    let Some(s) = STATE.get().as_mut() else { return };

    let (dist, speed, dep) = (s.sensor_dist, s.speed, s.deposit);
    // Rotation constants for this frame. Fixed for every agent, so the sensor
    // offsets and the turn are matrix multiplies rather than trig calls.
    let (sc, ss) = (s.sensor_angle.cos(), s.sensor_angle.sin());
    let (tc, ts) = (s.turn_angle.cos(), s.turn_angle.sin());
    let decay = s.decay;
    let diffuse = s.diffuse;

    {
        // Split borrows so the agent walk and the trail writes are independent,
        // and walk fixed-size chunks so field access needs no bounds check.
        let State { agents, trail, rng, .. } = s;
        let trail = grid(trail);

        for a in agents.chunks_exact_mut(4) {
            let x = a[0];
            let y = a[1];
            let mut dx = a[2];
            let mut dy = a[3];

            let f = sense(trail, x, y, dx, dy, dist);
            let l = sense(trail, x, y, dx * sc + dy * ss, -dx * ss + dy * sc, dist);
            let r = sense(trail, x, y, dx * sc - dy * ss, dx * ss + dy * sc, dist);

            // Steering. The random branch when both flanks tie is what makes
            // the network branch instead of settling into smooth channels.
            // Written as explicit branches rather than a sign multiply. The
            // tidier `Option<bool>` + sign form measured ~65% slower per agent:
            // it trades two predictable branches for extra float work on every
            // single agent, and at a million a frame that is not a wash.
            if f > l && f > r {
                // hold course
            } else if l > r {
                let nx = dx * tc + dy * ts;
                dy = -dx * ts + dy * tc;
                dx = nx;
            } else if r > l {
                let nx = dx * tc - dy * ts;
                dy = dx * ts + dy * tc;
                dx = nx;
            } else if xorshift(rng) & 1 == 0 {
                let nx = dx * tc + dy * ts;
                dy = -dx * ts + dy * tc;
                dx = nx;
            } else {
                let nx = dx * tc - dy * ts;
                dy = dx * ts + dy * tc;
                dx = nx;
            }

            // Repeated f32 rotations drift off unit length. One Newton step is
            // exact enough this close to 1 and avoids a per-agent sqrt.
            let inv = 1.5 - 0.5 * (dx * dx + dy * dy);
            dx *= inv;
            dy *= inv;

            // Position stays in FLOAT. Snapping it to the sampled cell — which
            // is what this did — quantises every step to whole cells, so any
            // agent whose per-frame movement is under one cell never moves at
            // all. With speed 1.0 that is almost all of them, and the swarm sat
            // frozen on its starting ring depositing into the same cells.
            let mut nx = x + dx * speed;
            let mut ny = y + dy * speed;
            let g = GRID as f32;
            if nx < 0.0 {
                nx += g;
            } else if nx >= g {
                nx -= g;
            }
            if ny < 0.0 {
                ny += g;
            } else if ny >= g {
                ny -= g;
            }

            a[0] = nx;
            a[1] = ny;
            a[2] = dx;
            a[3] = dy;
            trail[wrap(ny as i32) * GRID + wrap(nx as i32)] += dep;
        }
    }

    {
        let State { trail, scratch, .. } = s;
        diffuse_and_decay(grid(trail), grid(scratch), decay, diffuse);
    }
    core::mem::swap(&mut s.trail, &mut s.scratch);
    {
        let State { trail, pixels, .. } = s;
        shade(grid(trail), pixels);
    }
}

/// 3x3 box blur plus exponential decay, written into scratch.
///
/// Deliberately a separate traversal from `shade`, despite both walking all
/// CELLS. Merging them — one pass, blurred value already in a register — was
/// tried and measured 60% SLOWER: mixing the float-heavy blur with byte-wide
/// pixel writes in one loop defeats the vectorisation each simple loop gets on
/// its own. The redundant traversal is cheaper than the lost vectorisation.
fn diffuse_and_decay(
    trail: &[f32; CELLS],
    scratch: &mut [f32; CELLS],
    decay: f32,
    diffuse: f32,
) {
    let k = 1.0 / 9.0;
    for y in 0..GRID {
        let up = ((y + GRID - 1) & (GRID - 1)) * GRID;
        let mid = y * GRID;
        let down = ((y + 1) & (GRID - 1)) * GRID;
        for x in 0..GRID {
            let xl = (x + GRID - 1) & (GRID - 1);
            let xr = (x + 1) & (GRID - 1);
            let sum = trail[up + xl]
                + trail[up + x]
                + trail[up + xr]
                + trail[mid + xl]
                + trail[mid + x]
                + trail[mid + xr]
                + trail[down + xl]
                + trail[down + x]
                + trail[down + xr];
            // Blend TOWARD the blur rather than replacing with it. Replacing
            // outright — a full box blur every frame — diffuses so hard that
            // every filament smears into a handful of thick channels within a
            // few hundred steps. The fine branching structure only survives if
            // most of each cell's own value carries forward.
            let here = trail[mid + x];
            scratch[mid + x] = (here + (sum * k - here) * diffuse) * decay;
        }
    }
}

/// Trail -> RGBA. Written straight into the buffer JS views; no intermediate copy.
fn shade(trail: &[f32; CELLS], pixels: &mut [u8]) {
    for (i, px) in pixels.chunks_exact_mut(4).enumerate() {
        // Two-stop ramp: warm coin-yellow into bone, on near-black. A single
        // linear ramp renders the faint exploratory trails as flat grey and
        // loses most of the structure.
        // Soft-saturating tone curve, not a hard clamp. Trail equilibrium is
        // deposit/(1-decay), which is tens of units — a `min(1.0)` clipped
        // essentially the whole map to the top of the ramp and rendered the
        // network as one solid blob.
        let v = trail[i] * 0.022;
        let t = (v / (1.0 + v)).sqrt();
        let (r, g, b) = if t < 0.55 {
            let c = t / 0.55;
            (18.0 + c * 214.0, 16.0 + c * 147.0, 14.0 + c * 23.0)
        } else {
            let c = (t - 0.55) / 0.45;
            (232.0 + c * 23.0, 163.0 + c * 82.0, 37.0 + c * 190.0)
        };
        px[0] = r as u8;
        px[1] = g as u8;
        px[2] = b as u8;
        px[3] = 255;
    }
}

/// Pointer to the RGBA buffer. Stable for the lifetime of the module, because
/// nothing after `physarum_init` allocates.
#[no_mangle]
pub extern "C" fn physarum_pixels() -> *const u8 {
    STATE
        .get()
        .as_ref()
        .map_or(core::ptr::null(), |s| s.pixels.as_ptr())
}

#[no_mangle]
pub extern "C" fn physarum_grid() -> u32 {
    GRID as u32
}

#[no_mangle]
pub extern "C" fn physarum_count() -> u32 {
    STATE.get().as_ref().map_or(0, |s| s.count as u32)
}
