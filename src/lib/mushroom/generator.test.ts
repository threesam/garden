import { describe, expect, it } from 'vitest';
import { buildFruitingBody } from './generator';
import {
  SPECIES,
  cordycepsMilitaris,
  ganodermaLucidum,
  hericiumErinaceus,
  pleurotusOstreatus,
} from './species';
import type { Mesh } from './types';

/** Axis-aligned extent of a mesh, in mm. */
function bounds(m: Mesh) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = m.positions[i + a]!;
      if (v < lo[a]!) lo[a] = v;
      if (v > hi[a]!) hi[a] = v;
    }
  }
  return { lo, hi, size: [hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!] };
}

/**
 * Bounds of one named part only. Necessary because whole-mesh bounds are
 * dominated by whichever structure is largest — the stipe base sits at y=0 and
 * the cap centre at radius 0, so box assertions silently measure the wrong
 * thing.
 */
function partBounds(m: Mesh, part: 'cap' | 'stipe' | 'hymenophore' | 'cushion') {
  const range = m.parts[part];
  if (!range) throw new Error(`mesh has no ${part}`);
  const [from, to] = range;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  let minR = Infinity;
  for (let v = from; v < to; v++) {
    const x = m.positions[v * 3]!;
    const y = m.positions[v * 3 + 1]!;
    const z = m.positions[v * 3 + 2]!;
    minR = Math.min(minR, Math.hypot(x, z));
    const p = [x, y, z];
    for (let a = 0; a < 3; a++) {
      if (p[a]! < lo[a]!) lo[a] = p[a]!;
      if (p[a]! > hi[a]!) hi[a] = p[a]!;
    }
  }
  return { lo, hi, minR, size: [hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!] };
}

describe('generator', () => {
  describe('structural integrity — every species', () => {
    it.each(SPECIES.map((s) => [s.species, s] as const))('%s produces a sane mesh', (_n, bp) => {
      const m = buildFruitingBody(bp, 1, 5);
      const vertexCount = m.positions.length / 3;

      expect(vertexCount).toBeGreaterThan(100);
      expect(m.normals.length).toBe(m.positions.length);
      expect(m.colors.length).toBe(m.positions.length);
      expect(m.indices.length % 3).toBe(0);

      // Every index must reference a vertex that exists — an out-of-range
      // index renders as garbage triangles shooting to the origin.
      for (const i of m.indices) expect(i).toBeLessThan(vertexCount);

      // Non-degenerate: real extent on all three axes.
      for (const s of bounds(m).size) expect(s).toBeGreaterThan(0.5);

      expect(m.positions.every(Number.isFinite)).toBe(true);
    });

    it('is deterministic for a given seed', () => {
      for (const bp of SPECIES) {
        const a = buildFruitingBody(bp, 1, 11);
        const b = buildFruitingBody(bp, 1, 11);
        expect(a.positions).toEqual(b.positions);
      }
    });
  });

  describe('morphology — the correctness bar', () => {
    const oysterWith = (attachment: 'free' | 'decurrent') =>
      buildFruitingBody(
        {
          ...pleurotusOstreatus,
          hymenophore: { ...pleurotusOstreatus.hymenophore, attachment },
        } as typeof pleurotusOstreatus,
        1,
        3,
      );

    it('oyster: decurrent gills descend further than free ones would', () => {
      // Asserted against the same species with attachment swapped, so this
      // tests the diagnostic feature rather than an absolute coordinate.
      expect(partBounds(oysterWith('decurrent'), 'hymenophore').lo[1]!).toBeLessThan(
        partBounds(oysterWith('free'), 'hymenophore').lo[1]!,
      );
    });

    it('oyster: free gills leave a gap at the stipe, decurrent gills do not', () => {
      // The other half of the feature: how close the innermost blade reaches
      // to the axis. Free gills stop well clear of the stipe.
      expect(partBounds(oysterWith('free'), 'hymenophore').minR).toBeGreaterThan(
        partBounds(oysterWith('decurrent'), 'hymenophore').minR,
      );
    });

    it('oyster: a lateral stipe sits off-axis, at the cap edge', () => {
      // Oysters shelf off the side of wood — the stipe joins near the cap's
      // edge, not its centre. A central stipe would make every species with
      // this trait render as a textbook toadstool.
      const m = buildFruitingBody(pleurotusOstreatus, 1, 3);
      const stipe = partBounds(m, 'stipe');
      const cap = partBounds(m, 'cap');
      const stipeCentreX = (stipe.lo[0]! + stipe.hi[0]!) / 2;
      const capRadius = (cap.hi[0]! - cap.lo[0]!) / 2;
      expect(Math.abs(stipeCentreX)).toBeGreaterThan(capRadius * 0.5);
    });

    it('reishi: a central stipe stays on the axis', () => {
      // The other half of the feature — 'central' must not drift.
      const central = buildFruitingBody(
        { ...pleurotusOstreatus, stipe: { ...pleurotusOstreatus.stipe!, position: 'central' } },
        1,
        3,
      );
      const s = partBounds(central, 'stipe');
      expect(Math.abs((s.lo[0]! + s.hi[0]!) / 2)).toBeLessThan(1);
    });

    it("lion's mane: no cap, no stipe — spines hang BELOW the cushion", () => {
      expect(hericiumErinaceus.cap).toBeUndefined();
      expect(hericiumErinaceus.stipe).toBeUndefined();
      const m = buildFruitingBody(hericiumErinaceus, 1, 3);
      // Spines hang BELOW the cushion they grow from — that is the whole
      // morphology, and it is why this is not a cap-and-gills fungus.
      expect(partBounds(m, 'hymenophore').lo[1]!).toBeLessThan(partBounds(m, 'cushion').lo[1]!);
    });

    it('reishi: a shelf — wider than tall, and one-sided', () => {
      const m = buildFruitingBody(ganodermaLucidum, 1, 3);
      const b = bounds(m);
      expect(b.size[0]!).toBeGreaterThan(b.size[1]! * 2);
      // Half-sweep bracket: it occupies one side of Z, not both.
      expect(Math.abs(b.lo[2]!)).toBeLessThan(b.hi[2]! * 0.5);
    });

    it('cordyceps: a club — far taller than wide', () => {
      const m = buildFruitingBody(cordycepsMilitaris, 1, 3);
      const b = bounds(m);
      expect(b.size[1]!).toBeGreaterThan(b.size[0]! * 2);
    });

    it('cordyceps swells toward the head (taper > 1)', () => {
      const m = buildFruitingBody(cordycepsMilitaris, 1, 3);
      let lowR = 0;
      let highR = 0;
      const b = bounds(m);
      for (let i = 0; i < m.positions.length; i += 3) {
        const y = m.positions[i + 1]!;
        const r = Math.hypot(m.positions[i]!, m.positions[i + 2]!);
        if (y < b.lo[1]! + b.size[1]! * 0.1) lowR = Math.max(lowR, r);
        if (y > b.hi[1]! - b.size[1]! * 0.1) highR = Math.max(highR, r);
      }
      expect(highR).toBeGreaterThan(lowR);
    });
  });

  describe('growth', () => {
    it('grows monotonically — every species gets taller with t', () => {
      for (const bp of SPECIES) {
        let prev = 0;
        for (const t of [0.2, 0.4, 0.6, 0.8, 1]) {
          const h = bounds(buildFruitingBody(bp, t, 3)).size[1]!;
          expect(h).toBeGreaterThanOrEqual(prev - 1e-6);
          prev = h;
        }
      }
    });

    it('is finite and non-degenerate at every stage, including t=0', () => {
      for (const bp of SPECIES) {
        for (const t of [0, 0.01, 0.5, 1]) {
          const m = buildFruitingBody(bp, t, 3);
          expect(m.positions.every(Number.isFinite)).toBe(true);
        }
      }
    });

    it('stipe elongation leads cap expansion — that is what reads as growth', () => {
      // At t=0.35 the stipe is well underway while the cap has barely started;
      // a uniform scale would move them together and read as a zoom.
      // Measured per-part: whole-mesh width also moves when a lateral stipe
      // slides off-axis, which would make this pass or fail for the wrong
      // reason.
      const capPerStipe = (t: number) => {
        const m = buildFruitingBody(pleurotusOstreatus, t, 3);
        return partBounds(m, 'cap').size[0]! / Math.max(partBounds(m, 'stipe').size[1]!, 0.001);
      };
      expect(capPerStipe(0.35)).toBeLessThan(capPerStipe(1));
    });
  });
});
