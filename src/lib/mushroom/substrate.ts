// The wood a cluster grows out of.
//
// Kept separate from the fruiting-body generator on purpose: a substrate is not
// part of the organism, and folding it into `buildFruitingBody` would make that
// function mean two things. Same contract though — pure, seeded, returns plain
// typed arrays — so it stays testable and deterministic alongside the cluster.
//
// It earns its place beyond decoration. A cluster rendered in void has nothing
// to cast onto, and cast shadow is most of what makes the flesh read as solid
// rather than as a floating cutout.

import { makeNoise } from '$lib/art/noise';
import { mulberry32 } from '$lib/art/rng';
import type { Mesh, PartName, PartRange } from './types';

const TAU = Math.PI * 2;
/** Angular resolution around the log. */
const AROUND = 72;
/** Rings across the sawn face. */
const FACE_RINGS = 18;
/** Vertical divisions down the bark. */
const STACKS = 10;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export interface SubstrateOptions {
  /** Radius of the log, in mm. */
  readonly radius: number;
  /** How far down it extends below the sawn face. */
  readonly depth: number;
  /** Height of the sawn face — the cluster sits on this. */
  readonly topY: number;
  readonly seed: number;
}

/**
 * A sawn log end: bark around the outside, a growth-ringed face on top.
 *
 * Weathered rather than fresh — oysters fruit on dead wood, and a bright sawmill
 * yellow would put the cluster on timber it would never actually colonise.
 */
export function buildSubstrate(opts: SubstrateOptions): Mesh {
  const { radius, depth, topY, seed } = opts;
  const rand = mulberry32(seed ^ 0x5eed);
  const noise = makeNoise(seed ^ 0x5eed);

  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const parts: Partial<Record<PartName, PartRange[]>> = {};

  // Dark enough to sit UNDER the cluster tonally. At the pale end these read as
  // sand rather than wood, and — worse — they matched the caps closely enough
  // that the cluster stopped standing out against its own substrate.
  const bark = hexToRgb('#2b2119');
  const barkLight = hexToRgb('#4a3b2c');
  const face = hexToRgb('#6a5f4f');
  const ring = hexToRgb('#3f3629');
  const heart = hexToRgb('#524634');

  const vertex = (x: number, y: number, z: number, c: Rgb): number => {
    const i = pos.length / 3;
    pos.push(x, y, z);
    col.push(c[0], c[1], c[2]);
    return i;
  };
  const tri = (a: number, b: number, c: number): void => { idx.push(a, b, c); };
  const quad = (a: number, b: number, c: number, d: number): void => {
    tri(a, b, c);
    tri(a, c, d);
  };

  /** Outline radius at an angle — a real log is not a circle. */
  const outline = (a: number): number => {
    const wobble = noise(Math.cos(a) * 1.6 + 5, Math.sin(a) * 1.6 + 5, 5) - 0.5;
    const knots = noise(Math.cos(a) * 5.5 + 17, Math.sin(a) * 5.5 + 17, 17) - 0.5;
    return radius * (1 + wobble * 0.13 + knots * 0.05);
  };

  // ---- Sawn face -----------------------------------------------------------
  const faceStart = pos.length / 3;
  const rings: number[][] = [];
  for (let i = 0; i <= FACE_RINGS; i++) {
    const t = i / FACE_RINGS;
    const row: number[] = [];
    for (let s = 0; s <= AROUND; s++) {
      const step = s === AROUND ? 0 : s;
      const a = (step / AROUND) * TAU;
      const r = outline(a) * t;
      // Growth rings: concentric bands, closer together toward the bark the way
      // later years are. Drawn in vertex colour rather than a texture, which
      // keeps the module free of any asset pipeline.
      const rr = t * 6.2;
      const band = 0.5 + 0.5 * Math.sin(rr * rr * 1.5);
      const grain = noise(Math.cos(a) * t * 8 + 31, Math.sin(a) * t * 8 + 31, 31) - 0.5;
      let c = mix(face, ring, band * 0.85 + grain * 0.35);
      // Heartwood sits darker in the middle.
      c = mix(c, heart, Math.max(0, 1 - t * 2.4) * 0.65);
      // The face dips very slightly toward the centre; sawn ends cup as they dry.
      // Roughness only ever cuts DOWN into the face: a symmetric displacement
      // lets grain lift vertices above topY, and the cluster sits on that plane,
      // so the wood would poke up through the mushrooms it is supporting.
      const y = topY - (1 - t) * radius * 0.035 - Math.abs(grain) * radius * 0.024;
      row.push(vertex(Math.cos(a) * r, y, Math.sin(a) * r, c));
    }
    rings.push(row);
  }
  for (let i = 0; i < FACE_RINGS; i++) {
    const inner = rings[i]!;
    const outer = rings[i + 1]!;
    for (let s = 0; s < AROUND; s++) {
      quad(inner[s]!, inner[s + 1]!, outer[s + 1]!, outer[s]!);
    }
  }
  parts.wood = [[faceStart, pos.length / 3] as PartRange];

  // ---- Bark ----------------------------------------------------------------
  const barkStart = pos.length / 3;
  const walls: number[][] = [];
  for (let j = 0; j <= STACKS; j++) {
    const v = j / STACKS;
    const row: number[] = [];
    for (let s = 0; s <= AROUND; s++) {
      const step = s === AROUND ? 0 : s;
      const a = (step / AROUND) * TAU;
      // Vertical striations: high frequency around, low frequency down, which
      // is what makes bark read as bark rather than as a noisy cylinder.
      const ridge = noise(Math.cos(a) * 9 + 41, Math.sin(a) * 9 + 41, v * 2.2 + 41) - 0.5;
      const r = outline(a) * (1 + ridge * 0.06);
      const shade = 0.5 + ridge * 1.5 + (rand() - 0.5) * 0.08;
      const c = mix(bark, barkLight, Math.max(0, Math.min(1, shade)));
      row.push(vertex(Math.cos(a) * r, topY - v * depth, Math.sin(a) * r, c));
    }
    walls.push(row);
  }
  for (let j = 0; j < STACKS; j++) {
    const top = walls[j]!;
    const below = walls[j + 1]!;
    for (let s = 0; s < AROUND; s++) {
      quad(top[s]!, top[s + 1]!, below[s + 1]!, below[s]!);
    }
  }
  parts.bark = [[barkStart, pos.length / 3] as PartRange];

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(pos.length), // recomputed downstream
    colors: new Float32Array(col),
    indices: new Uint32Array(idx),
    parts,
  };
}
