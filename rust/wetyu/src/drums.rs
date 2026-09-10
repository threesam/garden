//! Seven synthesised drums plus the metronome click. No samples to ship.

use core::f32::consts::TAU;

pub const PADS: usize = 7;

#[derive(Clone, Copy)]
struct Hit {
    active: bool,
    t: u32,
    phase: f32,
}

const IDLE: Hit = Hit {
    active: false,
    t: 0,
    phase: 0.0,
};

pub struct Drums {
    hits: [Hit; PADS],
    click: Hit,
    click_freq: f32,
    sr: f32,
    rng: u32,
    prev_noise: f32,
}

impl Drums {
    pub fn new(sr: f32) -> Self {
        Self {
            hits: [IDLE; PADS],
            click: IDLE,
            click_freq: 800.0,
            sr,
            rng: 0x9E37_79B9,
            prev_noise: 0.0,
        }
    }

    pub fn trigger(&mut self, pad: u32) {
        if let Some(h) = self.hits.get_mut(pad as usize) {
            *h = Hit {
                active: true,
                t: 0,
                phase: 0.0,
            };
        }
    }

    pub fn click(&mut self, accent: bool) {
        self.click = Hit {
            active: true,
            t: 0,
            phase: 0.0,
        };
        self.click_freq = if accent { 1000.0 } else { 800.0 };
    }

    #[inline]
    fn noise(&mut self) -> f32 {
        let mut x = self.rng;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.rng = x;
        (x >> 8) as f32 / 8_388_608.0 - 1.0
    }

    /// One sample of the drum mix.
    #[inline]
    pub fn tick(&mut self) -> f32 {
        let n = self.noise();
        let hp = n - self.prev_noise; // first difference: a crude high-pass
        self.prev_noise = n;
        let sr = self.sr;
        let mut out = 0.0;
        for (pad, h) in self.hits.iter_mut().enumerate() {
            if !h.active {
                continue;
            }
            let s = h.t as f32 / sr;
            let (sample, done) = match pad {
                0 => {
                    let f = 45.0 + 105.0 * (-s / 0.06).exp();
                    h.phase = (h.phase + f / sr).fract();
                    ((h.phase * TAU).sin() * (-s / 0.30).exp(), s > 0.6)
                }
                1 => {
                    h.phase = (h.phase + 180.0 / sr).fract();
                    let tone = (h.phase * TAU).sin() * (-s / 0.08).exp() * 0.5;
                    (n * (-s / 0.12).exp() * 0.6 + tone, s > 0.4)
                }
                2 => {
                    let env = if s < 0.03 {
                        (-(s % 0.01) / 0.004).exp()
                    } else {
                        (-(s - 0.03) / 0.10).exp() * 0.5
                    };
                    (n * env * 0.8, s > 0.4)
                }
                3 => (hp * (-s / 0.04).exp() * 0.5, s > 0.15),
                4 => (hp * (-s / 0.25).exp() * 0.4, s > 0.9),
                5 => {
                    let f = 80.0 + 40.0 * (-s / 0.1).exp();
                    h.phase = (h.phase + f / sr).fract();
                    ((h.phase * TAU).sin() * (-s / 0.25).exp() * 0.9, s > 0.7)
                }
                _ => {
                    h.phase = (h.phase + 800.0 / sr).fract();
                    let click = if s < 0.001 { n } else { 0.0 };
                    (click + (h.phase * TAU).sin() * (-s / 0.03).exp() * 0.6, s > 0.12)
                }
            };
            out += sample;
            h.t += 1;
            if done {
                h.active = false;
            }
        }
        out
    }

    /// One sample of the metronome: a 3 ms blip.
    #[inline]
    pub fn tick_click(&mut self) -> f32 {
        if !self.click.active {
            return 0.0;
        }
        let s = self.click.t as f32 / self.sr;
        if s >= 0.003 {
            self.click.active = false;
            return 0.0;
        }
        self.click.phase = (self.click.phase + self.click_freq / self.sr).fract();
        self.click.t += 1;
        (self.click.phase * TAU).sin() * (1.0 - s / 0.003) * 0.4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_pad_sounds_and_ends() {
        let mut d = Drums::new(48000.0);
        for pad in 0..PADS as u32 {
            d.trigger(pad);
            let energy: f32 = (0..4800).map(|_| d.tick().abs()).sum();
            assert!(energy > 0.5, "pad {pad} silent");
            for _ in 0..48000 {
                d.tick();
            }
            assert!(!d.hits[pad as usize].active, "pad {pad} never ended");
        }
        assert_eq!(d.tick_click(), 0.0);
        d.click(true);
        let blip: Vec<f32> = (0..144).map(|_| d.tick_click()).collect();
        assert!(blip.iter().any(|&s| s != 0.0));
        assert_eq!(d.tick_click(), 0.0);
    }
}
