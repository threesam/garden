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

use crate::sim::{diffuse_field, grid, rand01, wrap, xorshift, Global, CELLS, GRID};

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
    /// Which source owns each cell, as index+1; 0 for none. Rebuilt every step
    /// while emitting, so it tracks each source's shrinking footprint exactly.
    /// This is what lets consumption be driven by agents ACTUALLY standing on
    /// the food, at one lookup per agent rather than a distance test per agent
    /// per source.
    food_map: Vec<u8>,
    /// Agents standing on each source this step.
    grazing: Vec<f32>,
    /// 0 = starved, 1 = well fed. Scales trail deposit, speed and population.
    vitality: f32,
    /// Vitality earned per step, smoothed. Compared against upkeep, this is
    /// what separates growing from merely holding on.
    ///
    /// Smoothed because the raw per-step figure swings with which sources the
    /// network happens to be sitting on, and reading it directly made the
    /// reported state flap between "starving" and "stable" several times a
    /// second while nothing meaningful was changing.
    intake: f32,
    /// Living agents. The loop walks only this many; the rest of the buffer is
    /// unhatched stock, so growth and death both just move this number and
    /// nothing is ever reallocated.
    ///
    /// Starts at a FRACTION of the buffer, not all of it. Filling the buffer at
    /// init made the starting size the ceiling: feeding a healthy colony did
    /// nothing at all, because there was nowhere for it to grow to. Room to
    /// expand is what makes feeding it feel like feeding something.
    active: usize,
    /// The size reported as 100%. Deliberately well below the buffer, so a
    /// well-fed colony reads over 100% rather than pinning at it — a ceiling
    /// that is also the label makes thriving indistinguishable from merely
    /// full.
    nominal: usize,
    /// Food scent, rebuilt from scratch each step. SEPARATE from the trail on
    /// purpose: agents sense trail+scent, but only the trail is drawn. While
    /// food emitted into the trail, anything with enough reach to be findable
    /// was also a giant glowing disc on screen, and a handful of sources washed
    /// the plate out completely. Splitting them lets the scent be as wide as
    /// discovery needs while the food shows as nothing but its marker.
    scent: Vec<f32>,
    /// trail + scent. What agents actually steer by.
    field: Vec<f32>,
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
        // Capacity is exact and adds are capped at MAX_FOOD, so pushing a
        // source can never reallocate. A realloc here could grow wasm memory,
        // which silently detaches every view JS is holding.
        food: Vec::with_capacity(MAX_FOOD * 3),
        food_map: vec![0_u8; CELLS],
        grazing: vec![0.0_f32; MAX_FOOD],
        vitality: 1.0,
        // Opens at break-even rather than zero: the smoothed figure takes a
        // few hundred steps to climb, and starting it at nothing reported a
        // freshly-seeded plate as "starving" for its first seconds.
        intake: UPKEEP,
        active: (count / 8).max(1),
        nominal: (count * 2 / 5).max(1),
        scent: vec![0.0_f32; CELLS],
        field: vec![0.0_f32; CELLS],
    };

    // A few flakes to open with. Without them the plate starts starving on the
    // first frame and the piece opens on something already dying — the feeding
    // is the interaction, so it needs to begin alive and become your problem.
    //
    // Seeded into the local State BEFORE it is stored. Calling physarum_add_food
    // here instead meant holding `&mut Option<State>` from STATE.get() while
    // that function took a second one — two live mutable borrows of the same
    // data, which is undefined behaviour and exactly what Global::get's own
    // contract forbids.
    let mut state = state;
    for _ in 0..3 {
        state.food.push(90.0 + rand01(&mut rng) * (GRID as f32 - 180.0));
        state.food.push(90.0 + rand01(&mut rng) * (GRID as f32 - 180.0));
        state.food.push(FOOD_STORE);
    }

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
/// Emission accumulates: with decay d, a source settles at roughly
/// strength/(1-d), which is ~25x the per-step amount. At 9.0 that put the centre
/// near 225 against agent trails of 20-60 — the food outshone the organism by an
/// order of magnitude, saturated the gradient flat inside its own radius so
/// agents arriving had nothing to steer by, and rendered as a wall of discs.
/// Peak scent at a source. A direct value, not something that accumulates — the
/// scent field is rebuilt each step rather than deposited into, so this is
/// simply how tall the hill is.
///
/// It has to overtop an established trail or the colony ignores food entirely.
/// Self-reinforced filaments run far brighter than a modest hill, so agents
/// never left them: measured at 46, the plate starved with six flakes sitting on
/// it and 0.08 of one eaten across 2,500 steps. Raising it is free now that
/// scent is a separate field from the one that gets drawn — this is the whole
/// reason for the split.
const FOOD_STRENGTH: f32 = 480.0;
/// Reach of the scent, in cells.
///
/// Wide because DISCOVERY turned out to be the binding constraint. At 34 on a
/// 512 plate a source could only be found by an agent blundering within a few
/// dozen cells of it, and an established network stops wandering — so roughly a
/// fifth of every plate was never eaten at all, sources sat stranded forever,
/// and the colony starved beside food it could not smell. Measured: reach 34
/// leaves 21% uneaten indefinitely, reach 70 consumes the plate to zero. The
/// peak is unchanged by this; only how far the gradient carries.
const FOOD_RADIUS: i32 = 70;
/// The physical flake, as opposed to how far it can be smelled.
///
/// Grazing is limited to this, not to scent reach. Letting agents eat anywhere
/// they could smell food meant a source was being consumed by every agent
/// within 70 cells — roughly 12,000 of them — and ten flakes disappeared in
/// twenty seconds. You eat what you are standing on.
const BITE_RADIUS: f32 = 15.0;
const MAX_FOOD: usize = 96;
/// How much a source holds when dropped.
const FOOD_STORE: f32 = 12_000.0;
/// Eaten per agent standing on a source, per step.
///
/// A full-size source covers ~3,600 cells and the plate runs ~0.57 agents per
/// cell, so roughly 2,000 agents graze a fresh flake every step. At 0.0065 that
/// stripped a source in under 90 steps — the whole plate was bare in twelve
/// seconds and dead a few seconds later. Sized now for a source to last a
/// minute or so of steady grazing, and the footprint shrinks as it goes, so the
/// last of it takes longer than the first.
// Lower than it looks like it should be, because agents now HALT on food and
// pile up: a flake carries thousands of grazers rather than whatever happens to
// be passing, so the same rate stripped three sources in about fifteen seconds.
const BITE: f32 = 0.0013;
/// Fraction of the living population lost per step while starved, and regained
/// per step while well fed. Dying is faster than breeding, so a plate left alone
/// empties in well under a minute but takes longer to come back.
const DIE_RATE: f32 = 1.0 / 1_400.0;
/// Growth only runs on genuine surplus — vitality already full and still
/// climbing — so a colony that is merely getting by holds its size and one with
/// more food than it needs spreads into it.
const BREED_RATE: f32 = 1.0 / 6_000.0;
/// Fraction of the population that survives starvation as a dormant remnant.
///
/// Without a floor the colony is a one-way trip: at zero agents nothing grazes,
/// so nothing is eaten, so vitality can never rise — feeding a dead plate did
/// nothing at all and the piece was unrecoverable. A remnant is also what the
/// organism does. Starved physarum forms a sclerotium, sits dormant, and
/// revives when food returns.
const DORMANT_SHARE: usize = 60;
/// Ceiling on trail concentration.
///
/// Without one, an established artery runs away: it is self-reinforcing, so the
/// brighter it gets the more agents it holds. On a mature artery the difference
/// between an agent's three sensors is in the hundreds, while a scent hill
/// broad enough to be findable differs by about ten across the same span — so
/// food can never out-steer a trail, whatever its peak. Measured: raising scent
/// tenfold moved a clustered plate from 51% eaten to 60%. Capacity is the fix,
/// not volume, and a real tube saturates too.
const TRAIL_MAX: f32 = 90.0;
/// Ceiling the scent approaches as sources pile up.
///
/// Summed scent is unbounded, and with a plate full of food it ran to thousands
/// against a trail capped at 90 — so trails stopped contributing to steering at
/// all, nothing self-reinforced, and the network simply failed to form. The
/// colony parked on the food and drew one thread.
///
/// Applied as a soft saturation rather than a clamp: `raw/(raw+MAX)` compresses
/// without ever going flat, so a dense patch still has a peak to climb. A hard
/// clamp would bring back the mesa — a plateau with no gradient inside it.
///
/// Sized RELATIVE to TRAIL_MAX, which is the part that matters. At 400 against a
/// trail capped at 90 the scent was over four times the trail, so with a plate
/// full of food the trail stopped shaping anything: agents steered by scent
/// alone, the network dissolved, and the colony could triple while the visible
/// network shrank to a third. One source now reads ~120 and sixteen read ~158,
/// so food always outweighs a trail without ever erasing it.
const SCENT_MAX: f32 = 160.0;
/// Share of the colony that scouts: breaks off course at random.
///
/// Without scouts a settled colony is blind. Trail-followers stay on trails, so
/// anything further than scent reach from an existing filament is never found —
/// a plate with food round its edges sat stable and full while the network held
/// one loop in the middle and starved later beside it. Scouts keep covering
/// ground, and when one crosses a scent hill it homes in and lays trail the rest
/// of the colony can follow. That is what an exploratory pseudopod is for.
const SCOUT_SHARE: usize = 22;

/// Standing cost of being alive, per step, against what eating returns. Balanced
/// so a couple of sources sustain the colony and an empty plate starves it.
///
/// Deliberately tuned so ONE source cannot quite pay for the colony while two
/// or three can. A single flake means a slow decline rather than a stable
/// equilibrium, which is what makes tending it a live decision instead of a
/// thing you set up once.
///
/// Sized against what one source actually returns. A full-size flake is grazed
/// by ~2,000 agents a step, which at BITE earns ~0.0013 of vitality — so upkeep
/// has to sit under that or a single source cannot pay for the colony and every
/// run ends in the same death spiral: intake dips, population falls, fewer
/// agents graze, intake dips further. One flake now roughly breaks even, two
/// thrive, none starves the plate over about half a minute.
const UPKEEP: f32 = 0.0006;
const GAIN: f32 = 0.00025;

/// Place a food source, in grid coordinates. Returns the new source count.
#[no_mangle]
pub extern "C" fn physarum_add_food(x: f32, y: f32) -> u32 {
    let Some(s) = STATE.get().as_mut() else { return 0 };
    if !x.is_finite() || !y.is_finite() {
        // One NaN in here poisons every sensor reading that ever samples near it.
        return (s.food.len() / 3) as u32;
    }
    if s.food.len() >= MAX_FOOD * 3 {
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

/// Living agents, counted.
///
/// A raw number rather than a share. A percentage needs a denominator, and every
/// candidate lied: against the buffer it reads as a ceiling the colony pins at,
/// and against a nominal size it implies the render should look proportionally
/// bigger — which it does not, because the number counts agents while the screen
/// shows trail, and those come apart whenever agents are parked on food or
/// vitality thins their deposits. A count claims nothing it cannot back up.
#[no_mangle]
pub extern "C" fn physarum_active() -> u32 {
    STATE.get().as_ref().map_or(0, |s| s.active as u32)
}

/// TOTAL food on the plate, in whole flakes. Three untouched sources read 3.0.
///
/// An absolute amount, not a mean share. The share jumped around uselessly —
/// dropping ten fresh flakes next to one nearly-spent source made the number go
/// UP, because the average got healthier while the plate got busier.
#[no_mangle]
pub extern "C" fn physarum_food_total() -> f32 {
    STATE.get().as_ref().map_or(0.0, |s| {
        let left: f32 = s.food.chunks_exact(3).map(|f| f[2]).sum();
        left / FOOD_STORE
    })
}

/// 0 dead, 1 starving, 2 stable, 3 growing.
#[no_mangle]
pub extern "C" fn physarum_state() -> u32 {
    STATE.get().as_ref().map_or(0, |s| {
        // Read off the energy balance, with a dead band so the label does not
        // flicker while the colony is merely breaking even.
        let floor = (s.nominal / DORMANT_SHARE).max(1);
        if s.vitality <= 0.02 && s.active <= floor {
            0
        } else if s.intake < UPKEEP * 0.85 {
            1
        } else if s.intake > UPKEEP * 1.15 && s.active < s.count {
            3
        } else {
            2
        }
    })
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
    let (dist, vit) = (s.sensor_dist, s.vitality);
    let dep = s.deposit * (0.04 + 0.96 * vit);
    // Starving agents crawl. With nothing to move toward they should not be out
    // exploring at full pace, and the slowdown compounds with the thinner
    // deposit so an unfed plate visibly winds down rather than idling.
    let speed = s.speed * (0.15 + 0.85 * vit);
    // Rotation constants for this frame. Fixed for every agent, so the sensor
    // offsets and the turn are matrix multiplies rather than trig calls.
    let (sc, ss) = (s.sensor_angle.cos(), s.sensor_angle.sin());
    let (tc, ts) = (s.turn_angle.cos(), s.turn_angle.sin());
    let decay = s.decay;
    let diffuse = s.diffuse;

    {
        // Rebuild the scent hills and the combined sensing field, and stamp
        // which source owns each cell as we go.
        let State { food, trail, scent, field, food_map, grazing, .. } = s;
        let trail = grid(trail);
        let scent = grid(scent);
        let field = grid(field);
        scent.fill(0.0);
        food_map.fill(0);
        grazing.fill(0.0);

        for (i, f) in food.chunks_exact(3).enumerate() {
            if f[2] <= 0.0 {
                continue;
            }
            let fx = f[0] as i32;
            let fy = f[1] as i32;
            let share = (f[2] / FOOD_STORE).clamp(0.0, 1.0);

            // Reach narrows only slightly as a source is consumed and never
            // drops below sensing range. Tying reach to remaining mass stranded
            // a fifth of every plate: a half-eaten flake stopped calling far
            // enough to hold the network, the network left, and with nobody
            // standing on it the rest could never be grazed. Measured — reach
            // that shrank with mass left 21% uneaten indefinitely.
            let radius = ((FOOD_RADIUS as f32) * (0.58 + 0.42 * share.sqrt())).round() as i32;
            let r2 = (radius * radius) as f32;
            let bite_r = BITE_RADIUS * share.sqrt();
            let bite2 = bite_r * bite_r;
            for dy in -radius..=radius {
                let row = wrap(fy + dy) * GRID;
                for dx in -radius..=radius {
                    let d2 = (dx * dx + dy * dy) as f32;
                    if d2 > r2 {
                        continue;
                    }
                    let cell = row + wrap(fx + dx);
                    // Overlapping sources ADD. Taking the max instead made a
                    // dense patch a mesa — flat on top, steep at the rim — so
                    // agents inside it read the same value in every direction
                    // and had nothing to climb. They collected on the edge and
                    // circled it, and every flake in the middle went untouched.
                    // Summing makes a cluster a peak, and a peak can be walked
                    // up. The total is never drawn, so it is free to be large.
                    scent[cell] += FOOD_STRENGTH * (1.0 - d2 / r2);
                    // Only the flake itself can be eaten, and it shrinks as it
                    // goes — so the last of a source takes longer than the first.
                    if d2 <= bite2 {
                        food_map[cell] = (i + 1) as u8;
                    }
                }
            }
        }

        // The divide runs only where there is scent to compress. Most of the
        // plate has none, and paying for it everywhere cost about two thirds of
        // the frame rate.
        for i in 0..CELLS {
            let raw = scent[i];
            field[i] = if raw > 0.0 {
                trail[i] + SCENT_MAX * raw / (raw + SCENT_MAX)
            } else {
                trail[i]
            };
        }
    }

    {
        // Split borrows so the agent walk and the trail writes are independent,
        // and walk fixed-size chunks so field access needs no bounds check.
        let State { agents, trail, field, rng, food_map, grazing, active, .. } = s;
        let trail = grid(trail);
        let field = grid(field);
        let living = *active * 4;

        let scouts = (*active / SCOUT_SHARE).max(1) * 4;
        for (idx, a) in agents[..living].chunks_exact_mut(4).enumerate() {
            // Scouts break off course at random rather than steering by a
            // separate field. Reading a second grid per agent meant a third
            // random access into a megabyte every step, and selecting the array
            // at runtime stopped the sensing being specialised — together that
            // cost 3x the frame time. A dice roll costs nothing and still peels
            // them off established trails, which is all exploration needs.
            let scout = idx * 4 < scouts;
            let x = a[0];
            let y = a[1];
            let mut dx = a[2];
            let mut dy = a[3];

            let f = sense(field, x, y, dx, dy, dist);
            let l = sense(field, x, y, dx * sc + dy * ss, -dx * ss + dy * sc, dist);
            let r = sense(field, x, y, dx * sc - dy * ss, dx * ss + dy * sc, dist);
            let wander = scout && (xorshift(rng) & 7) == 0;

            // Steering. The random branch when both flanks tie is what makes
            // the network branch instead of settling into smooth channels.
            // Written as explicit branches rather than a sign multiply. The
            // tidier `Option<bool>` + sign form measured ~65% slower per agent:
            // it trades two predictable branches for extra float work on every
            // single agent, and at a million a frame that is not a wash.
            if wander {
                // Off course on purpose.
                let nx = if xorshift(rng) & 1 == 0 {
                    let t = dx * tc + dy * ts;
                    dy = -dx * ts + dy * tc;
                    t
                } else {
                    let t = dx * tc - dy * ts;
                    dy = dx * ts + dy * tc;
                    t
                };
                dx = nx;
            } else if f > l && f > r {
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
            // Standing on food? Crawl. An agent senses five cells AHEAD, so on a
            // peak all three of its sensors read downhill and it can never
            // settle — it overshoots and circles, and the colony renders as a
            // ring orbiting the food instead of covering it. Amoebae stop and
            // feed when they find something; slowing to a crawl is what lets
            // them accumulate on a flake and actually strip it.
            let on_food = food_map[wrap(y as i32) * GRID + wrap(x as i32)] != 0;
            let step = if on_food { speed * 0.25 } else { speed };
            let mut nx = x + dx * step;
            let mut ny = y + dy * step;
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
            let cell = wrap(ny as i32) * GRID + wrap(nx as i32);
            // A scout crossing empty ground lays almost nothing — at full
            // strength nine thousand of them cover the plate in grain. It marks
            // properly only once it is standing in scent, which is the point:
            // the trail back from a find has to be strong enough for the rest of
            // the colony to follow, and everything before the find does not.
            // Scouts crossing empty ground lay almost nothing; at full strength
            // thousands of them cover the plate in grain. On a flake they mark
            // properly, so the route back from a find is worth following.
            let owner = food_map[cell];
            let lay = if scout && owner == 0 { dep * 0.16 } else { dep };
            trail[cell] = (trail[cell] + lay).min(TRAIL_MAX);

            // Consumption is driven by agents actually standing on a source.
            // The previous proxy read the trail at the source's centre, which
            // includes the source's OWN emission — so a flake ate itself at full
            // rate whether or not the network ever arrived.
            if owner != 0 {
                grazing[(owner - 1) as usize] += 1.0;
            }
        }
    }

    {
        // Consume what was grazed, then settle the colony's books.
        let State { food, grazing, vitality, intake, .. } = s;
        let mut eaten = 0.0_f32;
        for (i, f) in food.chunks_exact_mut(3).enumerate() {
            if f[2] <= 0.0 {
                continue;
            }
            let bite = (grazing[i] * BITE).min(f[2]);
            f[2] -= bite;
            eaten += bite;
        }
        // Upkeep is paid every step whether or not anything was eaten, so an
        // unfed plate winds down instead of holding its shape indefinitely.
        *intake += (eaten * GAIN - *intake) * 0.02;
        *vitality = (*vitality + *intake - UPKEEP).clamp(0.0, 1.0);
    }

    {
        // Population. Starving kills agents off; a well-fed colony repopulates
        // from the dead stock still sitting in the buffer. Nothing is allocated
        // either way — `active` just moves.
        let vit = s.vitality;
        if vit <= 0.02 {
            let floor = (s.nominal / DORMANT_SHARE).max(1);
            let loss = ((s.active as f32) * DIE_RATE).ceil() as usize;
            s.active = s.active.saturating_sub(loss.max(1)).max(floor);
        } else if vit >= 0.995 && s.intake > UPKEEP && s.active < s.count {
            // Health is full and intake still exceeds upkeep, so the surplus
            // has nowhere to go but more of it.
            let gain = ((s.count as f32) * BREED_RATE).ceil() as usize;
            s.active = (s.active + gain.max(1)).min(s.count);
        }
    }

    {
        // Drop spent sources, in place. A fresh Vec here could reallocate, and a
        // realloc can grow wasm memory, which detaches every view JS holds.
        let food = &mut s.food;
        let mut write = 0;
        for read in 0..(food.len() / 3) {
            if food[read * 3 + 2] > 0.0 {
                if write != read {
                    food[write * 3] = food[read * 3];
                    food[write * 3 + 1] = food[read * 3 + 1];
                    food[write * 3 + 2] = food[read * 3 + 2];
                }
                write += 1;
            }
        }
        food.truncate(write * 3);
    }

    {
        let State { trail, scratch, .. } = s;
        diffuse_field(grid(trail), grid(scratch), decay, diffuse);
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
            // The marker IS the flake: same radius grazing uses, so what you
            // see is exactly what can be eaten.
            let r = (BITE_RADIUS * share.sqrt()).round() as i32;
            if r < 1 {
                continue;
            }
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

/// Blur and shade stay SEPARATE traversals, despite both walking all CELLS.
/// Merging them — one pass, blurred value already in a register — was tried and
/// measured 60% SLOWER: mixing the float-heavy blur with byte-wide pixel writes
/// in one loop defeats the vectorisation each simple loop gets on its own. The
/// redundant traversal is cheaper than the lost vectorisation.
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

