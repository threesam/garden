// Oyster-cluster geometry from a blueprint.
//
// Pure: takes a plain object, returns plain typed arrays. Knows nothing about
// three.js, the DOM or time-stepping, which is what lets the shape be tested
// without a browser.
//
// The unit built here is a CLUSTER, not a mushroom. Pleurotus shelves in
// overlapping tiers off one patch of mycelium, and that shingled arrangement
// is most of what makes a photograph recognisable as an oyster. A single
// specimen, however carefully modelled, reads as a generic toadstool.
//
// Each cap is a fan lathed about ITS OWN attachment point rather than a disc
// with a stem attached at the edge. That one change is what makes the gills
// radiate from the attachment, which is the arrangement the eye actually
// reads in the reference photograph.

import { makeNoise } from '$lib/art/noise';
import { mulberry32 } from '$lib/art/rng';
import { sampleSpecimen } from './blueprint';
import type { Blueprint, Mesh, PartName, PartRange, Specimen } from './types';

const TAU = Math.PI * 2;
/** Angular resolution across one fan. */
const FAN_SEGMENTS = 56;
/** Radial resolution from attachment to margin. */
const RADIAL_STEPS = 22;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/**
 * Accumulates triangles.
 *
 * Carries a placement so a single fan can be authored once in local space and
 * stamped repeatedly into the cluster. Without it every cap would need its own
 * trigonometry inline, and the shingling would be unreadable.
 */
class MeshBuilder {
  private readonly pos: number[] = [];
  private readonly nor: number[] = [];
  private readonly col: number[] = [];
  private readonly idx: number[] = [];
  private readonly parts: Partial<Record<PartName, PartRange[]>> = {};

  /** heading = rotation about Y; pitch = downward tilt away from attachment. */
  private place = { heading: 0, pitch: 0, x: 0, y: 0, z: 0 };

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  setPlacement(heading: number, pitch: number, x: number, y: number, z: number): void {
    this.place = { heading, pitch, x, y, z };
  }

  /** Record everything `fn` emits as one more run belonging to `name`. */
  part(name: PartName, fn: () => void): void {
    const start = this.vertexCount;
    fn();
    (this.parts[name] ??= []).push([start, this.vertexCount] as PartRange);
  }

  vertex(x: number, y: number, z: number, c: Rgb): number {
    const { heading, pitch, x: tx, y: ty, z: tz } = this.place;
    // Pitch first (about local Z, tipping the fan's outward axis down), then
    // heading (about Y), then translate into the cluster.
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const px = x * cp - y * sp;
    const py = x * sp + y * cp;
    const ch = Math.cos(heading);
    const sh = Math.sin(heading);
    const i = this.vertexCount;
    this.pos.push(px * ch - z * sh + tx, py + ty, px * sh + z * ch + tz);
    // Normals are recomputed downstream from the displaced triangles; these
    // are placeholders so the attribute exists and is the right length.
    this.nor.push(0, 1, 0);
    this.col.push(c[0], c[1], c[2]);
    return i;
  }

  triangle(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }

  quad(a: number, b: number, c: number, d: number): void {
    this.triangle(a, b, c);
    this.triangle(a, c, d);
  }

  build(): Mesh {
    return {
      positions: new Float32Array(this.pos),
      normals: new Float32Array(this.nor),
      colors: new Float32Array(this.col),
      indices: new Uint32Array(this.idx),
      parts: this.parts,
    };
  }
}

/**
 * One cap's upper surface, in polar coordinates about its attachment.
 *
 * `u` runs 0 at the attachment to 1 at the margin; `a` is the angle within the
 * fan. Returns radius and height, so the shell, the underside and the gills
 * can all sample one definition and cannot drift apart. When the cap was
 * displaced but the gills were not, the blades stabbed out through the margin.
 */
interface Fan {
  readonly radius: number;
  readonly height: number;
  readonly thickness: number;
  readonly waviness: number;
  readonly noise: (x: number, y?: number, z?: number) => number;
}

function surface(fan: Fan, a: number, u: number): { r: number; y: number } {
  const { radius, height, waviness, noise } = fan;
  // Sampled in polar-mapped Cartesian space: a noise field indexed by raw
  // angle is discontinuous where the fan closes, which tears a seam.
  const nx = u * Math.cos(a);
  const nz = u * Math.sin(a);
  const lobes = noise(nx * 2.1 + 3, nz * 2.1 + 3, 3) - 0.5;
  const ripple = noise(nx * 6.5 + 11, nz * 6.5 + 11, 11) - 0.5;
  const margin = smoothstep(0.68, 1, u);
  const roll = smoothstep(0.78, 1, u);
  const torn = Math.sin(a * 8.5 + noise(31, 0, 0) * TAU) * 0.055;

  // Margin waves, attachment does not. Real oyster caps are fan shells with
  // lobed, sometimes torn edges; most of that movement belongs at the last
  // third of the radius, not through the whole cap.
  const edgeLobing = (lobes * 0.26 + ripple * 0.12 + torn) * waviness * margin;
  const r = u * radius * (1 + edgeLobing);

  // A tongue, not a pillow. sin(u·pi) peaks halfway out, which puts a ridge
  // across the middle of the cap and is why every render so far looked
  // inflated. A shelf fungus is thickest where it attaches and slopes away
  // from there, so the profile declines monotonically and only the rim turns
  // back under.
  const base = 0.3 - 0.62 * u ** 1.5 - roll * 0.34;
  const verticalWave = (noise(nx * 3.2 + 29, nz * 3.2 + 29, 29) - 0.5) * height * 0.3 * waviness * margin;
  const y = height * base + verticalWave;
  return { r, y };
}

/** Flesh thickness, tapering to a thin rolled rim. */
function thicknessAt(fan: Fan, u: number): number {
  const roll = smoothstep(0.82, 1, u);
  return fan.thickness * (0.2 + 0.8 * (1 - u) ** 1.2 + 0.42 * roll);
}

/**
 * One fan: upper surface, underside, rim, gills and a stub stipe. Authored in
 * local space with the attachment at the origin, opening toward +x.
 */
function buildFan(
  mb: MeshBuilder,
  fan: Fan,
  bp: Blueprint,
  spec: Specimen,
  gillCount: number,
): void {
  const span = (bp.cap.fanDeg * Math.PI) / 180;
  const start = -span / 2;
  const capCol = hexToRgb(bp.cap.colour);
  const rimCol = hexToRgb(bp.cap.marginColour);
  const gillCol = hexToRgb(bp.gills.colour);
  const capShadowCol = mixRgb(capCol, [0.58, 0.57, 0.52], 0.45);
  const gillShadowCol = mixRgb(gillCol, [0.72, 0.68, 0.59], 0.34);

  // Upper surface and underside share the same grid, so the rim can be
  // stitched between them and the cap is a solid, not a sheet of paper.
  const top: number[][] = [];
  const bottom: number[][] = [];

  mb.part('cap', () => {
    for (let i = 0; i <= RADIAL_STEPS; i++) {
      const u = i / RADIAL_STEPS;
      const topRing: number[] = [];
      const botRing: number[] = [];
      for (let s = 0; s <= FAN_SEGMENTS; s++) {
        const a = start + (s / FAN_SEGMENTS) * span;
        const { r, y } = surface(fan, a, u);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const undersideTuck = 1 - smoothstep(0.78, 1, u) * 0.075;
        const bottomX = Math.cos(a) * r * undersideTuck;
        const bottomZ = Math.sin(a) * r * undersideTuck;
        const mottle = fan.noise(Math.cos(a) * u * 7 + 61, Math.sin(a) * u * 7 + 61, 61);
        const shade = fan.noise(Math.cos(a) * u * 2.6 + 73, Math.sin(a) * u * 2.6 + 73, 73);
        const rimMix = smoothstep(0.78, 1, u);
        let topCol = mixRgb(capCol, rimCol, rimMix);
        topCol = mixRgb(topCol, capShadowCol, clamp01((mottle - 0.42) * 0.28 + (shade - 0.5) * 0.18));
        // The underside is shaded, not striped. A sine indexed by segment
        // number paints fake gill lines whose spacing tracks mesh resolution
        // rather than the actual blades — and real blades are already modelled
        // hanging beneath this surface, so it double-draws them out of register.
        const undersideCol = mixRgb(gillCol, gillShadowCol, smoothstep(0.08, 0.92, u) * 0.35);
        topRing.push(mb.vertex(x, y, z, topCol));
        botRing.push(mb.vertex(bottomX, y - thicknessAt(fan, u), bottomZ, undersideCol));
      }
      top.push(topRing);
      bottom.push(botRing);
    }

    for (let i = 0; i < RADIAL_STEPS; i++) {
      const t0 = top[i]!;
      const t1 = top[i + 1]!;
      const b0 = bottom[i]!;
      const b1 = bottom[i + 1]!;
      for (let s = 0; s < FAN_SEGMENTS; s++) {
        mb.quad(t0[s]!, t0[s + 1]!, t1[s + 1]!, t1[s]!);
        mb.quad(b1[s]!, b1[s + 1]!, b0[s + 1]!, b0[s]!);
      }
    }

    // Rim, closing the shell along the outer arc.
    const tEdge = top[RADIAL_STEPS]!;
    const bEdge = bottom[RADIAL_STEPS]!;
    for (let s = 0; s < FAN_SEGMENTS; s++) {
      mb.quad(tEdge[s]!, tEdge[s + 1]!, bEdge[s + 1]!, bEdge[s]!);
    }
    // ...and along the two straight edges where the fan does not close.
    for (let i = 0; i < RADIAL_STEPS; i++) {
      mb.quad(top[i]![0]!, top[i + 1]![0]!, bottom[i + 1]![0]!, bottom[i]![0]!);
      const e = FAN_SEGMENTS;
      mb.quad(bottom[i]![e]!, bottom[i + 1]![e]!, top[i + 1]![e]!, top[i]![e]!);
    }
  });

  // Gills: blades hanging from the underside, radiating from the attachment.
  const gillDepth = spec.capDiameter * bp.gills.depthRatio;
  mb.part('gills', () => {
    for (let g = 0; g < gillCount; g++) {
      const a = start + ((g + 0.5) / gillCount) * span;
      const nx = -Math.sin(a);
      const nz = Math.cos(a);
      const edge: number[] = [];
      const root: number[] = [];
      for (let i = 0; i <= RADIAL_STEPS; i++) {
        const u = i / RADIAL_STEPS;
        const { r, y } = surface(fan, a, u);
        const yRoot = y - thicknessAt(fan, u);
        // Deepest around mid-radius, pinching out at both ends the way a real
        // blade does — a constant-depth blade reads as a comb.
        // Deep across most of the radius, vanishing exactly AT the rim. The
        // margin of a real cap is a thin blade of flesh with the gills already
        // run out; leaving them deep there hangs them past the silhouette like
        // comb teeth. sin(u·pi) was wrong the other way — it pinched to zero at
        // the attachment too, where the gills should be at their deepest.
        const depthProfile = 1 - clamp01(u) ** 3;
        const decurrent = 0.3 * (1 - u) ** 1.7;
        const depth = gillDepth * (depthProfile + decurrent);
        const tuck = 1 - smoothstep(0.78, 1, u) * 0.06;
        const px = Math.cos(a) * r * tuck;
        const pz = Math.sin(a) * r * tuck;
        const bladeCol = mixRgb(gillCol, gillShadowCol, clamp01((fan.noise(g * 0.12, u * 4.5, 91) - 0.42) * 0.35));
        root.push(mb.vertex(px, yRoot, pz, bladeCol));
        edge.push(mb.vertex(px + nx * 0.018, yRoot - depth, pz + nz * 0.018, bladeCol));
      }
      for (let i = 0; i < RADIAL_STEPS; i++) {
        mb.quad(root[i]!, root[i + 1]!, edge[i + 1]!, edge[i]!);
      }
    }
  });

  // Stub stipe: short, thick, and merging into the cap. Oysters barely have
  // one, so it reads as a swelling at the attachment rather than a stem.
  const stipeR = spec.stipeDiameter / 2;
  const stipeLen = spec.stipeLength;
  const stipeCol = hexToRgb(bp.stipe.colour);
  mb.part('stipe', () => {
    const STACKS = 8;
    const rings: number[][] = [];
    for (let i = 0; i <= STACKS; i++) {
      const v = i / STACKS;
      const r = stipeR * (1 - 0.22 * v);
      const ring: number[] = [];
      for (let s = 0; s <= 20; s++) {
        const a = ((s % 20) / 20) * TAU;
        ring.push(mb.vertex(Math.cos(a) * r - stipeLen * v * 0.28, -v * stipeLen * 0.18, Math.sin(a) * r, stipeCol));
      }
      rings.push(ring);
    }
    for (let i = 0; i < STACKS; i++) {
      for (let s = 0; s < 20; s++) {
        mb.quad(rings[i]![s]!, rings[i]![s + 1]!, rings[i + 1]![s + 1]!, rings[i + 1]![s]!);
      }
    }
  });
}

/**
 * Build one cluster.
 *
 * @param t growth, 0..1. Currently only the endpoints are tuned: 1 is a mature
 *   flush, 0 is the pinhead stage. The curve between them is not yet shaped.
 * @param seed picks a specimen and a cluster arrangement; same seed, same flush.
 */
export function buildFruitingBody(bp: Blueprint, t = 1, seed = 1): Mesh {
  const mb = new MeshBuilder();
  const rand = mulberry32(seed);
  const noise = makeNoise(seed);
  const spec = sampleSpecimen(bp, seed);
  const g = clamp01(t);

  const spread = (bp.cluster.spreadDeg * Math.PI) / 180;
  const baseD = spec.capDiameter;

  for (let i = 0; i < spec.capCount; i++) {
    // Deterministic per-cap jitter. Drawn before any early-out so the sequence
    // does not shift when the cap count changes.
    const jHeading = rand();
    const jSize = rand();
    const jPitch = rand();
    const jRise = rand();
    const jOut = rand();

    const frac = spec.capCount === 1 ? 0.5 : i / (spec.capCount - 1);
    const tier = Math.floor(i / 3);
    const tierCount = Math.max(1, Math.ceil(spec.capCount / 3) - 1);
    const tierFrac = tier / tierCount;
    // Fan the flush across an arc, with jitter so it is not a rosette.
    const heading = (frac - 0.5) * spread + (jHeading - 0.5) * spread * 0.16;
    // Caps behind and above are smaller — they emerged later and are shaded.
    const size = lerp(1.08, 0.54, tierFrac * 0.92) * (0.86 + jSize * 0.26);
    const radius = (baseD / 2) * size * g;
    // Tiers rise as they go back, but oyster clusters overlap like shingles;
    // too much air between tiers makes them look like stacked plates.
    const rise = tierFrac * baseD * bp.cluster.tierRise + (jRise - 0.5) * baseD * 0.045;
    // Attachment points share one mycelial base. Keep them close enough that
    // the caps appear to emerge together instead of on visible stalks.
    const out = (0.06 + jOut * 0.26) * baseD;
    // Front caps tip further over; the whole flush droops away from the wood.
    // Tilted UP and outward, not down. A cluster on dead wood curves its
    // margins away from the attachment and toward the light, which is what
    // presents the gilled underside to anyone standing in front of it.
    // Pitching the caps downward instead — which is what "shelf" suggests —
    // hides the gills from every viewpoint that could otherwise see them.
    const pitch = 0.12 + (1 - tierFrac) * 0.3 + (jPitch - 0.5) * 0.14;

    mb.setPlacement(heading, pitch, Math.cos(heading) * out, rise, Math.sin(heading) * out);

    const fan: Fan = {
      radius,
      height: radius * bp.cap.heightRatio * 2,
      thickness: Math.max(0.4, baseD * bp.cap.thicknessRatio * size),
      waviness: bp.cap.waviness,
      // Salted per cap so no two fans wave identically.
      noise: (x, y = 0, z = 0) => noise(x + i * 13.7, y + i * 7.3, z),
    };
    // Blade count scales with the arc actually present, so small caps are not
    // crowded with the same number of gills as the largest.
    const gillCount = Math.max(10, Math.round(bp.gills.count * size));
    buildFan(mb, fan, bp, { ...spec, capDiameter: radius * 2 }, gillCount);
  }

  return mb.build();
}
