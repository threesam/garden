// Blueprint validation + specimen sampling.
//
// Validation throws rather than clamps: a malformed blueprint is an author
// error to fix at the point it is written, and a silently clamped one produces
// a specimen that is wrong in a way nobody notices.

import { mulberry32 } from '$lib/art/rng';
import type { Blueprint, RangeMm, Specimen } from './types';

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
    throw new Error(`${label}: expected positive finite, got ${value}`);
  }
}

export function validateBlueprint(bp: Blueprint): void {
  assertRange(bp.cap.diameterMm, `${bp.species} cap.diameterMm`);
  assertRange(bp.stipe.lengthMm, `${bp.species} stipe.lengthMm`);
  assertRange(bp.stipe.diameterMm, `${bp.species} stipe.diameterMm`);

  assertPositive(bp.cap.heightRatio, `${bp.species} cap.heightRatio`);
  assertPositive(bp.cap.thicknessRatio, `${bp.species} cap.thicknessRatio`);
  assertPositive(bp.cap.fanDeg, `${bp.species} cap.fanDeg`);
  assertPositive(bp.gills.count, `${bp.species} gills.count`);
  assertPositive(bp.gills.depthRatio, `${bp.species} gills.depthRatio`);

  if (bp.cap.fanDeg > 360) {
    throw new Error(`${bp.species} cap.fanDeg: ${bp.cap.fanDeg} exceeds a full sweep`);
  }
  if (bp.cap.waviness < 0 || bp.cap.waviness > 1) {
    throw new Error(`${bp.species} cap.waviness: must be 0..1, got ${bp.cap.waviness}`);
  }

  const [lo, hi] = bp.cluster.caps;
  if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || lo > hi) {
    throw new Error(`${bp.species} cluster.caps: whole numbers, min >= 1, got [${lo}, ${hi}]`);
  }
}

const sample = (rand: () => number, [min, max]: RangeMm): number => min + rand() * (max - min);

/** Same seed, same specimen. */
export function sampleSpecimen(bp: Blueprint, seed: number): Specimen {
  const rand = mulberry32(seed);
  const [capLo, capHi] = bp.cluster.caps;
  return {
    capDiameter: sample(rand, bp.cap.diameterMm),
    stipeLength: sample(rand, bp.stipe.lengthMm),
    stipeDiameter: sample(rand, bp.stipe.diameterMm),
    capCount: Math.round(capLo + rand() * (capHi - capLo)),
  };
}
