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

use crate::sim::{grid, rand01, wrap, xorshift, Global, CELLS, GRID};

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
    /// Interleaved x, y, remaining per food source.
    food: Vec<f32>,
    /// 0 = starved, 1 = well fed. Scales how much trail the agents lay down.
    vitality: f32,
}

static STATE: Global<Option<State>> = Global::new(None);

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
        food: Vec::with_capacity(96),
        vitality: 1.0,
    };

    let slot = STATE.get();
    *slot = Some(state);
    slot.as_ref().map_or(core::ptr::null(), |s| s.pixels.as_ptr())
}

/// Strength a food source emits per step, and the radius it emits over.
///
/// Emitted CONTINUOUSLY rather than once. A single deposit decays away within a
/// few dozen steps and the network forgets the source; a standing emission is
/// what makes food a persistent attractor, which is what an oat flake is to a
/// real plasmodium.
///
/// The radius is wide on purpose. Trail diffusion here is deliberately weak, to
/// keep the filaments thin, so a small source produces a hill only a few cells
/// across — an agent has to be nearly standing on it to sense anything, and the
/// network just walks past. A chemoattractant in a dish spreads far further than
/// the food does; the source needs to lay down a gradient with real reach or it
/// is not an attractor at all, only a decoration.
const FOOD_STRENGTH: f32 = 9.0;
const FOOD_RADIUS: i32 = 34;
/// How much a source holds when dropped.
const FOOD_STORE: f32 = 5_200.0;
/// Consumption is proportional to the trail sitting on the source, which is a
/// good enough proxy for how much of the organism has actually arrived. It costs
/// one lookup per source per step instead of testing every agent against every
/// source, and it has the right behaviour for free: food nobody has reached is
/// food nobody is eating.
const EAT_RATE: f32 = 0.0075;
/// Standing cost of being alive, per step. Balanced against EAT_RATE so a couple
/// of sources sustain the colony and an empty plate starves it in ~30 seconds.
const UPKEEP: f32 = 0.0016;
const GAIN: f32 = 0.00035;

/// Place a food source, in grid coordinates. Returns the new source count.
#[no_mangle]
pub extern "C" fn physarum_add_food(x: f32, y: f32) -> u32 {
    let Some(s) = STATE.get().as_mut() else { return 0 };
    if !x.is_finite() || !y.is_finite() {
        // One NaN in here poisons every sensor reading that ever samples near it.
        return (s.food.len() / 3) as u32;
    }
    if s.food.len() >= 96 * 3 {
        return (s.food.len() / 3) as u32;
    }
    s.food.push(x.clamp(0.0, GRID as f32 - 1.0));
    s.food.push(y.clamp(0.0, GRID as f32 - 1.0));
    s.food.push(FOOD_STORE);
    (s.food.len() / 3) as u32
}

#[no_mangle]
pub extern "C" fn physarum_clear_food() {
    if let Some(s) = STATE.get().as_mut() {
        s.food.clear();
    }
}

#[no_mangle]
pub extern "C" fn physarum_food_count() -> u32 {
    STATE.get().as_ref().map_or(0, |s| (s.food.len() / 3) as u32)
}

/// 0 = starved and resorbing, 1 = thriving.
#[no_mangle]
pub extern "C" fn physarum_vitality() -> f32 {
    STATE.get().as_ref().map_or(0.0, |s| s.vitality)
}

/// Food left across all sources, as a fraction of what has been dropped.
#[no_mangle]
pub extern "C" fn physarum_food_left() -> f32 {
    STATE.get().as_ref().map_or(0.0, |s| {
        let n = s.food.len() / 3;
        if n == 0 {
            return 0.0;
        }
        let left: f32 = s.food.chunks_exact(3).map(|f| f[2]).sum();
        left / (n as f32 * FOOD_STORE)
    })
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
fn sense(trail: &[f32; CELLS], x: f32, y: f32, dx: f32, dy: f32, dist: f32) -> f32 {
    let sx = wrap((x + dx * dist) as i32);
    let sy = wrap((y + dy * dist) as i32);
    trail[sy * GRID + sx]
}

/// One frame: sense, rotate, move, deposit, then diffuse and decay.
#[no_mangle]
pub extern "C" fn physarum_step() {
    let Some(s) = STATE.get().as_mut() else { return };

    // Deposit scales with vitality. A starving colony lays down almost nothing,
    // decay outruns it, and the network resorbs — which is roughly what a
    // plasmodium does when the plate runs out.
    let (dist, speed) = (s.sensor_dist, s.speed);
    let dep = s.deposit * (0.04 + 0.96 * s.vitality);
    // Rotation constants for this frame. Fixed for every agent, so the sensor
    // offsets and the turn are matrix multiplies rather than trig calls.
    let (sc, ss) = (s.sensor_angle.cos(), s.sensor_angle.sin());
    let (tc, ts) = (s.turn_angle.cos(), s.turn_angle.sin());
    let decay = s.decay;
    let diffuse = s.diffuse;

    {
        // Eat, then emit. A source that has been consumed stops calling, which
        // is what lets the network abandon a patch it has finished and go
        // looking elsewhere.
        let State { food, trail, vitality, .. } = s;
        let trail = grid(trail);
        let mut eaten_total = 0.0_f32;

        for f in food.chunks_exact_mut(3) {
            if f[2] <= 0.0 {
                continue;
            }
            let fx = f[0] as i32;
            let fy = f[1] as i32;

            // How much organism is sitting on the source right now.
            let present = trail[wrap(fy) * GRID + wrap(fx)];
            let eaten = (present * EAT_RATE).min(f[2]);
            f[2] -= eaten;
            eaten_total += eaten;

            // Emission fades as the source is consumed, so a nearly-spent flake
            // pulls weakly and the network drifts off it rather than sitting on
            // an empty plate forever.
            let share = (f[2] / FOOD_STORE).clamp(0.0, 1.0);
            let strength = FOOD_STRENGTH * (0.25 + 0.75 * share);
            for dy in -FOOD_RADIUS..=FOOD_RADIUS {
                for dx in -FOOD_RADIUS..=FOOD_RADIUS {
                    let d2 = (dx * dx + dy * dy) as f32;
                    let r2 = (FOOD_RADIUS * FOOD_RADIUS) as f32;
                    if d2 > r2 {
                        continue;
                    }
                    let falloff = 1.0 - (d2 / r2);
                    trail[wrap(fy + dy) * GRID + wrap(fx + dx)] += strength * falloff;
                }
            }
        }

        // Starvation. Upkeep is paid every step whether or not anything was
        // eaten, so an unfed plate winds down instead of holding its shape.
        *vitality = (*vitality + eaten_total * GAIN - UPKEEP).clamp(0.0, 1.0);
    }

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
    {
        // Marked after shading, so a source stays visible even where the trail
        // around it has saturated the ramp.
        let State { food, pixels, .. } = s;
        for f in food.chunks_exact(3) {
            let fx = f[0] as i32;
            let fy = f[1] as i32;
            let share = (f[2] / FOOD_STORE).clamp(0.0, 1.0);
            // Shrinks as it is eaten, so consumption is visible rather than
            // something you have to infer from the network moving on.
            let r = (1.0 + share * 3.0) as i32;
            for dy in -r..=r {
                for dx in -r..=r {
                    if dx * dx + dy * dy > r * r {
                        continue;
                    }
                    let o = (wrap(fy + dy) * GRID + wrap(fx + dx)) * 4;
                    pixels[o] = 255;
                    pixels[o + 1] = (170.0 + 80.0 * share) as u8;
                    pixels[o + 2] = (90.0 + 145.0 * share) as u8;
                }
            }
        }
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
