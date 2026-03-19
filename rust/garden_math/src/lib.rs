#[no_mangle]
pub extern "C" fn wave(x: f32, y: f32, time: f32, audio_level: f32) -> f32 {
    let a = (x * 1.7 + time * 0.7).sin();
    let b = (y * 1.9 - time * 0.55).cos();
    let c = ((x + y) * 1.1 + time * 0.32).sin();
    (a + b + c * 0.5) * (0.35 + audio_level * 0.5)
}

// --- Metaball clouds (3 layers) ---

// Deterministic seed per blob index + layer offset
fn blob_seed(i: usize, channel: u32, layer_offset: u32) -> f32 {
    let n = (i as u32)
        .wrapping_mul(2654435761)
        .wrapping_add(channel.wrapping_mul(668265263))
        .wrapping_add(layer_offset.wrapping_mul(1103515245));
    let n = (n ^ (n >> 13)).wrapping_mul(1274126177);
    let n = n ^ (n >> 16);
    (n & 0xffff) as f32 / 0xffff as f32
}

const WRAP_W: f32 = 3.0;

fn metaball_layer(
    x: f32,
    y: f32,
    time: f32,
    num_blobs: usize,
    layer: u32,
    speed_mult: f32,
    radius_min: f32,
    radius_range: f32,
    squash: f32,
    threshold: f32,
    softness: f32,
) -> f32 {
    let mut field: f32 = 0.0;

    for i in 0..num_blobs {
        let radius = radius_min + blob_seed(i, 0, layer) * radius_range;
        let base_y = 0.1 + blob_seed(i, 1, layer) * 0.8;
        let speed = (0.01 + blob_seed(i, 2, layer) * 0.02) * speed_mult;
        let phase = blob_seed(i, 3, layer) * WRAP_W;

        let wobble = (time * (0.08 + blob_seed(i, 4, layer) * 0.12)
            + blob_seed(i, 5, layer) * 6.28)
            .sin()
            * 0.03;
        let by = base_y + wobble;

        let raw_x = phase + time * speed;
        let bx = ((raw_x % WRAP_W) + WRAP_W) % WRAP_W;

        let r_sq = radius * radius;
        for &offset in &[-WRAP_W, 0.0, WRAP_W] {
            let dx = x - (bx + offset);
            let dy = (y - by) * squash;
            let d_sq = dx * dx + dy * dy;

            if d_sq < r_sq * 6.0 {
                field += r_sq / (d_sq + 0.0001);
            }
        }
    }

    ((field - threshold) / softness).max(0.0).min(1.0)
}

/// Cloud density for a specific layer.
/// layer: 0 = background, 1 = middleground, 2 = foreground
/// Returns 0.0..1.0 density value.
#[no_mangle]
pub extern "C" fn cloud_density(x: f32, y: f32, time: f32, layer: u32) -> f32 {
    match layer {
        // Background: large, slow, fewer blobs, softer
        0 => metaball_layer(
            x, y, time,
            8,      // num_blobs
            0,      // layer seed
            0.5,    // speed_mult (slowest)
            0.12,   // radius_min (biggest)
            0.18,   // radius_range
            1.4,    // squash (widest)
            0.9,    // threshold (softer entry)
            0.8,    // softness (most diffuse)
        ),
        // Middleground: medium size, medium speed
        1 => metaball_layer(
            x, y, time,
            10,     // num_blobs
            1,      // layer seed
            1.0,    // speed_mult
            0.07,   // radius_min
            0.12,   // radius_range
            1.8,    // squash
            1.0,    // threshold
            0.6,    // softness
        ),
        // Foreground: smaller, fastest, more defined
        _ => metaball_layer(
            x, y, time,
            7,      // num_blobs (fewer but more present)
            2,      // layer seed
            1.8,    // speed_mult (fastest)
            0.05,   // radius_min (smallest)
            0.09,   // radius_range
            2.0,    // squash (tightest)
            1.1,    // threshold (sharpest edge)
            0.4,    // softness (crispest)
        ),
    }
}
