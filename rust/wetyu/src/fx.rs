//! Effects are plugins: anything implementing [`Effect`] can sit on a loop.
//! The engine wraps one per channel in a [`Slot`] that handles the wet/dry
//! ramp, so an effect only ever sees samples in and samples out.
//!
//! Three built-ins ship: a tempo-synced delay (mic), an octave-up through a
//! phaser (keys), and a bit crush into a small spring-ish reverb (drums).
//! Effects run post-gate so tails ring while shift is held. All memory is
//! allocated in the constructors — nothing on the audio path allocates.

use core::f32::consts::{PI, TAU};

pub trait Effect: Send {
    /// Once per block, before any samples: LFOs, coefficient refreshes.
    fn begin_block(&mut self, _frames: usize) {}
    /// The tempo changed; `samples` is one beat.
    fn set_beat(&mut self, _samples: usize) {}
    fn process(&mut self, x: f32) -> f32;
}

/// Built-in plugin ids, in channel order: mic, keys, drums.
pub const BUILTIN: [&str; 3] = ["delay", "octaver", "crush"];

pub fn builtin(id: usize, sr: f32) -> Option<Box<dyn Effect>> {
    Some(match id {
        0 => Box::new(Delay::new(sr)),
        1 => Box::new(Octaver::new(sr)),
        2 => Box::new(Crush::new(sr)),
        _ => return None,
    })
}

/// A plugin plus its wet/dry ramp.
pub struct Slot {
    pub effect: Box<dyn Effect>,
    wet: f32,
    target: f32,
}

impl Slot {
    pub fn new(effect: Box<dyn Effect>) -> Self {
        Self {
            effect,
            wet: 0.0,
            target: 0.0,
        }
    }

    pub fn set(&mut self, on: bool) {
        self.target = if on { 1.0 } else { 0.0 };
    }

    pub fn wet(&self) -> f32 {
        self.wet
    }

    pub fn is_on(&self) -> bool {
        self.target > 0.5
    }

    /// The effect always runs (tails stay continuous); the ramp only decides
    /// how much of it you hear.
    #[inline]
    pub fn process(&mut self, x: f32, step: f32) -> f32 {
        let y = self.effect.process(x);
        self.wet += (self.target - self.wet).clamp(-step, step);
        x + (y - x) * self.wet
    }
}

/// A circular buffer: read the oldest sample, write a new one, advance.
struct Line {
    buf: Vec<f32>,
    i: usize,
}

impl Line {
    fn new(len: usize) -> Self {
        Self {
            buf: vec![0.0; len.max(1)],
            i: 0,
        }
    }

    /// The sample written `len` turns ago.
    #[inline]
    fn peek(&self, len: usize) -> f32 {
        self.buf[self.i % len.clamp(1, self.buf.len())] // masked, in range
    }

    /// Overwrite that slot and advance.
    #[inline]
    fn push(&mut self, x: f32, len: usize) {
        let len = len.clamp(1, self.buf.len());
        self.buf[self.i % len] = x; // masked, in range
        self.i = (self.i + 1) % len;
    }
}

// ---- delay ------------------------------------------------------------------

/// Dotted-eighth feedback delay, synced to the tempo.
pub struct Delay {
    line: Line,
    len: usize,
}

impl Delay {
    pub fn new(sr: f32) -> Self {
        Self {
            line: Line::new((2.0 * sr) as usize),
            len: (0.375 * sr) as usize,
        }
    }
}

impl Effect for Delay {
    fn set_beat(&mut self, samples: usize) {
        self.len = samples * 3 / 4;
    }

    #[inline]
    fn process(&mut self, x: f32) -> f32 {
        // Dry stays; echoes stack on top and feed back.
        let y = self.line.peek(self.len);
        self.line.push(x + y * 0.45, self.len);
        x + y * 0.7
    }
}

// ---- octaver + phaser -------------------------------------------------------

/// Full-wave rectification doubles a bass note's fundamental (the octave-fuzz
/// trick); a one-pole high-pass drops the DC it adds; four first-order
/// all-passes swept by a slow LFO make the phaser.
pub struct Octaver {
    sr: f32,
    hp_x: f32,
    hp_y: f32,
    ap_x: [f32; 4],
    ap_y: [f32; 4],
    a: f32,
    lfo: f32,
}

impl Octaver {
    pub fn new(sr: f32) -> Self {
        Self {
            sr,
            hp_x: 0.0,
            hp_y: 0.0,
            ap_x: [0.0; 4],
            ap_y: [0.0; 4],
            a: 0.0,
            lfo: 0.0,
        }
    }
}

impl Effect for Octaver {
    fn begin_block(&mut self, frames: usize) {
        self.lfo = (self.lfo + 0.5 * frames as f32 / self.sr).fract();
        let f = 300.0 + 850.0 * (1.0 + (self.lfo * TAU).sin());
        let t = (PI * f / self.sr).tan();
        self.a = (t - 1.0) / (t + 1.0);
    }

    #[inline]
    fn process(&mut self, x: f32) -> f32 {
        // Octave up: rectify, then a ~40 Hz one-pole high-pass eats the DC.
        let r = x.abs() * 2.0;
        let hp = r - self.hp_x + 0.995 * self.hp_y;
        self.hp_x = r;
        self.hp_y = hp;
        // Phaser: four all-pass stages, mixed with the input for the notches.
        let a = self.a;
        let mut v = hp;
        for i in 0..4 {
            let y = a * v + self.ap_x[i] - a * self.ap_y[i];
            self.ap_x[i] = v;
            self.ap_y[i] = y;
            v = y;
        }
        (hp + v) * 0.5
    }
}

// ---- crush + spring ---------------------------------------------------------

/// 8-bit, 1/6-rate sample-and-hold into a Schroeder reverb with short combs.
pub struct Crush {
    hold: f32,
    n: u32,
    combs: [Line; 3],
    aps: [Line; 2],
}

const COMB_FB: f32 = 0.77;
const AP_G: f32 = 0.7;

impl Crush {
    pub fn new(sr: f32) -> Self {
        let s = |seconds: f32| (seconds * sr) as usize;
        Self {
            hold: 0.0,
            n: 0,
            combs: [Line::new(s(0.0297)), Line::new(s(0.0371)), Line::new(s(0.0411))],
            aps: [Line::new(s(0.005)), Line::new(s(0.0017))],
        }
    }
}

impl Effect for Crush {
    #[inline]
    fn process(&mut self, x: f32) -> f32 {
        // Crush: hold every sixth sample, 8-bit steps.
        if self.n.is_multiple_of(6) {
            self.hold = (x * 127.0).round() / 127.0;
        }
        self.n = self.n.wrapping_add(1);
        let dry = self.hold;
        // Spring-ish: three short parallel combs into two series all-passes.
        let mut wet = 0.0;
        for comb in &mut self.combs {
            let len = comb.buf.len();
            let y = comb.peek(len);
            comb.push(dry + y * COMB_FB, len);
            wet += y;
        }
        wet /= 3.0;
        for ap in &mut self.aps {
            let len = ap.buf.len();
            let d = ap.peek(len);
            ap.push(wet + AP_G * d, len);
            wet = d - AP_G * wet;
        }
        dry * 0.6 + wet * 0.4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run(fx: &mut dyn Effect, input: impl Iterator<Item = f32>) -> Vec<f32> {
        input
            .enumerate()
            .map(|(i, x)| {
                if i % 128 == 0 {
                    fx.begin_block(128);
                }
                fx.process(x)
            })
            .collect()
    }

    #[test]
    fn delay_echoes_at_the_set_time() {
        let mut fx = Delay::new(48000.0);
        fx.set_beat(400); // dotted eighth → 300
        assert_eq!(fx.len, 300);
        fx.len = 100;
        let input = (0..400).map(|i| if i == 0 { 1.0 } else { 0.0 });
        let out = run(&mut fx, input);
        assert_eq!(out[0], 1.0, "dry passes through");
        assert!(out[100].abs() > 0.2, "first echo");
        assert!(out[200].abs() > 0.05 && out[200].abs() < out[100].abs(), "feedback decays");
        assert!(out[50].abs() < 1e-6, "nothing between echoes");
    }

    #[test]
    fn octaver_doubles_the_pitch() {
        let sr = 48000.0;
        let mut fx = Octaver::new(sr);
        let tone = |f: f32| (0..48000).map(move |i| (i as f32 * f / sr * TAU).sin());
        let crossings = |v: &[f32]| v.windows(2).filter(|w| (w[0] < 0.0) != (w[1] < 0.0)).count();
        let dry = crossings(&tone(110.0).collect::<Vec<_>>());
        let wet = crossings(&run(&mut fx, tone(110.0))[4800..]);
        let ratio = wet as f32 / (dry as f32 * 0.9);
        assert!((1.7..2.3).contains(&ratio), "zero-crossing ratio {ratio}");
    }

    #[test]
    fn crush_quantizes_and_holds_samples() {
        let mut fx = Crush::new(48000.0);
        let out = run(&mut fx, (0..600).map(|i| (i as f32 * 0.01).sin() * 0.5));
        let held = out[300..].windows(2).filter(|w| w[0] == w[1]).count();
        assert!(held > 100, "held runs: {held}");
        assert!(out.iter().all(|s| s.is_finite() && s.abs() < 4.0));
    }

    #[test]
    fn slot_is_dry_when_off_and_every_builtin_stays_bounded() {
        for (id, name) in BUILTIN.iter().enumerate() {
            let mut slot = Slot::new(builtin(id, 48000.0).expect("builtin"));
            assert_eq!(slot.process(0.5, 1.0), 0.5, "off = dry");
            slot.set(true);
            let mut seed = 7u32;
            let mut noise = move || {
                seed ^= seed << 13;
                seed ^= seed >> 17;
                seed ^= seed << 5;
                (seed >> 8) as f32 / 8_388_608.0 - 1.0
            };
            for i in 0..48000 {
                if i % 128 == 0 {
                    slot.effect.begin_block(128);
                }
                let y = slot.process(noise(), 1.0 / 96.0);
                assert!(y.is_finite() && y.abs() < 4.0, "{name} blew up");
            }
            assert!((slot.wet() - 1.0).abs() < 1e-6);
        }
    }
}
