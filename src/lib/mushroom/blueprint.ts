// Blueprint validation + specimen sampling.
//
// Validation throws rather than clamps: a malformed blueprint is an author
// error to fix at the point it is written, and a silently clamped one produces
// a specimen that is wrong in a way nobody notices.

import { mulberry32 } from '$lib/art/rng';
import type { Blueprint, BodyPlan, Hymenophore, RangeMm, Specimen } from './types';

/**
 * Which parts each body plan must and must not have. This is the invariant
 * that stops a species being authored as, say, a toothed fungus that also has
 * a cap — the combination does not exist and would render as nonsense.
 */
const PLAN_RULES: Record<
  BodyPlan,
  { hymenophore: Hymenophore['kind']; needs: readonly ('cap' | 'stipe' | 'cushion')[] }
> = {
  agaricoid: { hymenophore: 'gills', needs: ['cap', 'stipe'] },
  polyporoid: { hymenophore: 'pores', needs: ['cap'] },
  hydnoid: { hymenophore: 'teeth', needs: ['cushion'] },
  clavarioid: { hymenophore: 'smooth', needs: ['stipe'] },
};

function assertRange(range: RangeMm, label: string): void {
  const [min, max] = range;
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error(`${label}: range must be finite, got [${min}, ${max}]`);
  }
  if (min <= 0) throw new Error(`${label}: range must be positive, got ${min}`);
  if (min > max) throw new Error(`${label}: min must be <= max, got [${min}, ${max}]`);
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}: must be a positive finite number, got ${value}`);
  }
}

/** Throws on a malformed blueprint. Called once per species by the test suite. */
export function validateBlueprint(bp: Blueprint): void {
  const rule = PLAN_RULES[bp.bodyPlan];
  const id = bp.species;

  if (bp.hymenophore.kind !== rule.hymenophore) {
    throw new Error(
      `${id}: a ${bp.bodyPlan} fungus bears ${rule.hymenophore}, not ${bp.hymenophore.kind}`,
    );
  }
  for (const part of rule.needs) {
    if (!bp[part]) throw new Error(`${id}: a ${bp.bodyPlan} fungus needs a ${part}`);
  }
  // A hydnoid has no cap and no stipe — it is a cushion hung with spines.
  if (bp.bodyPlan === 'hydnoid' && (bp.cap || bp.stipe)) {
    throw new Error(`${id}: a hydnoid fungus has neither cap nor stipe`);
  }
  // Only a hydnoid has a cushion.
  if (bp.bodyPlan !== 'hydnoid' && bp.cushion) {
    throw new Error(`${id}: only a hydnoid fungus has a cushion`);
  }

  if (bp.cap) {
    assertRange(bp.cap.diameterMm, `${id} cap.diameterMm`);
    assertPositive(bp.cap.heightRatio, `${id} cap.heightRatio`);
  }
  if (bp.stipe) {
    assertRange(bp.stipe.lengthMm, `${id} stipe.lengthMm`);
    assertRange(bp.stipe.diameterMm, `${id} stipe.diameterMm`);
    assertPositive(bp.stipe.taper, `${id} stipe.taper`);
  }
  if (bp.cushion) {
    assertRange(bp.cushion.diameterMm, `${id} cushion.diameterMm`);
    if (!Number.isInteger(bp.cushion.lobes) || bp.cushion.lobes < 1) {
      throw new Error(`${id} cushion.lobes: must be a positive integer`);
    }
  }

  const h = bp.hymenophore;
  if (h.kind === 'gills') {
    if (!Number.isInteger(h.count) || h.count < 3) {
      throw new Error(`${id} gills.count: need at least 3 lamellae, got ${h.count}`);
    }
    if (!Number.isInteger(h.lamellulae) || h.lamellulae < 0) {
      throw new Error(`${id} gills.lamellulae: must be a non-negative integer`);
    }
  } else if (h.kind === 'pores') {
    assertPositive(h.poresPerMm, `${id} pores.poresPerMm`);
    assertPositive(h.depthMm, `${id} pores.depthMm`);
  } else if (h.kind === 'teeth') {
    assertRange(h.lengthMm, `${id} teeth.lengthMm`);
    assertPositive(h.densityPerCm2, `${id} teeth.densityPerCm2`);
  }

  if (bp.ornament?.warts) {
    assertPositive(bp.ornament.warts.radiusMm, `${id} ornament.warts.radiusMm`);
  }
}

const sample = (rand: () => number, [min, max]: RangeMm): number => min + rand() * (max - min);

/**
 * Concrete dimensions for one specimen. Same seed always yields the same
 * specimen, so a stand of fungi can vary while staying reproducible.
 *
 * Cap height derives from the sampled diameter rather than being sampled
 * independently — heightRatio is the species' proportion, and letting the two
 * vary separately would produce specimens outside the species' real shape.
 *
 * Parts a body plan does not have sample to 0, so downstream geometry can read
 * them unconditionally without optional chaining on every axis.
 */
export function sampleSpecimen(bp: Blueprint, seed: number): Specimen {
  const rand = mulberry32(seed);
  const capDiameter = bp.cap ? sample(rand, bp.cap.diameterMm) : 0;
  return {
    capDiameter,
    capHeight: bp.cap ? capDiameter * bp.cap.heightRatio : 0,
    stipeLength: bp.stipe ? sample(rand, bp.stipe.lengthMm) : 0,
    stipeDiameter: bp.stipe ? sample(rand, bp.stipe.diameterMm) : 0,
    cushionDiameter: bp.cushion ? sample(rand, bp.cushion.diameterMm) : 0,
  };
}
