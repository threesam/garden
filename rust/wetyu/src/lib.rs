//! wetyu — the looper engine. Runs inside an AudioWorklet as bare wasm (no
//! wasm-bindgen: worklets have no `TextDecoder`) and inside a CoreAudio
//! callback on the desktop. Rules on the audio path: no allocation after
//! `Engine::new` (growing wasm memory detaches every view the host holds),
//! no panics (a trap kills the worklet for good), no locks.
//!
//! Everything the player does enters through [`Engine::command`], which
//! stamps it with the sample clock into a log. The performance *is* that
//! log plus the mic input: re-run it and you get the same audio, which is
//! what an offline audio-visual render will do later.

pub mod drums;
pub mod fx;
pub mod looper;
pub mod synth;
pub mod transport;

use core::cell::UnsafeCell;
use drums::Drums;
use fx::{Slot, BUILTIN};
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
/// Events the log holds before it stops recording (~an hour of busy playing).
pub const LOG_CAP: usize = 1 << 16;

/// Status block: `[playing, bpm, bar, t]` then [`CH_FIELDS`] per channel.
pub const STATUS_LEN: usize = 4 + CH_FIELDS * CHANNELS;
/// Per channel: `[state, len_bars, pos, gate, level, fx_wet]`.
pub const CH_FIELDS: usize = 6;

pub const MIC: usize = 0;
pub const KEYS: usize = 1;
pub const DRUMS: usize = 2;

/// Command opcodes. Mirrored in `src/lib/wetyu/protocol.ts`.
pub mod op {
    pub const TEMPO: u32 = 0;
    pub const TRANSPORT: u32 = 1;
    pub const NOTE: u32 = 2;
    pub const DRUM: u32 = 3;
    pub const RECORD: u32 = 4;
    pub const HOLD: u32 = 5;
    pub const CLEAR: u32 = 6;
    pub const CLICK: u32 = 7;
    pub const MIC_MONITOR: u32 = 8;
    pub const MIC_OFFSET: u32 = 9;
    pub const PANIC: u32 = 10;
    pub const FX: u32 = 11;
    pub const SELECT_FX: u32 = 12;
}

/// One logged command: `[clock, op, a.to_bits(), b.to_bits()]`, where clock is
/// samples rendered since the engine was made — monotonic, unlike the transport
/// clock, so a take that stops and restarts still replays unambiguously.
pub type Event = [u32; 4];

pub struct Engine {
    sr: f32,
    bpm: f32,
    bar: u32,
    /// Transport clock: samples since play started. Resets on start.
    t: u32,
    /// Render clock: every sample ever processed. Never resets.
    /// ponytail: u32 wraps after ~24 h at 48 kHz; nobody performs that long
    clock: u32,
    playing: bool,
    click_on: bool,
    monitor_mic: bool,
    /// Gate / wet ramp per sample: full swing in 2 ms.
    step: f32,
    /// The tempo dial. `bpm` follows it until the first loop sets the grid,
    /// and comes back to it once every loop is cleared.
    dial_bpm: f32,
    channels: [Channel; CHANNELS],
    /// Every built-in effect, for every channel, built once and always
    /// running — switching plugins must not allocate on the audio thread,
    /// and a plugin switched in should already carry the loop's recent past.
    fx: [[Slot; 3]; CHANNELS],
    active_fx: [usize; CHANNELS],
    synth: Synth,
    drums: Drums,
    log: Vec<Event>,
    pub input: [f32; BLOCK],
    pub output: [f32; BLOCK],
    pub status: [f32; STATUS_LEN],
}

impl Engine {
    pub fn new(sr: f32) -> Self {
        let cap = (sr * MAX_SECONDS) as usize;
        let bpm = 120.0;
        let slots = || {
            [
                Slot::new(fx::builtin(0, sr).expect("builtin 0")),
                Slot::new(fx::builtin(1, sr).expect("builtin 1")),
                Slot::new(fx::builtin(2, sr).expect("builtin 2")),
            ]
        };
        let mut e = Self {
            sr,
            bpm,
            bar: 0,
            t: 0,
            clock: 0,
            playing: false,
            click_on: false,
            monitor_mic: false,
            step: 1.0 / (0.002 * sr),
            dial_bpm: bpm,
            channels: [Channel::new(cap), Channel::new(cap), Channel::new(cap)],
            fx: [slots(), slots(), slots()],
            active_fx: [0, 1, 2],
            synth: Synth::new(sr),
            drums: Drums::new(sr),
            log: Vec::with_capacity(LOG_CAP),
            input: [0.0; BLOCK],
            output: [0.0; BLOCK],
            status: [0.0; STATUS_LEN],
        };
        e.apply_tempo(bpm);
        e
    }

    /// The one entry point. Logged with the sample it lands on.
    pub fn command(&mut self, op: u32, a: f32, b: f32) {
        if self.log.len() < self.log.capacity() {
            self.log.push([self.clock, op, a.to_bits(), b.to_bits()]);
        }
        let ch = a as usize;
        let on = b != 0.0;
        match op {
            op::TEMPO => self.set_tempo(a),
            // 0 stop, 1 start, 2 toggle — toggling here keeps two quick presses
            // from both reading a stale "stopped" on the UI thread.
            op::TRANSPORT => self.transport(if a == 2.0 { !self.playing } else { a != 0.0 }),
            op::NOTE => self.note(a as u32, on),
            op::DRUM => self.drums.trigger(a as u32),
            op::RECORD => self.record(ch),
            op::HOLD => self.hold(ch, on),
            op::CLEAR => self.clear(ch),
            op::CLICK => self.click_on = a != 0.0,
            op::MIC_MONITOR => self.monitor_mic = a != 0.0,
            op::MIC_OFFSET => self.channels[MIC].offset = a as u32,
            op::PANIC => self.panic(),
            op::FX => self.set_fx(ch, on),
            op::SELECT_FX => self.select_fx(ch, b as usize),
            _ => {}
        }
    }

    /// Everything since the engine was made. Never cleared: a take is only
    /// replayable from a fresh engine if it starts at the beginning.
    pub fn log(&self) -> &[Event] {
        &self.log
    }

    /// Samples rendered so far — the "now" a saved take ends at.
    pub fn clock(&self) -> u32 {
        self.clock
    }

    fn locked(&self) -> bool {
        self.channels.iter().any(|c| c.state != State::Empty)
    }

    pub fn set_tempo(&mut self, bpm: f32) {
        if self.locked() || !bpm.is_finite() {
            return;
        }
        self.dial_bpm = bpm.clamp(40.0, 240.0);
        self.apply_tempo(self.dial_bpm);
    }

    fn apply_tempo(&mut self, bpm: f32) {
        // A bar is never shorter than a sample: every `% bar` below depends on it.
        self.set_grid(bar_len(bpm, self.sr).max(1));
    }

    /// The grid is one bar of `bar` samples; bpm is whatever that implies.
    fn set_grid(&mut self, bar: u32) {
        self.bar = bar.max(1);
        self.bpm = 4.0 * 60.0 * self.sr / self.bar as f32;
        let beat = (self.bar / 4) as usize;
        for slot in self.fx.iter_mut().flatten() {
            slot.effect.set_beat(beat);
        }
    }

    /// Smart snap for the first loop, against the tempo dial. A stop that
    /// lands within a slice of a sixteenth of a whole bar is that many bars
    /// (and keeps the dial's grid); within the same slice of a sixteenth it
    /// is that many sixteenths; anything else is the exact take. The window
    /// is 30% of a sixteenth: 37 ms at 120 bpm, well under a rushed press.
    /// Returns `(len, bar)`.
    fn snap_first(&self, elapsed: u32) -> (u32, u32) {
        let dial_bar = bar_len(self.dial_bpm, self.sr).max(16);
        let sixteenth = dial_bar / 16;
        let tol = sixteenth * 3 / 10;
        let near = |unit: u32| {
            let n = (elapsed + unit / 2) / unit;
            (n >= 1 && elapsed.abs_diff(n * unit) <= tol).then_some(n * unit)
        };
        if let Some(len) = near(dial_bar) {
            (len, dial_bar)
        } else if let Some(len) = near(sixteenth) {
            (len, len)
        } else {
            (elapsed, elapsed)
        }
    }

    /// True while `ch` is the only loop that exists: its take is the master.
    fn is_first_loop(&self, ch: usize) -> bool {
        self.channels
            .iter()
            .enumerate()
            .all(|(i, c)| i == ch || c.state == State::Empty)
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
            // First press from silence: the click counts two beats of the dial,
            // then the take begins. Only the first loop gets a count-in.
            self.transport(true);
            self.click_on = true;
            if let Some(c) = self.channels.get_mut(ch) {
                c.start_at(2 * (self.bar / 4));
            }
            return;
        }
        let t = self.t;
        let Some(c) = self.channels.get(ch) else {
            return;
        };
        let master_stop = self.is_first_loop(ch) && c.state == State::Recording && t > c.anchor;
        if master_stop {
            // The first loop is the master: it loops the instant you stop, and
            // its length (smart-snapped against the dial) becomes the grid.
            let (len, bar) = self.snap_first(t - c.anchor);
            let c = &mut self.channels[ch]; // ch < CHANNELS: the get above passed
            c.stop_with(len);
            let bar = bar.min(c.len); // the buffer may have capped the take
                                      // Rebase the transport on the master's start so bar lines (and every
                                      // later loop) line up with it, not with the count-in.
            self.t = t - c.anchor;
            c.anchor = 0;
            self.set_grid(bar);
        } else {
            let bar = self.bar;
            self.channels[ch].record(t, bar);
        }
    }

    /// The listen key. Pressing it on a loop that is still recording ends the
    /// take (the first loop exactly, later ones snapped to it) and opens the
    /// gate in the same gesture; on a loop with a re-record queued it un-queues it.
    pub fn hold(&mut self, ch: usize, on: bool) {
        if on
            && self
                .channels
                .get(ch)
                .is_some_and(|c| c.state == State::Recording)
        {
            self.record(ch);
        }
        if let Some(c) = self.channels.get_mut(ch) {
            if on {
                c.pending = false;
            }
            c.hold(on);
        }
    }

    pub fn clear(&mut self, ch: usize) {
        if let Some(c) = self.channels.get_mut(ch) {
            c.clear(self.t, self.bar);
        }
        if !self.locked() {
            // Nothing left to lock the grid: the dial rules again.
            self.apply_tempo(self.dial_bpm);
        }
    }

    pub fn note(&mut self, midi: u32, on: bool) {
        let midi = midi.min(127); // past this the oscillator step goes infinite
        if on {
            self.synth.note_on(midi);
        } else {
            self.synth.note_off(midi);
        }
    }

    /// Shift with a playing loop: that loop's effect in.
    pub fn set_fx(&mut self, ch: usize, on: bool) {
        if let (Some(slots), Some(&i)) = (self.fx.get_mut(ch), self.active_fx.get(ch)) {
            slots[i].set(on);
        }
    }

    /// Swap the plugin on a channel (index into [`BUILTIN`]).
    pub fn select_fx(&mut self, ch: usize, id: usize) {
        if ch < CHANNELS && id < BUILTIN.len() && id != self.active_fx[ch] {
            let was_on = self.fx[ch][self.active_fx[ch]].is_on();
            self.fx[ch][self.active_fx[ch]].set(false);
            self.active_fx[ch] = id;
            self.fx[ch][id].set(was_on);
        }
    }

    /// Everything released: notes off, gates closed, effects out. Sent on blur.
    pub fn panic(&mut self) {
        self.synth.all_off();
        for c in &mut self.channels {
            c.hold(false);
        }
        for slot in self.fx.iter_mut().flatten() {
            slot.set(false);
        }
    }

    /// Any buffer size: runs `process` in BLOCK-sized chunks through the
    /// internal buffers. Mono in, mono out, `output.len()` frames.
    pub fn process_slices(&mut self, input: &[f32], output: &mut [f32]) {
        for (i, out) in output.chunks_mut(BLOCK).enumerate() {
            let n = out.len();
            let start = i * BLOCK;
            let src = input.get(start..start + n).unwrap_or(&[]);
            self.input[..src.len()].copy_from_slice(src);
            self.input[src.len()..n].fill(0.0);
            self.process(n);
            out.copy_from_slice(&self.output[..n]);
        }
    }

    pub fn process(&mut self, frames: usize) {
        let frames = frames.min(BLOCK);
        let bar = self.bar;
        let beat = (bar / 4).max(1);
        for slot in self.fx.iter_mut().flatten() {
            slot.effect.begin_block(frames);
        }
        let mut level = [0.0f32; CHANNELS];
        for i in 0..frames {
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
                for (ch, (c, s)) in self.channels.iter_mut().zip(src).enumerate() {
                    let raw = c.tick(t, bar, s, self.step);
                    // Every plugin hears the loop so its tail is live when it is
                    // switched in; only the active one reaches the mix.
                    let mut y = raw;
                    for (j, slot) in self.fx[ch].iter_mut().enumerate() {
                        let v = slot.process(raw, self.step);
                        if j == self.active_fx[ch] {
                            y = v;
                        }
                    }
                    level[ch] = level[ch].max(y.abs());
                    out += y;
                }
                self.t = t.wrapping_add(1);
            }
            out += self.drums.tick_click();
            self.output[i] = out.clamp(-1.0, 1.0);
        }
        self.clock = self.clock.wrapping_add(frames as u32);
        self.synth.flush_denormals();
        self.write_status(level);
    }

    fn write_status(&mut self, level: [f32; CHANNELS]) {
        let bar = self.bar as f32;
        let s = &mut self.status;
        s[0] = if self.playing { 1.0 } else { 0.0 };
        s[1] = self.bpm;
        s[2] = bar;
        s[3] = self.t as f32;
        for (i, c) in self.channels.iter().enumerate() {
            let base = 4 + CH_FIELDS * i;
            let (len_bars, pos) = match c.state {
                // A queued re-record reads as "waiting for the bar" while the old loop plays on.
                State::Looping if c.pending => (0.0, -1.0),
                State::Empty => (0.0, 0.0),
                State::Recording => (0.0, (self.t as f32 - c.anchor as f32) / bar),
                State::Until => (c.len as f32 / bar, (self.t as f32 - c.anchor as f32) / bar),
                State::Looping => (
                    c.len as f32 / bar,
                    loop_pos(self.t, c.anchor, c.len) as f32 / c.len as f32,
                ),
            };
            s[base] = if c.pending { State::Recording } else { c.state } as u32 as f32;
            s[base + 1] = len_bars;
            s[base + 2] = pos;
            s[base + 3] = c.gate();
            s[base + 4] = level[i];
            s[base + 5] = self.fx[i][self.active_fx[i]].wet();
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
pub extern "C" fn wetyu_command(op: u32, a: f32, b: f32) {
    if let Some(e) = engine() {
        e.command(op, a, b);
    }
}

/// The performance log as `[t, op, a_bits, b_bits]` quads; `wetyu_log_len`
/// is the quad count. Read the words as u32 and decode a/b as f32 bits.
#[no_mangle]
pub extern "C" fn wetyu_log_ptr() -> *const u32 {
    engine().map_or(core::ptr::null(), |e| e.log.as_ptr().cast())
}

#[no_mangle]
pub extern "C" fn wetyu_log_len() -> u32 {
    engine().map_or(0, |e| e.log.len() as u32)
}

#[no_mangle]
pub extern "C" fn wetyu_clock() -> u32 {
    engine().map_or(0, |e| e.clock())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ch(e: &Engine, i: usize) -> &[f32] {
        &e.status[4 + CH_FIELDS * i..4 + CH_FIELDS * (i + 1)]
    }

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
        assert_eq!(ch(&e, DRUMS)[0], State::Recording as u32 as f32);
        e.set_tempo(200.0);
        assert_eq!(e.status[1], 100.0);
        assert_eq!(e.bpm, 100.0);
    }

    #[test]
    fn process_slices_matches_block_processing_for_odd_sizes() {
        let mut a = Engine::new(48000.0);
        let mut b = Engine::new(48000.0);
        a.note(60, true);
        b.note(60, true);
        let mut out_a = vec![0.0; 300];
        a.process_slices(&[0.0; 300], &mut out_a);
        let mut out_b = Vec::new();
        for n in [128, 128, 44] {
            b.process(n);
            out_b.extend_from_slice(&b.output[..n]);
        }
        assert_eq!(out_a, out_b);
        assert!(out_a.iter().any(|&s| s != 0.0));
    }

    #[test]
    fn holding_a_recording_loop_stops_the_take_and_opens_the_gate() {
        let mut e = Engine::new(48000.0);
        e.record(DRUMS);
        for _ in 0..(96_000 / BLOCK) {
            e.process(BLOCK);
        }
        e.hold(DRUMS, true);
        e.process(BLOCK);
        assert_eq!(ch(&e, DRUMS)[0], State::Looping as u32 as f32);
        assert!(ch(&e, DRUMS)[3] > 0.0, "gate should be opening");
    }

    #[test]
    fn keys_are_live_without_transport_and_land_in_the_keys_loop() {
        let mut e = Engine::new(48000.0);
        e.note(36, true);
        e.process(BLOCK);
        assert!(e.output.iter().any(|&s| s != 0.0));
        e.record(KEYS);
        for _ in 0..(96_000 / BLOCK) {
            e.process(BLOCK);
        }
        e.record(KEYS);
        e.process(BLOCK);
        assert_eq!(ch(&e, KEYS)[0], State::Looping as u32 as f32);
        assert_eq!(ch(&e, KEYS)[1], 1.0);
        assert_eq!(ch(&e, MIC)[0], State::Empty as u32 as f32);
        // held → level and (with fx) wet show up in the status
        e.hold(KEYS, true);
        e.set_fx(KEYS, true);
        for _ in 0..4 {
            e.process(BLOCK);
        }
        assert!(ch(&e, KEYS)[4] > 0.0, "level");
        assert!(ch(&e, KEYS)[5] > 0.9, "fx wet");
    }

    /// Render `blocks` blocks, applying logged commands on the render clock.
    fn replay(log: &[Event], blocks: u32) -> Vec<f32> {
        let mut e = Engine::new(48000.0);
        let mut out = Vec::new();
        for block in 0..blocks {
            for ev in log.iter().filter(|ev| ev[0] == block * BLOCK as u32) {
                e.command(ev[1], f32::from_bits(ev[2]), f32::from_bits(ev[3]));
            }
            e.process(BLOCK);
            out.extend_from_slice(&e.output);
        }
        out
    }

    #[test]
    fn transport_toggle_is_decided_on_the_audio_thread() {
        let mut e = Engine::new(48000.0);
        e.command(op::TRANSPORT, 2.0, 0.0);
        e.command(op::TRANSPORT, 2.0, 0.0);
        assert!(!e.playing, "two quick toggles cancel out");
        e.command(op::TRANSPORT, 2.0, 0.0);
        assert!(e.playing);
    }

    /// Blocks in a two-beat count-in at 120 bpm / 48k: 2 × 24000 / 128.
    const COUNT_IN: u32 = 375;

    #[test]
    fn the_first_loop_counts_in_two_beats_then_records() {
        let mut e = Engine::new(48000.0);
        e.set_tempo(120.0);
        e.record(DRUMS);
        assert!(e.playing && e.click_on);
        e.process(BLOCK);
        assert!(ch(&e, DRUMS)[2] < 0.0, "waiting through the count-in");
        for _ in 1..COUNT_IN {
            e.process(BLOCK);
        }
        assert_eq!(e.channels[DRUMS].anchor, 48_000);
        assert!(
            ch(&e, DRUMS)[2] >= 0.0,
            "recording began on the second beat"
        );
        // The click ticked at beat 0 and beat 1: the transport clock says so.
        assert_eq!(e.t, 48_000);
    }

    #[test]
    fn the_first_loop_snaps_smartly_against_the_dial() {
        // 120 bpm @ 48k: bar 96000, sixteenth 6000, window 1800 samples (37 ms).
        let stop_after = |blocks: u32| {
            let mut e = Engine::new(48000.0);
            e.set_tempo(120.0);
            e.record(DRUMS);
            for _ in 0..COUNT_IN + blocks {
                e.process(BLOCK);
            }
            e.record(DRUMS);
            e.process(BLOCK);
            (
                e.channels[DRUMS].len,
                e.bar,
                e.bpm,
                e.channels[DRUMS].anchor,
            )
        };
        // 1024 samples late on a bar → a whole bar, dial grid kept, rebased to 0
        assert_eq!(stop_after(758), (96_000, 96_000, 120.0, 0));
        // 32 samples late on two sixteenths → two sixteenths, which become the bar
        let (len, bar, _, _) = stop_after(94);
        assert_eq!((len, bar), (12_000, 12_000));
        // 1920 samples past a sixteenth: outside the window → the exact take
        assert_eq!(stop_after(390).0, 49_920);
        assert_eq!(stop_after(390).1, 49_920);
    }

    #[test]
    fn the_first_loop_sets_the_grid_and_loops_the_moment_it_stops() {
        let mut e = Engine::new(48000.0);
        e.set_tempo(120.0);
        e.record(DRUMS); // transport starts; two beats of count-in
        for _ in 0..COUNT_IN + 3 {
            e.process(BLOCK);
        }
        e.record(DRUMS); // 384 samples into the take: nowhere near a bar
        e.process(BLOCK);
        assert_eq!(
            ch(&e, DRUMS)[0],
            State::Looping as u32 as f32,
            "looping right away"
        );
        assert_eq!(e.bar, 384, "the take is the grid");
        assert!(
            (e.bpm - 30_000.0).abs() < 1.0,
            "bpm follows the grid: {}",
            e.bpm
        );
        assert_eq!(ch(&e, DRUMS)[1], 1.0, "one bar of its own length");

        // A second loop snaps to multiples of the master, not to the dial.
        e.record(KEYS); // t = 512 after the rebase; bar pos 128 < 192 → retro anchor 384
        for _ in 0..5 {
            e.process(BLOCK);
        }
        e.record(KEYS); // t = 1152, elapsed 768 → exactly two master lengths
        for _ in 0..3 {
            e.process(BLOCK);
        }
        assert_eq!(ch(&e, KEYS)[0], State::Looping as u32 as f32);
        assert_eq!(ch(&e, KEYS)[1], 2.0, "snapped to two master lengths");

        // Clear everything: the dial's tempo comes back.
        e.clear(DRUMS);
        assert_eq!(e.bar, 384, "still locked by the keys loop");
        e.clear(KEYS);
        assert_eq!(e.bar, 96_000);
        assert_eq!(e.bpm, 120.0);
    }

    #[test]
    fn a_take_replays_identically_even_across_a_transport_restart() {
        // Perform: record drums, play a kick, stop, restart, kick again.
        let mut a = Engine::new(48000.0);
        let mut original = Vec::new();
        let script: [&[(u32, f32)]; 4] = [
            &[(op::TEMPO, 100.0), (op::RECORD, DRUMS as f32)],
            &[(op::DRUM, 0.0)],
            &[(op::TRANSPORT, 0.0)],
            &[(op::RECORD, DRUMS as f32), (op::DRUM, 1.0)],
        ];
        for cmds in script {
            for &(o, arg) in cmds {
                a.command(o, arg, 0.0);
            }
            a.process(BLOCK);
            original.extend_from_slice(&a.output);
        }
        let log: Vec<Event> = a.log().to_vec();
        assert_eq!(log.len(), 6);
        // The render clock keeps counting through the stop; the transport clock reset.
        assert_eq!(
            log[4][0],
            3 * BLOCK as u32,
            "restart logged on the render clock"
        );
        assert_eq!(a.t, BLOCK as u32, "transport restarted from 0");

        let replayed = replay(&log, 4);
        assert_eq!(replayed, original);
        assert!(replayed.iter().any(|&s| s != 0.0));
    }

    #[test]
    fn selecting_a_plugin_keeps_the_wet_state_and_never_allocates_new_slots() {
        let mut e = Engine::new(48000.0);
        e.transport(true);
        e.set_fx(DRUMS, true);
        e.process(BLOCK);
        e.command(op::SELECT_FX, DRUMS as f32, 0.0);
        assert_eq!(e.active_fx[DRUMS], 0);
        e.process(BLOCK);
        assert!(ch(&e, DRUMS)[5] > 0.5, "wet carried over to the delay");
        e.command(op::SELECT_FX, DRUMS as f32, 99.0);
        assert_eq!(e.active_fx[DRUMS], 0, "unknown ids are ignored");
    }
}
