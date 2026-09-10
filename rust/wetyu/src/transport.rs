//! Bar math. Everything is integer samples on the audio clock; nothing here
//! touches floats after `bar_len` is rounded once, so loops never drift apart.

/// Samples per 4/4 bar. Rounded once — the ≤ 0.5-sample error is shared by
/// every loop, so it changes absolute tempo by < 0.001% and never separates them.
pub fn bar_len(bpm: f32, sr: f32) -> u32 {
    (4.0 * 60.0 / bpm * sr).round() as u32
}

/// Where a loop that starts recording at `t` is anchored.
/// First half of the bar → the bar line already passed (retroactive, the
/// scratch capture has it). Second half → the next bar line.
pub fn snap_start(t: u32, bar: u32) -> u32 {
    let pos = t % bar;
    let line = t - pos;
    if pos * 2 < bar {
        line
    } else {
        line + bar
    }
}

/// Loop length for a recording that has run `elapsed` samples: nearest whole
/// bar, never less than one.
pub fn snap_stop(elapsed: u32, bar: u32) -> u32 {
    let bars = (elapsed + bar / 2) / bar;
    bars.max(1) * bar
}

/// Playback position of a loop anchored at `anchor` with length `len`.
pub fn loop_pos(t: u32, anchor: u32, len: u32) -> u32 {
    t.wrapping_sub(anchor) % len
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bar_len_is_whole_samples() {
        assert_eq!(bar_len(120.0, 48000.0), 96_000);
        assert_eq!(bar_len(90.0, 44100.0), 117_600);
        // 4*60/97*48000 = 118762.88… → rounds, never truncates
        assert_eq!(bar_len(97.0, 48000.0), 118_763);
    }

    #[test]
    fn start_in_first_half_is_retroactive() {
        assert_eq!(snap_start(0, 1000), 0);
        assert_eq!(snap_start(2_499, 1000), 2_000);
    }

    #[test]
    fn start_in_second_half_waits_for_next_bar() {
        assert_eq!(snap_start(2_500, 1000), 3_000);
        assert_eq!(snap_start(2_999, 1000), 3_000);
    }

    #[test]
    fn stop_rounds_to_nearest_bar_min_one() {
        assert_eq!(snap_stop(0, 1000), 1000);
        assert_eq!(snap_stop(499, 1000), 1000);
        assert_eq!(snap_stop(1_400, 1000), 1000); // tail dropped
        assert_eq!(snap_stop(1_500, 1000), 2000); // keeps recording to the line
        assert_eq!(snap_stop(3_999, 1000), 4000);
    }

    #[test]
    fn loop_pos_uses_its_own_anchor() {
        assert_eq!(loop_pos(4_000, 4_000, 3_000), 0);
        assert_eq!(loop_pos(7_500, 4_000, 3_000), 500);
        assert_eq!(loop_pos(9_999, 4_000, 3_000), 2_999);
    }
}
