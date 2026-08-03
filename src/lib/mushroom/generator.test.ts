import { describe, expect, it } from 'vitest';
import { buildFruitingBody } from './generator';
import { sampleSpecimen, validateBlueprint } from './blueprint';
import { pleurotusOstreatus } from './species';
import type { Blueprint, Mesh } from './types';

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

/** Combined extent of every run belonging to one part. */
function partBounds(m: Mesh, part: 'cap' | 'stipe' | 'gills') {
  const runs = m.parts[part];
  if (!runs?.length) throw new Error(`mesh has no ${part}`);
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const [from, to] of runs) {
    for (let v = from; v < to; v++) {
      for (let a = 0; a < 3; a++) {
        const p = m.positions[v * 3 + a]!;
        if (p < lo[a]!) lo[a] = p;
        if (p > hi[a]!) hi[a] = p;
      }
    }
  }
  return { lo, hi, runs };
}

describe('blueprint', () => {
  it('validates the shipped species', () => {
    expect(() => { validateBlueprint(pleurotusOstreatus); }).not.toThrow();
  });

  it('rejects a fan arc wider than a full sweep', () => {
    const wrong = { ...pleurotusOstreatus, cap: { ...pleurotusOstreatus.cap, fanDeg: 400 } };
    expect(() => { validateBlueprint(wrong); }).toThrow(/exceeds a full sweep/);
  });

  it('rejects an inverted range', () => {
    const wrong = { ...pleurotusOstreatus, cap: { ...pleurotusOstreatus.cap, diameterMm: [140, 60] } };
    expect(() => { validateBlueprint(wrong as unknown as Blueprint); }).toThrow(/min must be <= max/);
  });

  it('samples inside the published ranges, for every seed', () => {
    for (let seed = 0; seed < 60; seed++) {
      const s = sampleSpecimen(pleurotusOstreatus, seed);
      expect(s.capDiameter).toBeGreaterThanOrEqual(pleurotusOstreatus.cap.diameterMm[0]);
      expect(s.capDiameter).toBeLessThanOrEqual(pleurotusOstreatus.cap.diameterMm[1]);
      expect(s.capCount).toBeGreaterThanOrEqual(pleurotusOstreatus.cluster.caps[0]);
      expect(s.capCount).toBeLessThanOrEqual(pleurotusOstreatus.cluster.caps[1]);
    }
  });
});

describe('generator', () => {
  it('produces a sane mesh', () => {
    const m = buildFruitingBody(pleurotusOstreatus, 1, 14);
    const vertexCount = m.positions.length / 3;

    expect(vertexCount).toBeGreaterThan(1000);
    expect(m.colors.length).toBe(m.positions.length);
    expect(m.indices.length % 3).toBe(0);
    // An out-of-range index renders as garbage triangles shooting to the origin.
    for (const i of m.indices) expect(i).toBeLessThan(vertexCount);
    expect(m.positions.every(Number.isFinite)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    expect(buildFruitingBody(pleurotusOstreatus, 1, 11).positions).toEqual(
      buildFruitingBody(pleurotusOstreatus, 1, 11).positions,
    );
  });

  it('varies with the seed, so a flush is not identical clones', () => {
    expect(buildFruitingBody(pleurotusOstreatus, 1, 1).positions).not.toEqual(
      buildFruitingBody(pleurotusOstreatus, 1, 2).positions,
    );
  });

  describe('cluster', () => {
    it('records one run per cap per part, not one merged span', () => {
      // Regression: collapsing each part to a single [start, end] made every
      // part cover nearly the whole mesh and overlap all the others, because
      // caps, gills and stipes are emitted interleaved, one cap at a time.
      const m = buildFruitingBody(pleurotusOstreatus, 1, 14);
      const caps = sampleSpecimen(pleurotusOstreatus, 14).capCount;
      expect(m.parts.cap).toHaveLength(caps);
      expect(m.parts.gills).toHaveLength(caps);

      const capRuns = m.parts.cap!;
      for (let i = 1; i < capRuns.length; i++) {
        expect(capRuns[i]![0]).toBeGreaterThanOrEqual(capRuns[i - 1]![1]);
      }
    });

    it('is wider than it is tall — a shelf, not a tower', () => {
      const b = bounds(buildFruitingBody(pleurotusOstreatus, 1, 14));
      expect(Math.max(b.size[0]!, b.size[2]!)).toBeGreaterThan(b.size[1]!);
    });

    it('stacks caps at distinct heights, so tiers can be told apart', () => {
      // Shingling is the whole reason the cluster reads as an oyster. If every
      // cap sat at one height they would interpenetrate into a single mass —
      // which is exactly what it looked like before the tiers were staggered.
      const m = buildFruitingBody(pleurotusOstreatus, 1, 14);
      const mids = m.parts.cap!.map(([from, to]) => {
        let lo = Infinity;
        let hi = -Infinity;
        for (let v = from; v < to; v++) {
          const y = m.positions[v * 3 + 1]!;
          if (y < lo) lo = y;
          if (y > hi) hi = y;
        }
        return (lo + hi) / 2;
      });
      const spread = Math.max(...mids) - Math.min(...mids);
      expect(spread).toBeGreaterThan(bounds(m).size[1]! * 0.3);
    });
  });

  describe('morphology', () => {
    it('hangs the gills BELOW the cap they grow from', () => {
      const m = buildFruitingBody(pleurotusOstreatus, 1, 14);
      expect(partBounds(m, 'gills').lo[1]!).toBeLessThan(partBounds(m, 'cap').hi[1]!);
    });

    it('fans the cap short of a full disc', () => {
      // A 360° sweep would be a toadstool cap with a stem stuck on its edge.
      expect(pleurotusOstreatus.cap.fanDeg).toBeLessThan(360);
    });

    it('grows from a pinhead to a flush', () => {
      const pin = bounds(buildFruitingBody(pleurotusOstreatus, 0.12, 14));
      const mature = bounds(buildFruitingBody(pleurotusOstreatus, 1, 14));
      expect(pin.size[0]!).toBeLessThan(mature.size[0]!);
      expect(buildFruitingBody(pleurotusOstreatus, 0.12, 14).positions.every(Number.isFinite)).toBe(true);
    });
  });
});
