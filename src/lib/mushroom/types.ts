// A species as data.
//
// Deliberately narrow. An earlier version of this file carried four body
// plans, a discriminated hymenophore union and optional cap/stipe/cushion —
// a schema guessed before anything had been rendered, and the guess produced
// specimens that were structurally defensible and visually wrong.
//
// So: one species, modelled until it looks right, and the schema generalised
// afterwards from species that actually work. What survives contact with the
// second and third species is the real abstraction.

/** Inclusive [min, max] in millimetres, as a field guide publishes them. */
export type RangeMm = readonly [number, number];

/**
 * A cluster of fruiting bodies, which for a wood-rotting fungus is the unit
 * that matters. A lone oyster mushroom is the least oyster-like thing an
 * oyster does — they shelf in overlapping tiers off the same mycelium, and
 * that shingled arrangement is most of what makes one recognisable.
 */
export interface Cluster {
  /** How many caps in a mature flush. */
  readonly caps: readonly [number, number];
  /** Arc the flush spreads through, in degrees, as it grows off a face. */
  readonly spreadDeg: number;
  /** Vertical stagger between tiers, as a fraction of cap diameter. */
  readonly tierRise: number;
}

export interface Cap {
  readonly diameterMm: RangeMm;
  /** Cap height ÷ cap diameter. */
  readonly heightRatio: number;
  /** Flesh thickness at the attachment ÷ cap diameter. */
  readonly thicknessRatio: number;
  /** Arc the fan sweeps through, in degrees. 360 would be a disc. */
  readonly fanDeg: number;
  /** How far the margin waves, 0..1. Oyster flesh is soft and very wavy. */
  readonly waviness: number;
  readonly colour: string;
  /** Oysters carry a paler, warmer band right at the rim. */
  readonly marginColour: string;
}

export interface Stipe {
  readonly lengthMm: RangeMm;
  readonly diameterMm: RangeMm;
  readonly colour: string;
}

export interface Gills {
  /** Blades in a mature cap. */
  readonly count: number;
  /** Blade depth ÷ cap diameter. */
  readonly depthRatio: number;
  readonly colour: string;
}

export interface Blueprint {
  readonly species: string;
  readonly common: string;
  readonly cap: Cap;
  readonly stipe: Stipe;
  readonly gills: Gills;
  readonly cluster: Cluster;
  readonly sporePrint: string;
}

/** Concrete dimensions for one specimen, sampled from a blueprint's ranges. */
export interface Specimen {
  readonly capDiameter: number;
  readonly stipeLength: number;
  readonly stipeDiameter: number;
  readonly capCount: number;
}

/** Which structure a run of vertices belongs to. */
export type PartName = 'cap' | 'stipe' | 'gills' | 'wood' | 'bark';

/** Half-open vertex range [start, end) for one part. */
export type PartRange = readonly [number, number];

/** Plain arrays, ready for a BufferGeometry. The generator knows nothing about three.js. */
export interface Mesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
  /** Per-vertex colour, so cap/gills/margin can differ within one mesh. */
  readonly colors: Float32Array;
  /**
   * Vertex ranges per structure. Lets a viewer give the gills their own
   * material, and lets tests assert on one part rather than inferring from a
   * bounding box that a different part dominates.
   *
   * A LIST of ranges, not one range: a cluster emits cap, gills and stipe per
   * cap, so each structure's vertices land in several disjoint runs. Collapsing
   * them to a single span would make every part's range cover almost the whole
   * mesh and quietly overlap all the others.
   */
  readonly parts: Partial<Record<PartName, readonly PartRange[]>>;
}
