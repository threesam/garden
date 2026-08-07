//! *Dictyostelium discoideum* aggregation.
//!
//! Starving amoebae signal each other with pulses of cyclic AMP. A cell that
//! detects cAMP above threshold relays it — fires its own pulse — then goes
//! refractory and cannot fire again for a while. That relay-plus-refractory
//! rule is all an excitable medium needs, and it produces the concentric target
//! waves and rotating spirals that sweep a starving plate. Cells crawl up the
//! cAMP gradient between pulses, so every wave that passes ratchets them a
//! little further toward its origin. They stream inward along the wavefronts
//! and pile into mounds.
//!
//! ## Why this one is modelled honestly and physarum is not
//!
//! *Dictyostelium* is a CELLULAR slime mould: thousands of amoebae that stay
//! separate cells for their whole lives, each with its own membrane, nucleus
//! and decision to make. So an agent here is a cell. The particles correspond
//! to something real, the relay rule is the actual signalling mechanism, and
//! the spirals are the real reason spirals appear.
//!
//! Physarum, next door, is the opposite: one giant multinucleate cell, so its
//! agents stand in for cytoplasm and correspond to nothing. Same code shape,
//! completely different standing of the model.
//!
//! ## State of the model
//!
//! Both real patterns appear, and neither is drawn. Founding cells emit
//! concentric target waves; spirals form when a front breaks and the free end
//! winds up.
//!
//! The spirals arrived by REMOVING a cheat, which is worth recording. An earlier
//! version manufactured the broken front a spiral needs — a straight stripe of
//! primed cells backed by a rectangular block of refractory ones. It never
//! produced a spiral, and every straight edge in the output was an edge that had
//! been drawn rather than grown. Replacing it with a few autonomous pacemaker
//! cells produced spirals within a thousand steps: a pacemaker firing on its own
//! clock eventually fires into tissue that has not fully recovered, the front
//! breaks on that heterogeneity, and the free end curls. That is the mechanism
//! in a real culture too. The arrangement was not helping the phenomenon, it was
//! standing in for it and suppressing it.
//!
//! The parameters are constrained, not guessed. A sustained chain needs the
//! spike a single firing puts into its own neighbourhood to clear threshold,
//! while ambient stays below it:
//!
//!   spike   ~= pulse / 9                              (3x3 release footprint)
//!   ambient ~= pulse / (refractory * (1 - decay))     (steady state)
//!
//! Requiring spike > threshold > ambient reduces to `refractory * (1 - decay)`
//! having to clear roughly 9x the margin — and pulse cancels out entirely, which
//! is why tuning pulse alone never moved it. Wavelength is roughly `refractory`
//! cells, so a long refractory satisfies the condition but makes one wave
//! swallow a 512 plate. Short refractory therefore REQUIRES fast decay.
//!
//! What is still abstracted: real cAMP relay runs through receptor binding,
//! adenylyl cyclase and phosphodiesterase degradation with their own kinetics
//! (Martiel–Goldbeter). Here it is a threshold, a pulse and a timer.
//!
//! What was rejected: painting the waves from an analytic spiral/target phase
//! function centred on fixed coordinates. It scores well on every metric and
//! looks better than this does. It is also a drawing of the phenomenon rather
//! than the phenomenon, and the entire reason to model Dictyostelium instead of
//! more Physarum is that here the agents correspond to something real.

use crate::sim::{diffuse_field, grid, rand01, wrap, Global, CELLS, GRID};

struct State {
    /// Interleaved x, y, refractory-timer.
    cells: Vec<f32>,
    /// Extracellular cAMP.
    camp: Vec<f32>,
    scratch: Vec<f32>,
    /// Cells per grid square, rebuilt each step — drives both firing and render.
    density: Vec<f32>,
    pixels: Vec<u8>,
    count: usize,
    rng: u32,
    threshold: f32,
    pulse: f32,
    refractory: f32,
    decay: f32,
    diffuse: f32,
    speed: f32,
    /// Chance per cell per step of firing unprompted. Pacemakers.
    spontaneous: f32,
}

/// How many cells cycle autonomously. A few: each founds an aggregation
/// territory, and too many gives competing patches instead of clean fronts.
const PACEMAKERS: usize = 5;
/// Steps between autonomous firings. Longer than the refractory period, or the
/// centre re-fires into its own recovering tissue and no wave escapes.
const PACEMAKER_PERIOD: f32 = 150.0;

static STATE: Global<Option<State>> = Global::new(None);

/// Allocate and scatter cells uniformly across the plate.
#[no_mangle]
pub extern "C" fn dicty_init(count: u32, seed: u32) -> *const u8 {
    let count = (count as usize).min(2_000_000);
    let mut rng = if seed == 0 { 0x9E37_79B9 } else { seed };

    let mut cells = vec![0.0_f32; count * 3];
    for i in 0..count {
        cells[i * 3] = rand01(&mut rng) * GRID as f32;
        cells[i * 3 + 1] = rand01(&mut rng) * GRID as f32;
        cells[i * 3 + 2] = 0.0;
    }

    // Founding cells.
    //
    // A handful of individual amoebae, primed to fire on the first step. That
    // is how a real plate starts: aggregation centres are founded by single
    // pacemaker cells, not by fronts appearing fully formed. Everything else
    // gets a randomised recovery phase so the plate does not flash in unison
    // and then sit dead.
    //
    // A previous version drew a straight stripe of primed cells backed by a
    // rectangular block of refractory ones, to manufacture the broken wavefront
    // a spiral needs. It worked as a symmetry break and it looked wrong: every
    // straight edge on screen was an edge I had drawn, and only the one
    // propagating front was shaped by the simulation. Prescribing the geometry
    // at t=0 is milder than painting it every frame, but it is the same species
    // of cheat, and it is visible. Point sources give circular waves and no
    // straight lines anywhere.
    //
    // Fronts in a discrete cell layer pinch and break on their own, which is
    // what produces spirals here without anyone arranging one.
    for i in 0..count {
        cells[i * 3 + 2] = rand01(&mut rng) * (400.0);
    }
    // The first PACEMAKERS cells in the array are autonomous oscillators, and
    // their slots are stable because cells are never reordered. Real founding
    // cells cycle on their own rather than waiting to be told; without that a
    // centre fires once, emits a single ring and goes quiet forever, which is
    // why the plate produced lone expanding discs instead of the trains of
    // concentric rings a starving culture actually shows.
    for i in 0..PACEMAKERS.min(count) {
        cells[i * 3] = rand01(&mut rng) * GRID as f32;
        cells[i * 3 + 1] = rand01(&mut rng) * GRID as f32;
        cells[i * 3 + 2] = rand01(&mut rng) * PACEMAKER_PERIOD;
    }

    // No seeded field. The founding cells above put the first cAMP into it.
    let camp = vec![0.0_f32; CELLS];

    let slot = STATE.get();
    *slot = Some(State {
        cells,
        camp,
        scratch: vec![0.0_f32; CELLS],
        density: vec![0.0_f32; CELLS],
        pixels: vec![0_u8; CELLS * 4],
        count,
        rng,
        // Tuned by rendering a sweep. The balance that matters is ambient cAMP
        // versus threshold: with a low threshold every cell fires the moment its
        // refractory clears, the plate flickers globally and no wave ever
        // propagates. Ambient settles near pulse / (refractory * (1 - decay)),
        // and the threshold has to sit above that.
        threshold: 4.57,
        pulse: 60.0,
        refractory: 45.0,
        decay: 0.65,
        diffuse: 0.92,
        // Slow, so the cell layer stays continuous long enough to carry waves.
        // Fast chemotaxis empties the medium into mounds within a few hundred
        // steps and the signalling dies with it.
        speed: 0.55,
        // Deliberately rare. Each spontaneous firing founds an aggregation
        // centre, and frequent ones give hundreds of small competing patches
        // instead of a few large spirals.
        spontaneous: 0.000_000_3,
    });
    slot.as_ref().map_or(core::ptr::null(), |s| s.pixels.as_ptr())
}

#[no_mangle]
pub extern "C" fn dicty_tune(
    threshold: f32,
    pulse: f32,
    refractory: f32,
    decay: f32,
    diffuse: f32,
    speed: f32,
    spontaneous: f32,
) {
    if let Some(s) = STATE.get().as_mut() {
        s.threshold = threshold.max(0.001);
        s.pulse = pulse;
        s.refractory = refractory.max(1.0);
        s.decay = decay.clamp(0.5, 0.999);
        s.diffuse = diffuse.clamp(0.0, 1.0);
        s.speed = speed;
        s.spontaneous = spontaneous.clamp(0.0, 0.01);
    }
}

/// One step: diffuse, relay, chemotax, render.
#[no_mangle]
pub extern "C" fn dicty_step() {
    let Some(s) = STATE.get().as_mut() else { return };
    let (threshold, pulse, refractory, speed, spontaneous) =
        (s.threshold, s.pulse, s.refractory, s.speed, s.spontaneous);
    let (decay, diffuse) = (s.decay, s.diffuse);

    {
        let State { camp, scratch, .. } = s;
        diffuse_field(grid(camp), grid(scratch), decay, diffuse);
    }
    core::mem::swap(&mut s.camp, &mut s.scratch);

    {
        // `scratch` holds the PREVIOUS frame's field, because the swap above put
        // the new one in `camp`. Comparing the two tells a cell whether the
        // signal it is standing in is rising or falling, with no per-cell memory.
        let State { cells, camp, scratch, density, rng, .. } = s;
        let camp = grid(camp);
        let previous = grid(scratch);
        let density = grid(density);
        density.fill(0.0);

        for (idx, c) in cells.chunks_exact_mut(3).enumerate() {
            let pacemaker = idx < PACEMAKERS;
            let x = c[0];
            let y = c[1];
            let ix = wrap(x as i32);
            let iy = wrap(y as i32);
            let here = camp[iy * GRID + ix];
            density[iy * GRID + ix] += 1.0;

            if pacemaker {
                // Cycles on its own clock, ignoring the field entirely.
                c[2] -= 1.0;
                if c[2] <= 0.0 {
                    let ninth = pulse * (1.0 / 9.0);
                    for dy in -1_i32..=1 {
                        let row = wrap(iy as i32 + dy) * GRID;
                        for dx in -1_i32..=1 {
                            camp[row + wrap(ix as i32 + dx)] += ninth;
                        }
                    }
                    c[2] = PACEMAKER_PERIOD;
                }
                continue;
            }

            // Relay and crawling are INDEPENDENT. Conflating them was a bug:
            // firing used to skip the movement code, and since a cell on a
            // rising front is almost always over threshold, nearly every cell
            // that had a reason to move fired instead and stayed put. The
            // population never aggregated at all. A real amoeba relays the pulse
            // AND crawls; the refractory period silences its voice, not its legs.

            // --- relay ---
            let recovered = c[2] <= 0.0;
            if !recovered {
                c[2] -= 1.0;
            } else if here > threshold || rand01(rng) < spontaneous {
                let ninth = pulse * (1.0 / 9.0);
                for dy in -1_i32..=1 {
                    let row = wrap(iy as i32 + dy) * GRID;
                    for dx in -1_i32..=1 {
                        camp[row + wrap(ix as i32 + dx)] += ninth;
                    }
                }
                c[2] = refractory;
            }

            // --- chemotaxis ---
            // ADAPTATION: climb only while the signal is RISING, i.e. on the
            // front of an incoming wave, and ignore it as the wave recedes.
            //
            // This is the whole reason aggregation works. A travelling wave is
            // symmetric, so without adaptation a cell walks toward the
            // approaching front, the front passes, the gradient reverses, and it
            // walks back. Net displacement zero. Responding to the rising phase
            // only rectifies that oscillation into real movement toward the
            // source, which is why amoebae stream inward rather than jitter.
            if here <= previous[iy * GRID + ix] {
                continue;
            }

            let l = camp[iy * GRID + wrap(ix as i32 - 2)];
            let r = camp[iy * GRID + wrap(ix as i32 + 2)];
            let d = camp[wrap(iy as i32 - 2) * GRID + ix];
            let u = camp[wrap(iy as i32 + 2) * GRID + ix];
            let gx = r - l;
            let gy = u - d;
            let mag = (gx * gx + gy * gy).sqrt();
            if mag <= 1e-6 {
                continue;
            }
            let mut nx = x + (gx / mag) * speed;
            let mut ny = y + (gy / mag) * speed;

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
            c[0] = nx;
            c[1] = ny;
        }
    }

    {
        let count = s.count;
        let State { camp, density, pixels, .. } = s;
        shade(grid(camp), grid(density), pixels, count);
    }
}

/// Cold cAMP waves, warm cell bodies on top.
///
/// Two channels deliberately: the signal and the tissue are different things,
/// and rendering both in one ramp hides which is which. The waves are the
/// conversation; the bright streams are the cells answering it.
fn shade(camp: &[f32; CELLS], density: &[f32; CELLS], pixels: &mut [u8], count: usize) {
    // Baseline scales with the MEAN density, not a fixed constant. Hard-coding
    // it meant the unaggregated layer cleared at one cell count and flooded the
    // plate with speckle at another, burying the waves whenever the population
    // changed.
    let baseline = (count as f32 / CELLS as f32) * 1.15;
    for (i, px) in pixels.chunks_exact_mut(4).enumerate() {
        let w = camp[i] * 0.55;
        let wave = (w / (1.0 + w)).sqrt();
        // Only genuine clumping should light up, never the resting layer.
        let d = (density[i] - baseline).max(0.0) * 0.55;
        let cells = d / (1.0 + d);

        // Teal wavefronts.
        let mut r = 10.0 + wave * 38.0;
        let mut g = 14.0 + wave * 150.0;
        let mut b = 20.0 + wave * 170.0;
        // Cells sit over the top in warm cream, so streaming reads against the
        // signal rather than blending into it.
        r += cells * 232.0;
        g += cells * 190.0;
        b += cells * 120.0;

        px[0] = r.min(255.0) as u8;
        px[1] = g.min(255.0) as u8;
        px[2] = b.min(255.0) as u8;
        px[3] = 255;
    }
}

#[no_mangle]
pub extern "C" fn dicty_pixels() -> *const u8 {
    STATE
        .get()
        .as_ref()
        .map_or(core::ptr::null(), |s| s.pixels.as_ptr())
}

