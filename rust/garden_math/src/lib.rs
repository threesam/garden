#[no_mangle]
pub extern "C" fn wave(x: f32, y: f32, time: f32, audio_level: f32) -> f32 {
    let a = (x * 1.7 + time * 0.7).sin();
    let b = (y * 1.9 - time * 0.55).cos();
    let c = ((x + y) * 1.1 + time * 0.32).sin();
    (a + b + c * 0.5) * (0.35 + audio_level * 0.5)
}
