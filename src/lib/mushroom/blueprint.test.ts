import { describe, expect, it } from 'vitest';
import { sampleSpecimen, validateBlueprint } from './blueprint';
import { SPECIES, cordycepsMilitaris, hericiumErinaceus } from './species';
import type { Blueprint } from './types';

describe('blueprint', () => {
  describe('the shipped species', () => {
    it.each(SPECIES.map((s) => [s.species, s] as const))('%s validates', (_name, bp) => {
      expect(() => { validateBlueprint(bp); }).not.toThrow();
    });

    it('covers all four body plans — the set exists to prove the schema', () => {
      expect(new Set(SPECIES.map((s) => s.bodyPlan))).toEqual(
        new Set(['agaricoid', 'hydnoid', 'polyporoid', 'clavarioid']),
      );
    });
  });

  describe('body-plan consistency', () => {
    it('rejects a hymenophore the body plan cannot bear', () => {
      const wrong = {
        ...cordycepsMilitaris,
        hymenophore: { kind: 'gills', attachment: 'free', count: 20, lamellulae: 0, spacing: 'close', colour: '#fff' },
      } as unknown as Blueprint;
      expect(() => { validateBlueprint(wrong); }).toThrow(/bears smooth, not gills/);
    });

    it('rejects a hydnoid with a cap — lion\'s mane has no cap at all', () => {
      const wrong = {
        ...hericiumErinaceus,
        cap: { profile: 'convex', diameterMm: [10, 20], heightRatio: 0.5, margin: 'entire', colour: '#fff' },
      } as unknown as Blueprint;
      expect(() => { validateBlueprint(wrong); }).toThrow(/neither cap nor stipe/);
    });

    it('rejects a missing required part', () => {
      const { stipe: _dropped, ...noStipe } = cordycepsMilitaris;
      expect(() => { validateBlueprint(noStipe); }).toThrow(/needs a stipe/);
    });

    it('rejects a cushion on a non-hydnoid', () => {
      const wrong = {
        ...cordycepsMilitaris,
        cushion: { diameterMm: [10, 20], lobes: 2, colour: '#fff' },
      } as unknown as Blueprint;
      expect(() => { validateBlueprint(wrong); }).toThrow(/only a hydnoid/);
    });
  });

  describe('numeric validation', () => {
    it('rejects an inverted range', () => {
      const wrong = {
        ...cordycepsMilitaris,
        stipe: { ...cordycepsMilitaris.stipe, lengthMm: [80, 20] },
      } as unknown as Blueprint;
      expect(() => { validateBlueprint(wrong); }).toThrow(/min must be <= max/);
    });

    it('rejects a non-finite dimension', () => {
      const wrong = {
        ...cordycepsMilitaris,
        stipe: { ...cordycepsMilitaris.stipe, taper: Number.NaN },
      } as unknown as Blueprint;
      expect(() => { validateBlueprint(wrong); }).toThrow(/positive finite/);
    });
  });

  describe('sampling', () => {
    it('is deterministic for a given seed', () => {
      for (const bp of SPECIES) {
        expect(sampleSpecimen(bp, 42)).toEqual(sampleSpecimen(bp, 42));
      }
    });

    it('varies with the seed, so a stand is not identical clones', () => {
      const a = sampleSpecimen(SPECIES[0]!, 1);
      const b = sampleSpecimen(SPECIES[0]!, 2);
      expect(a).not.toEqual(b);
    });

    it('stays inside the published ranges', () => {
      for (const bp of SPECIES) {
        for (let seed = 0; seed < 50; seed++) {
          const s = sampleSpecimen(bp, seed);
          if (bp.cap) {
            expect(s.capDiameter).toBeGreaterThanOrEqual(bp.cap.diameterMm[0]);
            expect(s.capDiameter).toBeLessThanOrEqual(bp.cap.diameterMm[1]);
          }
          if (bp.stipe) {
            expect(s.stipeLength).toBeGreaterThanOrEqual(bp.stipe.lengthMm[0]);
            expect(s.stipeLength).toBeLessThanOrEqual(bp.stipe.lengthMm[1]);
          }
        }
      }
    });

    it('derives cap height from the sampled diameter, not independently', () => {
      const bp = SPECIES.find((s) => s.cap)!;
      const s = sampleSpecimen(bp, 7);
      expect(s.capHeight).toBeCloseTo(s.capDiameter * bp.cap!.heightRatio, 6);
    });

    it('zeroes parts a body plan does not have', () => {
      const s = sampleSpecimen(hericiumErinaceus, 3);
      expect(s.capDiameter).toBe(0);
      expect(s.stipeLength).toBe(0);
      expect(s.cushionDiameter).toBeGreaterThan(0);
    });
  });
});
