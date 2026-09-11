//! One loop channel: a sample buffer, a record state machine, and a gate.
//!
//! "Always on": the channel is always writing its source into the buffer from
//! the most recent bar line while empty, so a record press in the first half of
//! a bar starts the loop retroactively. Once looping, the buffer cycles on the
//! grid forever; the gate only decides whether you hear it.

use crate::transport::{loop_pos, snap_start, snap_stop};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum State {
    Empty = 0,
    Recording = 1,
    /// Length is decided; still writing until the last bar line (or the
    /// in-flight mic tail) lands.
    Until = 2,
    Looping = 3,
}

pub struct Channel {
    buf: Vec<f32>,
    pub state: State,
    /// Grid sample the loop (or the scratch capture) starts at.
    pub anchor: u32,
    pub len: u32,
    /// Input latency compensation in samples: the source sample arriving at
    /// `t` belongs to grid time `t - offset`. Zero for internal instruments.
    pub offset: u32,
    /// A re-record is queued: the loop keeps playing until the next bar line.
    pub pending: bool,
    gate: f32,
    target: f32,
}

impl Channel {
    pub fn new(cap: usize) -> Self {
        Self {
            buf: vec![0.0; cap],
            state: State::Empty,
            anchor: 0,
            len: 0,
            offset: 0,
            pending: false,
            gate: 0.0,
            target: 0.0,
        }
    }

    pub fn gate(&self) -> f32 {
        self.gate
    }

    /// The longest loop this buffer can hold, in whole bars (0 if none fit).
    fn fits(&self, bar: u32) -> u32 {
        (self.buf.len() as u32 / bar) * bar
    }

    pub fn hold(&mut self, on: bool) {
        self.target = if on { 1.0 } else { 0.0 };
    }

    /// Advance one sample: capture `src`, move the gate by at most `step`,
    /// return this loop's contribution to the mix.
    #[inline]
    pub fn tick(&mut self, t: u32, bar: u32, src: f32, step: f32) -> f32 {
        // Grid index this source sample belongs to; negative while the anchor
        // is still ahead of us (waiting for the bar line / the mic delay).
        let idx = i64::from(t) - i64::from(self.anchor) - i64::from(self.offset);
        match self.state {
            State::Empty | State::Recording => {
                if idx >= 0 {
                    if let Some(slot) = self.buf.get_mut(idx as usize) {
                        *slot = src;
                    } else if self.state == State::Recording {
                        // Out of room: keep the whole bars we have.
                        self.len = self.fits(bar);
                        self.state = if self.len == 0 {
                            State::Empty
                        } else {
                            State::Looping
                        };
                    }
                }
            }
            State::Until => {
                if idx >= i64::from(self.len) {
                    self.state = State::Looping;
                } else if idx >= 0 {
                    if let Some(slot) = self.buf.get_mut(idx as usize) {
                        *slot = src;
                    }
                }
            }
            State::Looping => {}
        }
        let d = self.target - self.gate;
        self.gate += d.clamp(-step, step);
        if self.state == State::Looping && self.gate > 0.0 {
            let p = loop_pos(t, self.anchor, self.len) as usize;
            self.buf.get(p).copied().unwrap_or(0.0) * self.gate
        } else {
            0.0
        }
    }

    /// Called on every bar line while playing.
    pub fn bar_line(&mut self, t: u32) {
        if self.pending {
            // The queued re-record starts here; the old loop played to the line.
            self.pending = false;
            self.anchor = t;
            self.state = State::Recording;
        } else if self.state == State::Empty {
            self.anchor = t;
        }
    }

    /// Begin a take at a future grid sample (a count-in). Waits, then records.
    pub fn start_at(&mut self, anchor: u32) {
        self.anchor = anchor;
        self.pending = false;
        self.state = State::Recording;
    }

    /// Stop with a given length (the engine decides the snapping). Longer than
    /// the take so far keeps recording to that point; shorter drops the tail.
    pub fn stop_with(&mut self, len: u32) {
        if self.state != State::Recording || len == 0 {
            return;
        }
        self.len = len.min(self.buf.len() as u32);
        self.state = State::Until;
    }

    /// The record key: start, or stop and snap.
    pub fn record(&mut self, t: u32, bar: u32) {
        match self.state {
            State::Empty => {
                self.anchor = snap_start(t, bar);
                self.state = State::Recording;
            }
            State::Looping => {
                // ponytail: no retro start on re-record; needs a second scratch buffer.
                // Queued instead: the loop keeps playing until the next bar line.
                if t.is_multiple_of(bar) {
                    self.anchor = t;
                    self.state = State::Recording;
                } else {
                    self.pending = !self.pending; // pressing again un-queues it
                }
            }
            State::Recording => {
                if t < self.anchor {
                    self.clear(t, bar);
                } else {
                    // Never longer than the buffer: keep the whole bars that fit.
                    self.len = snap_stop(t - self.anchor, bar).min(self.fits(bar));
                    if self.len == 0 {
                        self.clear(t, bar);
                    } else {
                        self.state = State::Until;
                    }
                }
            }
            State::Until => {}
        }
    }

    pub fn clear(&mut self, t: u32, bar: u32) {
        self.state = State::Empty;
        self.pending = false;
        self.anchor = t - t % bar;
    }

    /// Transport (re)start: t goes back to 0.
    pub fn reset(&mut self) {
        if self.state != State::Looping {
            self.state = State::Empty;
        }
        self.pending = false;
        self.anchor = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const BAR: u32 = 100;

    /// Run the channel from `from` to `to` (exclusive) with the source being the
    /// grid time delayed by the channel's offset, so buffer content == grid time.
    fn run(ch: &mut Channel, from: u32, to: u32) -> Vec<f32> {
        (from..to)
            .map(|t| {
                if t.is_multiple_of(BAR) {
                    ch.bar_line(t);
                }
                let src = t as f32 - ch.offset as f32;
                ch.tick(t, BAR, src, 1.0)
            })
            .collect()
    }

    #[test]
    fn gate_ramps_by_at_most_step() {
        let mut ch = Channel::new(1000);
        ch.hold(true);
        let step = 0.25;
        let mut last = 0.0;
        for t in 0..4 {
            ch.tick(t, BAR, 0.0, step);
            assert!(ch.gate() - last <= step + 1e-6);
            last = ch.gate();
        }
        assert!((ch.gate() - 1.0).abs() < 1e-6);
        ch.hold(false);
        for t in 4..8 {
            ch.tick(t, BAR, 0.0, step);
        }
        assert!(ch.gate().abs() < 1e-6);
    }

    #[test]
    fn early_press_starts_retroactively_and_stop_snaps() {
        let mut ch = Channel::new(1000);
        run(&mut ch, 0, 20);
        ch.record(20, BAR);
        assert_eq!((ch.state, ch.anchor), (State::Recording, 0));
        run(&mut ch, 20, 260);
        ch.record(260, BAR);
        assert_eq!((ch.state, ch.len), (State::Until, 300));
        run(&mut ch, 260, 300);
        assert_eq!(ch.state, State::Until);
        run(&mut ch, 300, 301);
        assert_eq!(ch.state, State::Looping);
        ch.hold(true);
        let out = run(&mut ch, 301, 400);
        // grid t=350 → loop position 50 → recorded grid sample 50
        assert_eq!(out[350 - 301], 50.0);
    }

    #[test]
    fn late_press_waits_for_the_bar_line() {
        let mut ch = Channel::new(1000);
        run(&mut ch, 0, 70);
        ch.record(70, BAR);
        assert_eq!((ch.state, ch.anchor), (State::Recording, 100));
        run(&mut ch, 70, 250);
        ch.record(250, BAR);
        assert_eq!(ch.len, 200);
        run(&mut ch, 250, 301);
        assert_eq!(ch.state, State::Looping);
        ch.hold(true);
        let out = run(&mut ch, 301, 501);
        assert_eq!(out[400 - 301], 200.0); // position 100 of a loop anchored at 100
        assert_eq!(out[500 - 301], 100.0); // position 0 == grid 100
    }

    #[test]
    fn press_while_waiting_cancels() {
        let mut ch = Channel::new(1000);
        run(&mut ch, 0, 70);
        ch.record(70, BAR);
        assert_eq!(ch.state, State::Recording);
        ch.record(80, BAR);
        assert_eq!((ch.state, ch.anchor), (State::Empty, 0));
    }

    #[test]
    fn mic_offset_aligns_content_and_waits_for_the_tail() {
        let mut ch = Channel::new(1000);
        ch.offset = 10;
        ch.record(0, BAR);
        run(&mut ch, 0, 200);
        ch.record(200, BAR);
        assert_eq!((ch.state, ch.len), (State::Until, 200));
        run(&mut ch, 200, 210);
        assert_eq!(ch.state, State::Until);
        run(&mut ch, 210, 211);
        assert_eq!(ch.state, State::Looping);
        ch.hold(true);
        let out = run(&mut ch, 211, 400);
        assert_eq!(out[250 - 211], 50.0); // loop pos 50 == grid sample 50, not 40
        assert_eq!(out[399 - 211], 199.0); // the in-flight tail landed
    }

    #[test]
    fn capacity_auto_stops_on_a_whole_bar() {
        let mut ch = Channel::new(250);
        ch.record(0, BAR);
        run(&mut ch, 0, 251);
        assert_eq!((ch.state, ch.len), (State::Looping, 200));
    }

    #[test]
    fn a_take_never_snaps_longer_than_the_buffer() {
        let mut ch = Channel::new(250);
        ch.record(0, BAR);
        run(&mut ch, 0, 240);
        ch.record(240, BAR); // nearest bar would be 200; 300 would not fit anyway
        assert_eq!((ch.state, ch.len), (State::Until, 200));
        let mut tiny = Channel::new(50); // less than a bar: nothing can fit
        tiny.record(0, BAR);
        run(&mut tiny, 0, 40);
        tiny.record(40, BAR);
        assert_eq!(tiny.state, State::Empty);
    }

    #[test]
    fn re_record_waits_for_next_bar_and_clear_reopens_tempo() {
        let mut ch = Channel::new(1000);
        ch.record(0, BAR);
        run(&mut ch, 0, 100);
        ch.record(100, BAR);
        run(&mut ch, 100, 130);
        assert_eq!(ch.state, State::Looping);
        ch.record(130, BAR);
        // queued: still looping (audible) until the bar line
        assert_eq!((ch.state, ch.pending), (State::Looping, true));
        ch.hold(true);
        let out = run(&mut ch, 130, 200);
        assert!(
            out.iter().any(|&s| s != 0.0),
            "the old loop plays while queued"
        );
        run(&mut ch, 200, 201);
        assert_eq!(
            (ch.state, ch.anchor, ch.pending),
            (State::Recording, 200, false)
        );
        ch.clear(200, BAR);
        assert_eq!((ch.state, ch.anchor), (State::Empty, 200));
    }

    #[test]
    fn a_transport_restart_keeps_loops_looping() {
        let mut ch = Channel::new(1000);
        ch.record(0, BAR);
        run(&mut ch, 0, 100);
        ch.record(100, BAR);
        run(&mut ch, 100, 130);
        assert_eq!(ch.state, State::Looping);
        ch.reset();
        run(&mut ch, 0, 1); // t = 0 is a bar line with anchor == 0
        assert_eq!((ch.state, ch.anchor), (State::Looping, 0));
    }

    #[test]
    fn pressing_record_again_unqueues_a_re_record() {
        let mut ch = Channel::new(1000);
        ch.record(0, BAR);
        run(&mut ch, 0, 100);
        ch.record(100, BAR);
        run(&mut ch, 100, 130);
        ch.record(130, BAR);
        ch.record(140, BAR);
        assert_eq!((ch.state, ch.pending), (State::Looping, false));
        run(&mut ch, 140, 201);
        assert_eq!(ch.state, State::Looping, "nothing started at the line");
    }
}
