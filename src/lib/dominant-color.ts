// Extract a perceptually-dominant color from an image.
// Runs in the browser; returns RGB in [0,1] or null on failure.

export async function extractDominantColor(
  src: string
): Promise<[number, number, number] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max - min;
          const lum = (r + g + b) / 3;

          // skip near-black, near-white, and desaturated pixels — they're usually
          // background, page, or ink, not the book's identity color.
          if (lum < 28) continue;
          if (lum > 235) continue;
          if (sat < 25) continue;

          // 5-bit quantization: 32 levels per channel → 32^3 = 32k buckets max.
          const key = `${r >> 3}-${g >> 3}-${b >> 3}`;
          const existing = buckets.get(key);
          // weight saturated + mid-luminance pixels more — they read as "the color".
          const weight = sat * 0.02 + 1;
          if (existing) {
            existing.r += r * weight;
            existing.g += g * weight;
            existing.b += b * weight;
            existing.count += weight;
            existing.score += weight;
          } else {
            buckets.set(key, {
              r: r * weight,
              g: g * weight,
              b: b * weight,
              count: weight,
              score: weight,
            });
          }
        }

        if (buckets.size === 0) return resolve(null);

        let winner: { r: number; g: number; b: number; count: number } | null = null;
        for (const bucket of buckets.values()) {
          if (!winner || bucket.score > (winner as typeof bucket).count) {
            winner = { r: bucket.r, g: bucket.g, b: bucket.b, count: bucket.score };
          }
        }
        if (!winner) return resolve(null);

        resolve([
          winner.r / winner.count / 255,
          winner.g / winner.count / 255,
          winner.b / winner.count / 255,
        ]);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
