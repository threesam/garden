//! wetyu — the looper engine. Runs inside an AudioWorklet as bare wasm: no
//! wasm-bindgen (its glue needs `TextDecoder`, which worklets lack), no
//! allocation after `wetyu_init` (growing wasm memory detaches every view the
//! host holds), no panics (a trap kills the processor for good).

pub mod drums;
pub mod looper;
pub mod synth;
pub mod transport;

use core::cell::UnsafeCell;
use drums::Drums;
use looper::{Channel, State};
use synth::Synth;
use transport::{bar_len, loop_pos};

/// Single-threaded interior mutability; wasm32-unknown-unknown has no threads.
struct Global<T>(UnsafeCell<T>);
unsafe impl<T> Sync for Global<T> {}
impl<T> Global<T> {
    const fn new(value: T) -> Self {
        Self(UnsafeCell::new(value))
    }
    #[allow(clippy::mut_from_ref)]
    fn get(&self) -> &mut T {
        unsafe { &mut *self.0.get() }
    }
}

pub const BLOCK: usize = 128;
pub const CHANNELS: usize = 3;
pub const MAX_SECONDS: f32 = 60.0;
/// `[playing, bpm, bar, t]` then per channel `[state, len_bars, pos, gate]`.
pub const STATUS_LEN: usize = 4 + 4 * CHANNELS;

pub const MIC: usize = 0;
pub const KEYS: usize = 1;
pub const DRUMS: usize = 2;

pub struct Engine {
    sr: f32,
    bpm: f32,
    bar: u32,
    t: u32,
    playing: bool,
    click_on: bool,
    monitor_mic: bool,
    /// Gate ramp per sample: full swing in 2 ms.
    step: f32,
    channels: [Channel; CHANNELS],
    synth: Synth,
    drums: Drums,
    pub input: [f32; BLOCK],
    pub output: [f32; BLOCK],
    pub status: [f32; STATUS_LEN],
}

impl Engine {
    pub fn new(sr: f32) -> Self {
        let cap = (sr * MAX_SECONDS) as usize;
        let bpm = 120.0;
        Self {
            sr,
            bpm,
            bar: bar_len(bpm, sr),
            t: 0,
            playing: false,
            click_on: false,
            monitor_mic: false,
            step: 1.0 / (0.002 * sr),
            channels: [Channel::new(cap), Channel::new(cap), Channel::new(cap)],
            synth: Synth::new(sr),
            drums: Drums::new(sr),
            input: [0.0; BLOCK],
            output: [0.0; BLOCK],
            status: [0.0; STATUS_LEN],
        }
    }

    fn locked(&self) -> bool {
        self.channels.iter().any(|c| c.state != State::Empty)
    }

    pub fn set_tempo(&mut self, bpm: f32) {
        if self.locked() || !bpm.is_finite() {
            return;
        }
        self.bpm = bpm.clamp(40.0, 240.0);
        self.bar = bar_len(self.bpm, self.sr);
    }

    pub fn transport(&mut self, on: bool) {
        self.playing = on;
        if on {
            self.t = 0;
            for c in &mut self.channels {
                c.reset();
            }
        }
    }

    pub fn record(&mut self, ch: usize) {
        if !self.playing {
            // First press from silence: bar 1 is now, click on so you can hear the grid.
            self.transport(true);
            self.click_on = true;
        }
        if let Some(c) = self.channels.get_mut(ch) {
            c.record(self.t, self.bar);
        }
    }

    pub fn hold(&mut self, ch: usize, on: bool) {
        if let Some(c) = self.channels.get_mut(ch) {
            c.hold(on);
        }
    }

    pub fn clear(&mut self, ch: usize) {
        if let Some(c) = self.channels.get_mut(ch) {
            c.clear(self.t, self.bar);
        }
    }

    pub fn set_mic_offset(&mut self, samples: u32) {
        self.channels[MIC].offset = samples;
    }

    pub fn process(&mut self, frames: usize) {
        let bar = self.bar;
        let beat = (bar / 4).max(1);
        for i in 0..frames.min(BLOCK) {
            let t = self.t;
            let mic = self.input[i];
            let keys = self.synth.tick();
            let drums = self.drums.tick();
            let mut out = keys + drums;
            if self.monitor_mic {
                out += mic;
            }
            if self.playing {
                if t.is_multiple_of(bar) {
                    for c in &mut self.channels {
                        c.bar_line(t);
                    }
                }
                if self.click_on && t.is_multiple_of(beat) {
                    self.drums.click(t.is_multiple_of(bar));
                }
                let src = [mic, keys, drums];
                for (c, s) in self.channels.iter_mut().zip(src) {
                    out += c.tick(t, bar, s, self.step);
                }
                // ponytail: u32 wraps after ~24 h at 48 kHz; nobody loops that long
                self.t = t.wrapping_add(1);
            }
            out += self.drums.tick_click();
            self.output[i] = out.clamp(-1.0, 1.0);
        }
        self.synth.flush_denormals();
        self.write_status();
    }

    fn write_status(&mut self) {
        let bar = self.bar as f32;
        let s = &mut self.status;
        s[0] = if self.playing { 1.0 } else { 0.0 };
        s[1] = self.bpm;
        s[2] = bar;
        s[3] = self.t as f32;
        for (i, c) in self.channels.iter().enumerate() {
            let base = 4 + 4 * i;
            let (len_bars, pos) = match c.state {
                State::Empty => (0.0, 0.0),
                State::Recording => (0.0, (self.t as f32 - c.anchor as f32) / bar),
                State::Until => (c.len as f32 / bar, (self.t as f32 - c.anchor as f32) / bar),
                State::Looping => (
                    c.len as f32 / bar,
                    loop_pos(self.t, c.anchor, c.len) as f32 / c.len as f32,
                ),
            };
            s[base] = c.state as u32 as f32;
            s[base + 1] = len_bars;
            s[base + 2] = pos;
            s[base + 3] = c.gate();
        }
    }
}

static ENGINE: Global<Option<Engine>> = Global::new(None);

fn engine() -> Option<&'static mut Engine> {
    ENGINE.get().as_mut()
}

/// Allocate everything. Call exactly once per instance, before the host takes
/// any view on memory.
#[no_mangle]
pub extern "C" fn wetyu_init(sample_rate: f32) {
    *ENGINE.get() = Some(Engine::new(sample_rate));
}

#[no_mangle]
pub extern "C" fn wetyu_in_ptr() -> *mut f32 {
    engine().map_or(core::ptr::null_mut(), |e| e.input.as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn wetyu_out_ptr() -> *const f32 {
    engine().map_or(core::ptr::null(), |e| e.output.as_ptr())
}

#[no_mangle]
pub extern "C" fn wetyu_status_ptr() -> *const f32 {
    engine().map_or(core::ptr::null(), |e| e.status.as_ptr())
}

#[no_mangle]
pub extern "C" fn wetyu_process(frames: u32) {
    if let Some(e) = engine() {
        e.process(frames as usize);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_set_tempo(bpm: f32) {
    if let Some(e) = engine() {
        e.set_tempo(bpm);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_transport(on: u32) {
    if let Some(e) = engine() {
        e.transport(on != 0);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_note(midi: u32, on: u32) {
    if let Some(e) = engine() {
        if on != 0 {
            e.synth.note_on(midi);
        } else {
            e.synth.note_off(midi);
        }
    }
}

#[no_mangle]
pub extern "C" fn wetyu_drum(pad: u32) {
    if let Some(e) = engine() {
        e.drums.trigger(pad);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_record(ch: u32) {
    if let Some(e) = engine() {
        e.record(ch as usize);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_hold(ch: u32, on: u32) {
    if let Some(e) = engine() {
        e.hold(ch as usize, on != 0);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_clear(ch: u32) {
    if let Some(e) = engine() {
        e.clear(ch as usize);
    }
}

#[no_mangle]
pub extern "C" fn wetyu_set_click(on: u32) {
    if let Some(e) = engine() {
        e.click_on = on != 0;
    }
}

#[no_mangle]
pub extern "C" fn wetyu_set_mic_monitor(on: u32) {
    if let Some(e) = engine() {
        e.monitor_mic = on != 0;
    }
}

#[no_mangle]
pub extern "C" fn wetyu_set_mic_offset(samples: u32) {
    if let Some(e) = engine() {
        e.set_mic_offset(samples);
    }
}

/// Everything released: notes off, gates closed. Sent on blur.
#[no_mangle]
pub extern "C" fn wetyu_panic() {
    if let Some(e) = engine() {
        e.synth.all_off();
        for c in &mut e.channels {
            c.hold(false);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn silent_block_is_all_zeros_and_status_is_stopped() {
        let mut e = Engine::new(48000.0);
        e.process(BLOCK);
        assert!(e.output.iter().all(|&s| s == 0.0));
        assert_eq!(e.status[0], 0.0);
        assert_eq!(e.status[2], 96_000.0);
    }

    #[test]
    fn record_from_silence_starts_the_clock_and_locks_tempo() {
        let mut e = Engine::new(48000.0);
        e.set_tempo(100.0);
        e.record(DRUMS);
        e.process(BLOCK);
        assert_eq!(e.status[0], 1.0);
        assert_eq!(e.status[3], 128.0);
        assert_eq!(e.status[4 + 4 * DRUMS], State::Recording as u32 as f32);
        e.set_tempo(200.0);
        assert_eq!(e.status[1], 100.0);
        assert_eq!(e.bpm, 100.0);
    }

    #[test]
    fn keys_are_live_without_transport_and_land_in_the_keys_loop() {
        let mut e = Engine::new(48000.0);
        e.synth.note_on(60);
        e.process(BLOCK);
        assert!(e.output.iter().any(|&s| s != 0.0));
        e.record(KEYS);
        for _ in 0..(96_000 / BLOCK) {
            e.process(BLOCK);
        }
        e.record(KEYS);
        e.process(BLOCK);
        assert_eq!(e.status[4 + 4 * KEYS], State::Looping as u32 as f32);
        assert_eq!(e.status[4 + 4 * KEYS + 1], 1.0);
        assert_eq!(e.status[4 + 4 * MIC], State::Empty as u32 as f32);
    }
}
