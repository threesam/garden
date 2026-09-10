//! Eight-voice sub bass: a sine driven into a soft clipper for a little
//! grit, linear ADSR, one-pole low-pass to keep it round. Nothing allocates;
//! every voice is a fixed slot.

use core::f32::consts::{PI, TAU};

const VOICES: usize = 8;
const SUSTAIN: f32 = 0.75;
/// How hard the sine leans on the clipper. 1.0 is clean; 2.2 is "slightly".
const DRIVE: f32 = 2.2;

#[derive(Clone, Copy, PartialEq, Eq)]
enum Stage {
    Off,
    Attack,
    Decay,
    Sustain,
    Release,
}

#[derive(Clone, Copy)]
struct Voice {
    midi: u32,
    phase: f32,
    dt: f32,
    stage: Stage,
    env: f32,
    started: u32,
    lp: f32,
}

const OFF: Voice = Voice {
    midi: 0,
    phase: 0.0,
    dt: 0.0,
    stage: Stage::Off,
    env: 0.0,
    started: 0,
    lp: 0.0,
};

pub struct Synth {
    voices: [Voice; VOICES],
    sr: f32,
    counter: u32,
    attack: f32,
    decay: f32,
    release: f32,
    lp_a: f32,
}

/// Rational tanh: odd harmonics only, so the bass stays round.
#[inline]
fn soft_clip(x: f32) -> f32 {
    let x = x.clamp(-3.0, 3.0);
    x * (27.0 + x * x) / (27.0 + 9.0 * x * x)
}

impl Synth {
    pub fn new(sr: f32) -> Self {
        Self {
            voices: [OFF; VOICES],
            sr,
            counter: 0,
            attack: 1.0 / (0.004 * sr),
            decay: (1.0 - SUSTAIN) / (0.25 * sr),
            release: 1.0 / (0.18 * sr),
            lp_a: 1.0 - (-2.0 * PI * 900.0 / sr).exp(),
        }
    }

    pub fn note_on(&mut self, midi: u32) {
        self.counter = self.counter.wrapping_add(1);
        let freq = 440.0 * 2f32.powf((midi as f32 - 69.0) / 12.0);
        // Retrigger the same note, else a free slot, else the oldest voice.
        let same = self.voices.iter().position(|v| v.stage != Stage::Off && v.midi == midi);
        let free = || self.voices.iter().position(|v| v.stage == Stage::Off);
        let oldest = || {
            let mut best = 0;
            for (i, v) in self.voices.iter().enumerate() {
                if v.started < self.voices[best].started {
                    best = i;
                }
            }
            best
        };
        let slot = same.or_else(free).unwrap_or_else(oldest);
        let v = &mut self.voices[slot]; // slot came from an index over this array
        // Keep phase / filter / envelope level so a steal or retrigger doesn't click.
        v.midi = midi;
        v.dt = freq / self.sr;
        v.stage = Stage::Attack;
        v.started = self.counter;
    }

    pub fn note_off(&mut self, midi: u32) {
        for v in &mut self.voices {
            if v.midi == midi && v.stage != Stage::Off && v.stage != Stage::Release {
                v.stage = Stage::Release;
            }
        }
    }

    pub fn all_off(&mut self) {
        for v in &mut self.voices {
            if v.stage != Stage::Off {
                v.stage = Stage::Release;
            }
        }
    }

    pub fn active(&self) -> impl Iterator<Item = u32> + '_ {
        self.voices.iter().filter(|v| v.stage != Stage::Off).map(|v| v.midi)
    }

    #[inline]
    pub fn tick(&mut self) -> f32 {
        let mut out = 0.0;
        for v in &mut self.voices {
            match v.stage {
                Stage::Off => continue,
                Stage::Attack => {
                    v.env += self.attack;
                    if v.env >= 1.0 {
                        v.env = 1.0;
                        v.stage = Stage::Decay;
                    }
                }
                Stage::Decay => {
                    v.env -= self.decay;
                    if v.env <= SUSTAIN {
                        v.env = SUSTAIN;
                        v.stage = Stage::Sustain;
                    }
                }
                Stage::Sustain => {}
                Stage::Release => {
                    v.env -= self.release;
                    if v.env <= 0.0 {
                        v.env = 0.0;
                        v.stage = Stage::Off;
                        continue;
                    }
                }
            }
            v.phase += v.dt;
            if v.phase >= 1.0 {
                v.phase -= 1.0;
            }
            let sub = soft_clip((v.phase * TAU).sin() * DRIVE);
            v.lp += self.lp_a * (sub - v.lp);
            out += v.lp * v.env;
        }
        out * 0.45
    }

    /// wasm has no flush-to-zero; a decayed filter state would otherwise crawl
    /// through denormals at 100x the cost.
    pub fn flush_denormals(&mut self) {
        for v in &mut self.voices {
            if v.lp.abs() < 1e-15 {
                v.lp = 0.0;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn silent_until_played_then_sounds() {
        let mut s = Synth::new(48000.0);
        assert!((0..256).all(|_| s.tick() == 0.0));
        s.note_on(60);
        let energy: f32 = (0..4800).map(|_| s.tick().abs()).sum();
        assert!(energy > 1.0);
        s.note_off(60);
        for _ in 0..48000 {
            s.tick();
        }
        assert_eq!(s.active().count(), 0);
    }

    #[test]
    fn a_note_is_round_but_not_clean() {
        // One period of C2 at 48 kHz, well into sustain: mostly fundamental,
        // with a little odd-harmonic grit from the clipper.
        let mut s = Synth::new(48000.0);
        s.note_on(36);
        for _ in 0..24000 {
            s.tick();
        }
        let period = (48000.0 / 65.406) as usize;
        let wave: Vec<f32> = (0..period).map(|_| s.tick()).collect();
        let peak = wave.iter().fold(0.0f32, |m, x| m.max(x.abs()));
        let crest = peak / (wave.iter().map(|x| x * x).sum::<f32>() / period as f32).sqrt();
        // a pure sine has crest √2 ≈ 1.414; a square 1.0; "slightly distorted" sits between
        assert!((1.15..1.4).contains(&crest), "crest factor {crest}");
    }

    #[test]
    fn ninth_note_steals_the_oldest() {
        let mut s = Synth::new(48000.0);
        for m in 60..68 {
            s.note_on(m);
        }
        s.note_on(72);
        let held: Vec<u32> = s.active().collect();
        assert_eq!(held.len(), 8);
        assert!(!held.contains(&60));
        assert!(held.contains(&61) && held.contains(&72));
    }
}
