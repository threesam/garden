import { describe, expect, it } from 'vitest';
import { buildSubstrate } from './substrate';

const opts = { radius: 80, depth: 120, topY: -5, seed: 14 };

describe('substrate', () => {
  it('produces a sane mesh', () => {
    const m = buildSubstrate(opts);
    const vertexCount = m.positions.length / 3;

    expect(vertexCount).toBeGreaterThan(500);
    expect(m.colors.length).toBe(m.positions.length);
    expect(m.normals.length).toBe(m.positions.length);
    expect(m.indices.length % 3).toBe(0);
    for (const i of m.indices) expect(i).toBeLessThan(vertexCount);
    expect(m.positions.every(Number.isFinite)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    expect(buildSubstrate(opts).positions).toEqual(buildSubstrate(opts).positions);
  });

  it('varies with the seed', () => {
    expect(buildSubstrate(opts).positions).not.toEqual(
      buildSubstrate({ ...opts, seed: 15 }).positions,
    );
  });

  it('hangs entirely BELOW the sawn face', () => {
    // The cluster sits on topY. Any wood above it would punch through the
    // mushrooms it is supposed to be supporting.
    const m = buildSubstrate(opts);
    let highest = -Infinity;
    for (let i = 1; i < m.positions.length; i += 3) {
      highest = Math.max(highest, m.positions[i]!);
    }
    expect(highest).toBeLessThanOrEqual(opts.topY + 1e-6);
  });

  it('reaches full depth', () => {
    const m = buildSubstrate(opts);
    let lowest = Infinity;
    for (let i = 1; i < m.positions.length; i += 3) {
      lowest = Math.min(lowest, m.positions[i]!);
    }
    expect(lowest).toBeCloseTo(opts.topY - opts.depth, 5);
  });

  it('is not a perfect cylinder — a real log is not round', () => {
    const m = buildSubstrate(opts);
    const radii: number[] = [];
    for (const [from, to] of m.parts.bark ?? []) {
      for (let v = from; v < to; v++) {
        radii.push(Math.hypot(m.positions[v * 3]!, m.positions[v * 3 + 2]!));
      }
    }
    expect(radii.length).toBeGreaterThan(0);
    const spread = Math.max(...radii) - Math.min(...radii);
    expect(spread).toBeGreaterThan(opts.radius * 0.05);
  });

  it('separates bark from the sawn face', () => {
    const m = buildSubstrate(opts);
    expect(m.parts.wood).toHaveLength(1);
    expect(m.parts.bark).toHaveLength(1);
    // Disjoint runs, so a viewer could give each its own material.
    expect(m.parts.wood![0]![1]).toBeLessThanOrEqual(m.parts.bark![0]![0]);
  });
});
