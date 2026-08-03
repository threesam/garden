// Fruiting-body geometry from a blueprint.
//
// Pure: takes a plain object, returns plain typed arrays. Knows nothing about
// three.js, the DOM or time-stepping, which is what lets the morphology be
// unit-tested without a browser.
//
// Most fungal geometry is a surface of revolution plus a radial array, so the
// builders below are all variations on lathing a profile curve and repeating
// something around Y.
//
// See docs/superpowers/specs/2026-08-02-mushroom-generator-design.md

import { mulberry32 } from '$lib/art/rng';
import { sampleSpecimen } from './blueprint';
import type { Blueprint, CapProfile, Mesh, PartName, PartRange, Specimen } from './types';

const RADIAL = 48;
const PROFILE_STEPS = 20;
const TAU = Math.PI * 2;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Accumulates triangles; every builder writes into one of these. */
class MeshBuilder {
  private readonly pos: number[] = [];
  private readonly nor: number[] = [];
  private readonly col: number[] = [];
  private readonly idx: number[] = [];
  private readonly parts: Partial<Record<PartName, PartRange>> = {};

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  /** Record everything `fn` emits as belonging to `name`. */
  part(name: PartName, fn: () => void): void {
    const start = this.vertexCount;
    fn();
    this.parts[name] = [start, this.vertexCount] as PartRange;
  }

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, c: [number, number, number]): number {
    const i = this.vertexCount;
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
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
 * Cap outline as [radius 0..1, height 0..1] samples, apex-first.
 *
 * `openness` is growth: a young cap is tightly domed and unfurls as it
 * matures, so the profile flattens toward the species' published proportion
 * rather than simply scaling up.
 */
function capProfile(profile: CapProfile, openness: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const u = i / PROFILE_STEPS; // 0 at apex, 1 at margin
    let y: number;
    switch (profile) {
      case 'convex':
        y = Math.cos((u * Math.PI) / 2);
        break;
      case 'campanulate':
        // Bell: falls away steeply, so the widest point sits below the apex.
        y = Math.cos((u * Math.PI) / 2) ** 0.55;
        break;
      case 'plane':
        y = 1 - u * 0.92;
        break;
      case 'infundibuliform':
        // Funnel: the centre is BELOW the margin, so height climbs outward.
        y = u * u * 0.85;
        break;
      case 'umbonate': {
        const dome = Math.cos((u * Math.PI) / 2);
        const boss = Math.exp(-((u * 5) ** 2)) * 0.35;
        y = dome + boss;
        break;
      }
      case 'bracket':
        // Shelf: nearly flat, thickening toward the attached edge.
        y = (1 - u) * 0.35;
        break;
    }
    // Young caps are more closed; unfurling raises the margin toward its
    // mature position without changing the family of curve.
    const young = profile === 'infundibuliform' ? y : y ** (1 + (1 - openness) * 1.6);
    pts.push([u, young]);
  }
  return pts;
}

/** Revolve a profile around Y. `half` sweeps 180° only, for brackets. */
function lathe(
  mb: MeshBuilder,
  pts: readonly [number, number][],
  radius: number,
  height: number,
  colour: [number, number, number],
  yOffset: number,
  half = false,
): void {
  const arc = half ? Math.PI : TAU;
  const rings: number[][] = [];
  for (const [u, v] of pts) {
    const ring: number[] = [];
    for (let s = 0; s <= RADIAL; s++) {
      const a = (s / RADIAL) * arc;
      const r = u * radius;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      // Cheap outward-and-up normal; good enough for a lit surface and far
      // cheaper than differentiating the profile per vertex.
      const nl = Math.hypot(x, v * radius, z) || 1;
      ring.push(mb.vertex(x, v * height + yOffset, z, x / nl, 0.6, z / nl, colour));
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let s = 0; s < RADIAL; s++) {
      mb.quad(a[s]!, a[s + 1]!, b[s + 1]!, b[s]!);
    }
  }
}

/** Tapered tube along Y. Used for stipes and for clavarioid clubs. */
function tube(
  mb: MeshBuilder,
  baseR: number,
  topR: number,
  height: number,
  colour: [number, number, number],
  yOffset: number,
  bulbous: boolean,
): void {
  const STACKS = 14;
  const rings: number[][] = [];
  for (let i = 0; i <= STACKS; i++) {
    const v = i / STACKS;
    let r = baseR + (topR - baseR) * v;
    // A bulbous base swells in the bottom fifth then tucks back in.
    if (bulbous && v < 0.2) r *= 1 + Math.sin((1 - v / 0.2) * Math.PI * 0.5) * 0.8;
    const ring: number[] = [];
    for (let s = 0; s <= RADIAL; s++) {
      const a = (s / RADIAL) * TAU;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      ring.push(mb.vertex(x, v * height + yOffset, z, Math.cos(a), 0, Math.sin(a), colour));
    }
    rings.push(ring);
  }
  for (let i = 0; i < STACKS; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let s = 0; s < RADIAL; s++) mb.quad(a[s]!, a[s + 1]!, b[s + 1]!, b[s]!);
  }
}

/**
 * Radial blades under a cap. `innerR` is what makes attachment diagnostic:
 * free gills stop short of the stipe entirely, decurrent ones run onto it.
 */
function gills(
  mb: MeshBuilder,
  count: number,
  innerR: number,
  outerR: number,
  capPts: readonly [number, number][],
  capHeight: number,
  depth: number,
  colour: [number, number, number],
  yOffset: number,
  runDown: number,
): void {
  const heightAt = (r: number): number => {
    const u = clamp01(r / outerR);
    const i = Math.min(capPts.length - 1, Math.floor(u * (capPts.length - 1)));
    return capPts[i]![1] * capHeight;
  };
  for (let g = 0; g < count; g++) {
    const a = (g / count) * TAU;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const nx = -Math.sin(a);
    const nz = Math.cos(a);
    const STEPS = 6;
    const top: number[] = [];
    const bot: number[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const r = innerR + ((outerR - innerR) * i) / STEPS;
      const yTop = heightAt(r) + yOffset;
      // Decurrent gills continue below the cap onto the stipe.
      const drop = depth + (i === 0 ? runDown : 0);
      top.push(mb.vertex(cx * r, yTop, cz * r, nx, 0, nz, colour));
      bot.push(mb.vertex(cx * r, yTop - drop, cz * r, nx, 0, nz, colour));
    }
    for (let i = 0; i < STEPS; i++) mb.quad(top[i]!, top[i + 1]!, bot[i + 1]!, bot[i]!);
  }
}

/** Pore layer: a shallow slab under a bracket, dimpled to read as tubes. */
function pores(
  mb: MeshBuilder,
  radius: number,
  depth: number,
  colour: [number, number, number],
  yOffset: number,
  poresPerMm: number,
): void {
  const rings = 10;
  const prev: number[] = [];
  const cur: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const r = (i / rings) * radius;
    for (let s = 0; s <= RADIAL; s++) {
      const a = (s / RADIAL) * Math.PI;
      // Ripple at the pore frequency — reads as texture, not as geometry.
      const dimple = Math.sin(r * poresPerMm * 0.6) * Math.sin(a * RADIAL * 0.25) * depth * 0.12;
      const v = mb.vertex(
        Math.cos(a) * r,
        yOffset - depth + dimple,
        Math.sin(a) * r,
        0,
        -1,
        0,
        colour,
      );
      if (i === 0) prev.push(v);
      else cur.push(v);
    }
    if (i > 0) {
      for (let s = 0; s < RADIAL; s++) {
        mb.quad(prev[s]!, prev[s + 1]!, cur[s + 1]!, cur[s]!);
      }
      prev.length = 0;
      prev.push(...cur);
      cur.length = 0;
    }
  }
}

/** A lobed cushion — the mass a hydnoid fungus hangs its spines from. */
function cushion(
  mb: MeshBuilder,
  radius: number,
  lobes: number,
  colour: [number, number, number],
  rand: () => number,
): void {
  const STACKS = 16;
  const rings: number[][] = [];
  for (let i = 0; i <= STACKS; i++) {
    const phi = (i / STACKS) * Math.PI;
    const ring: number[] = [];
    for (let s = 0; s <= RADIAL; s++) {
      const th = (s / RADIAL) * TAU;
      // Lobing: radius modulated around the sphere so it reads as a mass of
      // fused branches rather than a ball.
      const lobe = 1 + Math.cos(th * lobes) * 0.18 + Math.cos(phi * 3) * 0.1;
      const r = radius * lobe;
      const x = Math.sin(phi) * Math.cos(th) * r;
      const y = Math.cos(phi) * r * 0.8;
      const z = Math.sin(phi) * Math.sin(th) * r;
      const n = Math.hypot(x, y, z) || 1;
      ring.push(mb.vertex(x, y, z, x / n, y / n, z / n, colour));
    }
    rings.push(ring);
  }
  for (let i = 0; i < STACKS; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let s = 0; s < RADIAL; s++) mb.quad(a[s]!, a[s + 1]!, b[s + 1]!, b[s]!);
  }
  void rand;
}

/** Downward-hanging spines. They fall under gravity, not radially. */
function teeth(
  mb: MeshBuilder,
  radius: number,
  count: number,
  lengthMin: number,
  lengthMax: number,
  colour: [number, number, number],
  rand: () => number,
): void {
  for (let i = 0; i < count; i++) {
    // Even-ish spread over the lower hemisphere.
    const th = rand() * TAU;
    const phi = Math.acos(1 - rand() * 0.95);
    const r = radius * 0.92;
    const x = Math.sin(phi) * Math.cos(th) * r;
    const z = Math.sin(phi) * Math.sin(th) * r;
    const y = -Math.abs(Math.cos(phi)) * r * 0.8;
    const len = lengthMin + rand() * (lengthMax - lengthMin);
    const w = Math.max(0.6, len * 0.06);
    const tip = mb.vertex(x, y - len, z, 0, -1, 0, colour);
    const ring: number[] = [];
    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * TAU;
      ring.push(mb.vertex(x + Math.cos(a) * w, y, z + Math.sin(a) * w, Math.cos(a), 0.2, Math.sin(a), colour));
    }
    for (let s = 0; s < 5; s++) mb.triangle(ring[s]!, ring[(s + 1) % 5]!, tip);
  }
}

/**
 * Growth. Stipe elongation precedes cap expansion in agarics, so the two run
 * on different curves rather than one uniform scale — that is what makes a
 * timelapse read as growing rather than as zooming.
 */
function growthFactors(t: number): { stipe: number; cap: number; openness: number } {
  const g = clamp01(t);
  return {
    stipe: smoothstep(clamp01(g / 0.7)),
    cap: smoothstep(clamp01((g - 0.25) / 0.75)),
    openness: smoothstep(clamp01((g - 0.4) / 0.6)),
  };
}

/**
 * Build one fruiting body.
 *
 * @param t growth, 0..1. 1 is mature.
 * @param seed picks a specimen from the blueprint's ranges; same seed, same specimen.
 */
export function buildFruitingBody(bp: Blueprint, t = 1, seed = 1): Mesh {
  const mb = new MeshBuilder();
  const rand = mulberry32(seed);
  const spec: Specimen = sampleSpecimen(bp, seed);
  const f = growthFactors(t);

  switch (bp.bodyPlan) {
    case 'agaricoid':
      buildAgaric(mb, bp, spec, f);
      break;
    case 'polyporoid':
      buildPolypore(mb, bp, spec, f);
      break;
    case 'hydnoid':
      buildHydnoid(mb, bp, spec, f, rand);
      break;
    case 'clavarioid':
      buildClub(mb, bp, spec, f);
      break;
  }
  return mb.build();
}

type Factors = ReturnType<typeof growthFactors>;

function buildAgaric(mb: MeshBuilder, bp: Blueprint, spec: Specimen, f: Factors): void {
  const stipe = bp.stipe!;
  const cap = bp.cap!;
  const h = bp.hymenophore;
  const stipeLen = spec.stipeLength * f.stipe;
  const baseR = (spec.stipeDiameter / 2) * f.stipe;
  const topR = baseR * stipe.taper;
  // A lateral stipe sits at the cap's edge, which is why oysters shelf off wood.
  const offset = stipe.position === 'central' ? 0 : (spec.capDiameter / 2) * (stipe.position === 'lateral' ? 0.85 : 0.4);

  mb.part('stipe', () => { tube(mb, baseR, topR, stipeLen, hexToRgb(stipe.colour), 0, stipe.base === 'bulbous'); });

  const capR = (spec.capDiameter / 2) * f.cap;
  const capH = spec.capHeight * f.cap;
  const pts = capProfile(cap.profile, f.openness);
  mb.part('cap', () => { lathe(mb, pts, capR, capH, hexToRgb(cap.colour), stipeLen); });

  if (h.kind === 'gills' && f.cap > 0.05) {
    // Attachment decides where a blade starts — the diagnostic feature.
    const inner =
      h.attachment === 'free'
        ? topR * 2.2
        : h.attachment === 'adnexed'
          ? topR * 1.3
          : topR * 0.98;
    const runDown = h.attachment === 'decurrent' ? stipeLen * 0.25 : 0;
    const total = h.count * (1 + h.lamellulae * 0.5);
    mb.part('hymenophore', () =>
      { gills(mb, Math.round(total), inner, capR * 0.97, pts, capH, capH * 0.16, hexToRgb(h.colour), stipeLen, runDown); },
    );
  }
  void offset;
}

function buildPolypore(mb: MeshBuilder, bp: Blueprint, spec: Specimen, f: Factors): void {
  const cap = bp.cap!;
  const h = bp.hymenophore;
  const capR = (spec.capDiameter / 2) * f.cap;
  const capH = Math.max(spec.capHeight, 1) * f.cap;
  const pts = capProfile(cap.profile, f.openness);
  // Half sweep: a bracket is a shelf, attached along one edge.
  mb.part('cap', () => { lathe(mb, pts, capR, capH, hexToRgb(cap.colour), 0, true); });
  if (h.kind === 'pores' && f.cap > 0.05) {
    mb.part('hymenophore', () => { pores(mb, capR * 0.98, h.depthMm * f.cap, hexToRgb(h.colour), 0, h.poresPerMm); });
  }
  if (bp.stipe) {
    const r = (spec.stipeDiameter / 2) * f.stipe;
    mb.part('stipe', () =>
      { tube(mb, r, r * bp.stipe!.taper, spec.stipeLength * f.stipe, hexToRgb(bp.stipe!.colour), -spec.stipeLength * f.stipe, false); },
    );
  }
}

function buildHydnoid(mb: MeshBuilder, bp: Blueprint, spec: Specimen, f: Factors, rand: () => number): void {
  const cu = bp.cushion!;
  const h = bp.hymenophore;
  const r = (spec.cushionDiameter / 2) * f.cap;
  mb.part('cushion', () => { cushion(mb, r, cu.lobes, hexToRgb(cu.colour), rand); });
  if (h.kind === 'teeth' && f.openness > 0.02) {
    // Spine count from the published density over the cushion's lower surface.
    const areaCm2 = (TAU * (r / 10) ** 2) / 2;
    const count = Math.max(12, Math.round(areaCm2 * h.densityPerCm2));
    mb.part('hymenophore', () =>
      { teeth(mb, r, count, h.lengthMm[0] * f.openness, h.lengthMm[1] * f.openness, hexToRgb(h.colour), rand); },
    );
  }
}

function buildClub(mb: MeshBuilder, bp: Blueprint, spec: Specimen, f: Factors): void {
  const stipe = bp.stipe!;
  const len = spec.stipeLength * f.stipe;
  const baseR = (spec.stipeDiameter / 2) * f.stipe;
  // taper > 1 swells toward the fertile head, which is the club's whole shape.
  mb.part('stipe', () => { tube(mb, baseR, baseR * stipe.taper, len, hexToRgb(stipe.colour), 0, stipe.base === 'bulbous'); });
}
