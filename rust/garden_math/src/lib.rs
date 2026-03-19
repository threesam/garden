#[no_mangle]
pub extern "C" fn wave(x: f32, y: f32, time: f32, audio_level: f32) -> f32 {
    let a = (x * 1.7 + time * 0.7).sin();
    let b = (y * 1.9 - time * 0.55).cos();
    let c = ((x + y) * 1.1 + time * 0.32).sin();
    (a + b + c * 0.5) * (0.35 + audio_level * 0.5)
}

// --- FBM noise clouds (3 layers) ---

fn hash(x: i32, y: i32) -> f32 {
    let n = x.wrapping_mul(374761393).wrapping_add(y.wrapping_mul(668265263));
    let n = (n ^ (n >> 13)).wrapping_mul(1274126177);
    let n = n ^ (n >> 16);
    (n & 0x7fffffff) as f32 / 0x7fffffff as f32
}

fn smooth_noise(x: f32, y: f32) -> f32 {
    let xi = x.floor() as i32;
    let yi = y.floor() as i32;
    let fx = x - x.floor();
    let fy = y - y.floor();

    let sx = fx * fx * (3.0 - 2.0 * fx);
    let sy = fy * fy * (3.0 - 2.0 * fy);

    let n00 = hash(xi, yi);
    let n10 = hash(xi + 1, yi);
    let n01 = hash(xi, yi + 1);
    let n11 = hash(xi + 1, yi + 1);

    let nx0 = n00 + sx * (n10 - n00);
    let nx1 = n01 + sx * (n11 - n01);

    nx0 + sy * (nx1 - nx0)
}

fn fbm(x: f32, y: f32, octaves: i32) -> f32 {
    let mut value = 0.0_f32;
    let mut amplitude = 0.5_f32;
    let mut frequency = 1.0_f32;

    for _ in 0..octaves {
        value += amplitude * smooth_noise(x * frequency, y * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    value
}

/// Cloud density for a specific layer using FBM noise.
/// layer: 0 = background (slowest), 1 = middleground, 2 = foreground (fastest)
/// Returns 0.0..1.0 density value.
#[no_mangle]
pub extern "C" fn cloud_density(x: f32, y: f32, time: f32, layer: u32) -> f32 {
    // Per-layer config: (speed, scale, y_scale, octaves, threshold, seed_offset)
    let (speed, scale, y_scale, octaves, threshold) = match layer {
        // Background: large, slow, soft
        0 => (0.012, 2.5, 1.5, 6, 0.32),
        // Middleground: medium
        1 => (0.025, 3.5, 2.0, 5, 0.36),
        // Foreground: smaller detail, fastest
        _ => (0.045, 5.0, 3.0, 4, 0.40),
    };

    // Seed offset so layers don't overlap
    let seed_x = (layer as f32) * 137.0;
    let seed_y = (layer as f32) * 241.0;

    let drift = time * speed;

    let nx = x * scale + drift + seed_x;
    let ny = y * y_scale + seed_y;

    let n = fbm(nx, ny, octaves);

    // Shape into clouds
    let shaped = ((n - threshold) * 3.0).max(0.0).min(1.0);

    // Soft edges
    shaped * shaped
}
