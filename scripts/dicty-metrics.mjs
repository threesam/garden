// Quantifies whether a Dictyostelium parameter set is in the spiral-wave
// regime, so the search can be driven by numbers instead of by eye.
//
// Usage:
//   node scripts/dicty-metrics.mjs [cells] [threshold pulse refractory decay diffuse speed spontaneous]
//
// Prints a JSON line. Every metric exists because a specific failure mode was
// indistinguishable from success without it:
//
//   coverage      fraction of the plate carrying signal. Near 1.0 means the
//                 medium is saturated and firing globally rather than
//                 propagating; near 0 means signalling has died out.
//   oscillation   std/mean of total cAMP over time. Waves make the global
//                 signal rise and fall; a saturated or dead plate is flat.
//                 This is the single best discriminator of a live medium.
//   fronts        connected components of the signal field. A handful means
//                 large coherent spirals or targets; hundreds means the front
//                 has shattered into unconnected patches.
//   frontSize     mean component area, in cells.
//   clumping      max cell density / mean. Rises as amoebae aggregate; 1.0
//                 means nothing has aggregated at all.
//   alive         signalling still present at the end of the run rather than
//                 having burned out during the transient.

import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2).map(Number);
const CELLS_N = Number.isFinite(args[0]) ? args[0] : 150_000;
const TUNE = args.slice(1);
const STEPS = 700;
const SAMPLE_FROM = 350; // ignore the startup transient

const bytes = await readFile('static/wasm/garden_math.wasm');
const { instance: { exports: x } } = await WebAssembly.instantiate(bytes, {});

x.dicty_init(CELLS_N, 4242);
if (TUNE.length === 7) x.dicty_tune(...TUNE);

const g = x.physarum_grid();
const px = new Uint8Array(x.memory.buffer, x.dicty_pixels(), g * g * 4);

/** Blue channel tracks cAMP; green also carries it, red is the cell overlay. */
const signalAt = (i) => px[i * 4 + 2];

const totals = [];
for (let step = 0; step < STEPS; step++) {
  x.dicty_step();
  if (step >= SAMPLE_FROM) {
    let sum = 0;
    for (let i = 0; i < g * g; i += 7) sum += signalAt(i); // strided sample
    totals.push(sum);
  }
}

const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
const variance = totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length;
const oscillation = mean > 0 ? Math.sqrt(variance) / mean : 0;

// Connected components of the signal field, 4-connected, iterative flood fill.
const LIT = 95;
const seen = new Uint8Array(g * g);
let components = 0;
let litTotal = 0;
const stack = [];
for (let i = 0; i < g * g; i++) {
  if (signalAt(i) > LIT) litTotal++;
  if (seen[i] || signalAt(i) <= LIT) continue;
  components++;
  stack.length = 0;
  stack.push(i);
  seen[i] = 1;
  while (stack.length) {
    const p = stack.pop();
    const px_ = p % g;
    const py = (p / g) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = (px_ + dx + g) % g;
      const ny = (py + dy + g) % g;
      const n = ny * g + nx;
      if (!seen[n] && signalAt(n) > LIT) {
        seen[n] = 1;
        stack.push(n);
      }
    }
  }
}

// Cell overlay lives in the red channel above the teal wave ramp.
let maxCell = 0;
let cellSum = 0;
for (let i = 0; i < g * g; i++) {
  const v = px[i * 4];
  cellSum += v;
  if (v > maxCell) maxCell = v;
}
const cellMean = cellSum / (g * g);

console.log(
  JSON.stringify({
    cells: CELLS_N,
    tune: TUNE.length === 7 ? TUNE : 'defaults',
    coverage: +(litTotal / (g * g)).toFixed(4),
    oscillation: +oscillation.toFixed(4),
    fronts: components,
    frontSize: components ? Math.round(litTotal / components) : 0,
    clumping: +(cellMean > 0 ? maxCell / cellMean : 0).toFixed(2),
    alive: litTotal > g * g * 0.005,
  }),
);
