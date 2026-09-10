//! wetyu-desktop — the same engine on CoreAudio, for raw speed.
//!
//! The browser version pays Chrome's 128-frame buffer, its audio-service hop
//! and its input pipeline. Here the engine runs inside a cpal callback with a
//! 64-frame buffer (1.3 ms at 48 kHz) and key events come straight from the
//! OS. Commands travel UI → audio over a wait-free ring buffer; status comes
//! back the same way. Nothing on the audio thread allocates or locks.
//!
//! `wetyu-desktop --probe` opens the streams headless, fires a kick, and
//! prints the real buffer sizes and output peak — the latency numbers.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, AtomicUsize, Ordering};
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{BufferSize, SampleFormat, StreamConfig, SupportedBufferSize};
use eframe::egui::{self, Key};
use rtrb::{Consumer, Producer, RingBuffer};
use wetyu::{CH_FIELDS, Engine, STATUS_LEN, op};

/// Frames per callback we ask CoreAudio for. Clamped to the device's range.
const WANT_FRAMES: u32 = 64;
/// Largest callback we handle in one pass; bigger ones are chunked.
const MAX_CHUNK: usize = 4096;

/// `(op, a, b)` exactly as the engine logs it — see `wetyu::op`.
type Cmd = (u32, f32, f32);

fn flag(on: bool) -> f32 {
    if on { 1.0 } else { 0.0 }
}

struct Audio {
    _out: cpal::Stream,
    _mic: Option<cpal::Stream>,
    sample_rate: u32,
    out_name: String,
    mic_name: Option<String>,
    /// Frames per callback, as actually delivered.
    out_frames: Arc<AtomicUsize>,
    mic_frames: Arc<AtomicUsize>,
    /// Output peak since last read (f32 bits), for --probe.
    peak: Arc<AtomicU32>,
}

fn fixed(size: &SupportedBufferSize) -> BufferSize {
    match size {
        SupportedBufferSize::Range { min, max } => BufferSize::Fixed(WANT_FRAMES.clamp(*min, *max)),
        SupportedBufferSize::Unknown => BufferSize::Default,
    }
}

fn start_audio(
    mut cmd_rx: Consumer<Cmd>,
    mut status_tx: Producer<[f32; STATUS_LEN]>,
) -> Result<Audio, String> {
    let host = cpal::default_host();
    let out_dev = host.default_output_device().ok_or("no output device")?;
    let out_default = out_dev.default_output_config().map_err(|e| e.to_string())?;
    if out_default.sample_format() != SampleFormat::F32 {
        return Err(format!(
            "output is {:?}, expected f32",
            out_default.sample_format()
        ));
    }
    let sample_rate = out_default.sample_rate();
    let channels = out_default.channels() as usize;
    let out_config = StreamConfig {
        channels: out_default.channels(),
        sample_rate,
        buffer_size: fixed(out_default.buffer_size()),
    };

    let mut engine = Engine::new(sample_rate as f32);
    // Round trip guess: one input buffer, one output buffer, a little ring slack.
    engine.command(op::MIC_OFFSET, (WANT_FRAMES * 3) as f32, 0.0);

    // Mic samples flow input callback → ring → output callback.
    let (mut mic_tx, mut mic_rx) = RingBuffer::<f32>::new(1 << 15);
    let mic_frames = Arc::new(AtomicUsize::new(0));
    let mut mic_name = None;
    let mic = host.default_input_device().and_then(|dev| {
        let cfg = dev.default_input_config().ok()?;
        if cfg.sample_format() != SampleFormat::F32 {
            return None;
        }
        let in_channels = cfg.channels() as usize;
        let config = StreamConfig {
            channels: cfg.channels(),
            sample_rate, // must match the output clock; the build fails otherwise
            buffer_size: fixed(cfg.buffer_size()),
        };
        let frames = Arc::clone(&mic_frames);
        let stream = dev
            .build_input_stream(
                config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    frames.store(data.len() / in_channels, Ordering::Relaxed);
                    for frame in data.chunks(in_channels) {
                        let _ = mic_tx.push(frame[0]);
                    }
                },
                |e| eprintln!("mic: {e}"),
                None,
            )
            .map_err(|e| eprintln!("mic disabled: {e}"))
            .ok()?;
        stream.play().ok()?;
        mic_name = dev.description().ok().map(|d| d.name().to_string());
        Some(stream)
    });

    let out_frames = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicU32::new(0));
    let (frames_w, peak_w) = (Arc::clone(&out_frames), Arc::clone(&peak));
    let mut mono_in = vec![0.0f32; MAX_CHUNK];
    let mut mono_out = vec![0.0f32; MAX_CHUNK];
    let mut n_cb = 0u32;
    let out = out_dev
        .build_output_stream(
            out_config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                while let Ok((o, a, b)) = cmd_rx.pop() {
                    engine.command(o, a, b);
                }
                let frames = data.len() / channels;
                frames_w.store(frames, Ordering::Relaxed);
                // ponytail: in/out may sit on different device clocks and drift.
                // Shed at most one sample per callback once the backlog passes four
                // buffers — inaudible, and 1/64 covers any real drift. A resampling
                // bridge with a fill-level controller is the upgrade if it ever matters.
                if mic_rx.slots() > 4 * frames {
                    let _ = mic_rx.pop();
                }
                let mut max = f32::from_bits(peak_w.load(Ordering::Relaxed));
                for start in (0..frames).step_by(MAX_CHUNK) {
                    let n = (frames - start).min(MAX_CHUNK);
                    for s in &mut mono_in[..n] {
                        *s = mic_rx.pop().unwrap_or(0.0);
                    }
                    engine.process_slices(&mono_in[..n], &mut mono_out[..n]);
                    for (f, s) in mono_out[..n].iter().enumerate() {
                        max = max.max(s.abs());
                        let base = (start + f) * channels;
                        data[base..base + channels].fill(*s);
                    }
                }
                peak_w.store(max.to_bits(), Ordering::Relaxed);
                n_cb = n_cb.wrapping_add(1);
                if n_cb % 8 == 0 {
                    let _ = status_tx.push(engine.status);
                }
            },
            |e| eprintln!("audio: {e}"),
            None,
        )
        .map_err(|e| e.to_string())?;
    out.play().map_err(|e| e.to_string())?;

    Ok(Audio {
        _out: out,
        _mic: mic,
        sample_rate,
        out_name: out_dev
            .description()
            .map(|d| d.name().to_string())
            .unwrap_or_default(),
        mic_name,
        out_frames,
        mic_frames,
        peak,
    })
}

// ---- keyboard zones (mirrors src/lib/wetyu/keys.ts) --------------------------

#[derive(Clone, Copy)]
enum Action {
    Hold(usize),
    Note(u32),
    Drum(u32),
    /// `None` records the selected loop (R); `Some` is shift+digit.
    Record(Option<usize>),
    Select,
    Transport,
    Tempo(f32),
    Click,
    Clear,
    Octave(i32),
}

const WHITE: [(Key, u32, &str); 8] = [
    (Key::A, 0, "A"),
    (Key::S, 2, "S"),
    (Key::D, 4, "D"),
    (Key::F, 5, "F"),
    (Key::G, 7, "G"),
    (Key::H, 9, "H"),
    (Key::J, 11, "J"),
    (Key::K, 12, "K"),
];
const BLACK: [(Key, u32, &str); 5] = [
    (Key::W, 1, "W"),
    (Key::E, 3, "E"),
    (Key::T, 6, "T"),
    (Key::Y, 8, "Y"),
    (Key::U, 10, "U"),
];
const PADS: [(Key, &str, &str); 7] = [
    (Key::Z, "Z", "kick"),
    (Key::X, "X", "snare"),
    (Key::C, "C", "clap"),
    (Key::V, "V", "hat"),
    (Key::B, "B", "open"),
    (Key::N, "N", "tom"),
    (Key::M, "M", "rim"),
];
const NAMES: [&str; 3] = ["mic", "keys", "drums"];

fn action(k: Key) -> Option<Action> {
    if let Some((_, semi, _)) = WHITE.iter().chain(BLACK.iter()).find(|(key, ..)| *key == k) {
        return Some(Action::Note(*semi));
    }
    if let Some(pad) = PADS.iter().position(|(key, ..)| *key == k) {
        return Some(Action::Drum(pad as u32));
    }
    Some(match k {
        Key::Num1 => Action::Hold(0),
        Key::Num2 => Action::Hold(1),
        Key::Num3 => Action::Hold(2),
        Key::R => Action::Record(None),
        Key::Tab => Action::Select,
        Key::Space => Action::Transport,
        Key::ArrowUp => Action::Tempo(1.0),
        Key::ArrowDown => Action::Tempo(-1.0),
        Key::ArrowRight => Action::Tempo(5.0),
        Key::ArrowLeft => Action::Tempo(-5.0),
        Key::Comma => Action::Octave(-1),
        Key::Period => Action::Octave(1),
        Key::L => Action::Click,
        Key::Backspace => Action::Clear,
        _ => return None,
    })
}

// ---- app --------------------------------------------------------------------

struct App {
    cmd_tx: Producer<Cmd>,
    status_rx: Consumer<[f32; STATUS_LEN]>,
    status: [f32; STATUS_LEN],
    audio: Audio,
    /// Keys physically down → what to send on release.
    down: HashMap<Key, Option<Cmd>>,
    /// Loops whose effect shift switched in; released with shift or the loop key.
    fx_on: [bool; 3],
    shift: bool,
    /// Pointer-held on-screen controls, for edge detection.
    ui_hold: [bool; 3],
    ui_note: [bool; 13],
    octave: i32,
    bpm: f32,
    click: bool,
    monitor: bool,
    offset_ms: f32,
    selected: usize,
}

impl App {
    fn send(&mut self, cmd: Cmd) {
        let _ = self.cmd_tx.push(cmd);
    }

    fn playing(&self) -> bool {
        self.status[0] == 1.0
    }

    fn locked(&self) -> bool {
        (0..3).any(|i| self.ch(i)[0] != 0.0)
    }

    fn ch(&self, i: usize) -> &[f32] {
        &self.status[4 + CH_FIELDS * i..4 + CH_FIELDS * (i + 1)]
    }

    /// Shift pressed while loops are held: their effects in.
    fn shift(&mut self, on: bool) {
        let held: Vec<usize> = self
            .down
            .values()
            .filter_map(|rel| match rel {
                Some((o, ch, _)) if *o == op::HOLD => Some(*ch as usize),
                _ => None,
            })
            .collect();
        for i in 0..3 {
            let want = on && held.contains(&i);
            if want != self.fx_on[i] {
                self.fx_on[i] = want;
                self.send((op::FX, i as f32, flag(want)));
            }
        }
    }

    fn midi(&self, semitone: u32) -> u32 {
        (12 * (self.octave + 1)) as u32 + semitone
    }

    fn press(&mut self, key: Key, a: Action) {
        let release = match a {
            Action::Hold(ch) => {
                self.send((op::HOLD, ch as f32, 1.0));
                Some((op::HOLD, ch as f32, 0.0))
            }
            Action::Note(semi) => {
                let midi = self.midi(semi) as f32;
                self.send((op::NOTE, midi, 1.0));
                Some((op::NOTE, midi, 0.0))
            }
            Action::Drum(pad) => {
                self.send((op::DRUM, pad as f32, 0.0));
                None
            }
            Action::Record(ch) => {
                self.send((op::RECORD, ch.unwrap_or(self.selected) as f32, 0.0));
                None
            }
            Action::Select => {
                self.selected = (self.selected + 1) % 3;
                None
            }
            Action::Transport => {
                let on = !self.playing();
                self.send((op::TRANSPORT, flag(on), 0.0));
                None
            }
            Action::Tempo(d) => {
                self.set_tempo(self.bpm + d);
                None
            }
            Action::Click => {
                self.click = !self.click;
                self.send((op::CLICK, flag(self.click), 0.0));
                None
            }
            Action::Clear => {
                self.send((op::CLEAR, self.selected as f32, 0.0));
                None
            }
            Action::Octave(d) => {
                self.octave = (self.octave + d).clamp(1, 7);
                None
            }
        };
        self.down.insert(key, release);
    }

    fn release(&mut self, key: Key) {
        if let Some(rel) = self.down.remove(&key).flatten() {
            if rel.0 == op::HOLD {
                let ch = rel.1 as usize;
                if self.fx_on[ch] {
                    self.fx_on[ch] = false;
                    self.send((op::FX, rel.1, 0.0));
                }
            }
            self.send(rel);
        }
    }

    fn set_tempo(&mut self, bpm: f32) {
        if self.locked() {
            return;
        }
        self.bpm = bpm.clamp(40.0, 240.0).round();
        self.send((op::TEMPO, self.bpm, 0.0));
    }

    fn release_all(&mut self) {
        self.down.clear();
        self.fx_on = [false; 3];
        self.send((op::PANIC, 0.0, 0.0));
    }

    fn state_label(&self, ch: usize) -> String {
        let s = self.ch(ch);
        match s[0] as u32 {
            1 if s[2] < 0.0 => "waiting for the bar".into(),
            1 => format!("recording bar {}", s[2].floor() as i32 + 1),
            2 => "finishing the bar".into(),
            3 => format!("{} bar{}", s[1] as i32, if s[1] == 1.0 { "" } else { "s" }),
            _ => "empty".into(),
        }
    }

    fn ring(&self, ch: usize) -> f32 {
        let s = self.ch(ch);
        if s[0] as u32 == 3 {
            s[2]
        } else if s[2] <= 0.0 {
            0.0
        } else {
            s[2].fract()
        }
    }
}

impl eframe::App for App {
    fn logic(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        while let Ok(s) = self.status_rx.pop() {
            self.status = s;
        }
        self.bpm = self.status[1];
        // Keys first, before any drawing: this is the whole point of the app.
        // egui reports shift as a modifier, not a key: edge-detect it here.
        let shift = ctx.input(|i| i.modifiers.shift);
        if shift != self.shift {
            self.shift = shift;
            self.shift(shift);
        }
        let events = ctx.input(|i| i.events.clone());
        for ev in events {
            match ev {
                egui::Event::Key {
                    key,
                    physical_key,
                    pressed,
                    repeat,
                    modifiers,
                } => {
                    if repeat || modifiers.command || modifiers.ctrl || modifiers.alt {
                        continue;
                    }
                    let k = physical_key.unwrap_or(key);
                    if pressed {
                        if self.down.contains_key(&k) {
                            continue;
                        }
                        // Shift turns a loop's listen key into its record key.
                        let a = match action(k) {
                            Some(Action::Hold(ch)) if modifiers.shift => {
                                Some(Action::Record(Some(ch)))
                            }
                            a => a,
                        };
                        if let Some(a) = a {
                            self.press(k, a);
                        }
                    } else {
                        self.release(k);
                    }
                }
                egui::Event::WindowFocused(false) => self.release_all(),
                _ => {}
            }
        }
        ctx.request_repaint_after(Duration::from_millis(16));
    }

    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ui, |ui| {
            ui.heading("wetyu");
            ui.label("three loops, always running. shift+1 records a loop, hold 1 to hear it.");
            ui.add_space(8.0);

            // transport
            ui.horizontal(|ui| {
                let label = if self.playing() { "stop  [space]" } else { "play  [space]" };
                if ui.button(label).clicked() {
                    let on = !self.playing();
                    self.send((op::TRANSPORT, flag(on), 0.0));
                }
                ui.label(format!("bar {}", (self.status[3] / self.status[2].max(1.0)).floor() as i32 + 1));
                ui.separator();
                ui.label("bpm");
                let locked = self.locked();
                let mut bpm = self.bpm;
                if ui
                    .add_enabled(!locked, egui::DragValue::new(&mut bpm).range(40.0..=240.0))
                    .changed()
                {
                    self.set_tempo(bpm);
                }
                if locked {
                    ui.weak("clear the loops to change tempo");
                }
                ui.separator();
                if ui.checkbox(&mut self.click, "click  [L]").changed() {
                    let on = self.click;
                    self.send((op::CLICK, flag(on), 0.0));
                }
            });
            let a = &self.audio;
            let out_frames = a.out_frames.load(Ordering::Relaxed);
            let mic_frames = a.mic_frames.load(Ordering::Relaxed);
            ui.weak(format!(
                "{} · {} Hz · {} frames out ({:.2} ms) · mic: {}",
                a.out_name,
                a.sample_rate,
                out_frames,
                out_frames as f32 * 1000.0 / a.sample_rate as f32,
                match &a.mic_name {
                    Some(n) => format!("{n} ({mic_frames} frames)"),
                    None => "none".into(),
                },
            ));
            ui.add_space(8.0);

            // channels
            ui.columns(3, |cols| {
                for (i, col) in cols.iter_mut().enumerate() {
                    let selected = i == self.selected;
                    col.horizontal(|ui| {
                        if ui.selectable_label(selected, NAMES[i]).clicked() {
                            self.selected = i;
                        }
                        if selected {
                            ui.weak("selected");
                        }
                    });
                    let r = col.add_sized([110.0, 110.0], egui::Button::new(format!("{}", i + 1)));
                    // Playhead ring around the hold button.
                    let painter = col.painter();
                    let c = r.rect.center();
                    let radius = r.rect.width() * 0.5 - 2.0;
                    let gate = self.ch(i)[3];
                    let stroke = egui::Stroke::new(2.0, egui::Color32::from_rgb(232, 163, 23).gamma_multiply(0.4 + 0.6 * gate));
                    painter.circle_stroke(c, radius, stroke);
                    let ang = self.ring(i) * std::f32::consts::TAU - std::f32::consts::FRAC_PI_2;
                    painter.line_segment([c, c + egui::Vec2::angled(ang) * radius], stroke);
                    let held = r.is_pointer_button_down_on();
                    if held != self.ui_hold[i] {
                        self.ui_hold[i] = held;
                        self.send((op::HOLD, i as f32, flag(held)));
                    }
                    let (state, wet) = (self.ch(i)[0], self.ch(i)[5]);
                    col.label(self.state_label(i));
                    col.horizontal(|ui| {
                        let rec = if state as u32 == 1 { "stop" } else { "rec" };
                        if ui.button(rec).clicked() {
                            self.send((op::RECORD, i as f32, 0.0));
                        }
                        if ui.add_enabled(state != 0.0, egui::Button::new("clear")).clicked() {
                            self.send((op::CLEAR, i as f32, 0.0));
                        }
                        ui.weak(format!("{} {}", wetyu::fx::BUILTIN[i], if wet > 0.5 { "on" } else { "" }));
                    });
                    if i == 0 {
                        if self.audio.mic_name.is_none() {
                            col.weak("no input device");
                        } else {
                            if col.checkbox(&mut self.monitor, "monitor").changed() {
                                let on = self.monitor;
                                self.send((op::MIC_MONITOR, flag(on), 0.0));
                            }
                            if col
                                .add(egui::Slider::new(&mut self.offset_ms, 0.0..=50.0).text("offset ms"))
                                .changed()
                            {
                                let n = (self.offset_ms / 1000.0 * self.audio.sample_rate as f32).round();
                                self.send((op::MIC_OFFSET, n, 0.0));
                            }
                        }
                    }
                }
            });
            ui.add_space(8.0);

            // keys
            ui.horizontal(|ui| {
                for (n, (_, semi, label)) in WHITE.iter().chain(BLACK.iter()).enumerate() {
                    let r = ui.add_sized([36.0, 60.0], egui::Button::new(*label));
                    let held = r.is_pointer_button_down_on();
                    if held != self.ui_note[n] {
                        self.ui_note[n] = held;
                        let midi = self.midi(*semi) as f32;
                        self.send((op::NOTE, midi, flag(held)));
                    }
                }
                ui.label(format!("octave {}  [, .]", self.octave));
            });
            ui.horizontal(|ui| {
                for (pad, (_, key, name)) in PADS.iter().enumerate() {
                    if ui.add_sized([64.0, 48.0], egui::Button::new(format!("{key}\n{name}"))).clicked() {
                        self.send((op::DRUM, pad as f32, 0.0));
                    }
                }
            });
            ui.add_space(8.0);
            ui.weak("1 2 3 hold to hear a loop (ends its take if recording) · shift+1 2 3 record · shift while holding a loop adds its effect · R records the selected · tab select · ⌫ clear · ↑↓ tempo ±1 ←→ ±5");
            ui.weak("press record in the first half of a bar and the loop starts at the bar line you're already in.");
        });
    }
}

fn probe(audio: &Audio, mut cmd_tx: Producer<Cmd>) {
    std::thread::sleep(Duration::from_millis(150));
    let _ = cmd_tx.push((op::DRUM, 0.0, 0.0));
    std::thread::sleep(Duration::from_millis(300));
    let out = audio.out_frames.load(Ordering::Relaxed);
    let mic = audio.mic_frames.load(Ordering::Relaxed);
    let sr = audio.sample_rate as f32;
    println!(
        "output  {}  {} Hz  {} frames/callback = {:.2} ms",
        audio.out_name,
        audio.sample_rate,
        out,
        out as f32 * 1000.0 / sr
    );
    match &audio.mic_name {
        Some(n) => println!(
            "mic     {n}  {mic} frames/callback = {:.2} ms",
            mic as f32 * 1000.0 / sr
        ),
        None => println!("mic     none"),
    }
    println!(
        "kick peak {:.3}",
        f32::from_bits(audio.peak.load(Ordering::Relaxed))
    );
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (cmd_tx, cmd_rx) = RingBuffer::<Cmd>::new(256);
    let (status_tx, status_rx) = RingBuffer::<[f32; STATUS_LEN]>::new(64);
    let audio = start_audio(cmd_rx, status_tx)?;

    if std::env::args().any(|a| a == "--probe") {
        probe(&audio, cmd_tx);
        return Ok(());
    }

    let mut app = App {
        cmd_tx,
        status_rx,
        status: [0.0; STATUS_LEN],
        audio,
        down: HashMap::new(),
        fx_on: [false; 3],
        shift: false,
        ui_hold: [false; 3],
        ui_note: [false; 13],
        octave: 2,
        bpm: 120.0,
        click: false,
        monitor: false,
        offset_ms: 0.0,
        selected: 2,
    };
    app.offset_ms = WANT_FRAMES as f32 * 3.0 * 1000.0 / app.audio.sample_rate as f32;

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("wetyu")
            .with_inner_size([760.0, 520.0]),
        // No vsync: a key event must never wait on a frame present.
        glow_options: eframe::egui_glow::GlowConfiguration {
            vsync: false,
            ..Default::default()
        },
        ..Default::default()
    };
    eframe::run_native("wetyu", options, Box::new(|_cc| Ok(Box::new(app))))?;
    Ok(())
}
