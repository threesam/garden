// A species as data. Every field is something a field guide already publishes,
// so adding a species is transcription rather than invention.
//
// Body plan comes first, because fungi do not share one. An agaric has a cap,
// gills and a stipe; a toothed fungus has none of those. Modelling everything
// as cap-and-gills would produce specimens a mycologist would immediately
// reject, which defeats the whole correctness bar.
//
// See docs/superpowers/specs/2026-08-02-mushroom-generator-design.md

/** The four gross morphologies this generator builds. */
export type BodyPlan =
  | 'agaricoid' // cap + gills + stipe — the mushroom shape people picture
  | 'polyporoid' // bracket/shelf with pores beneath
  | 'hydnoid' // cushion hung with downward spines, no cap
  | 'clavarioid'; // a club; the fruiting body is essentially all stipe

/** Cap outline in profile, using the standard mycological descriptors. */
export type CapProfile =
  | 'convex' // dome; widest at the margin
  | 'campanulate' // bell; widest below a raised apex
  | 'plane' // flat
  | 'infundibuliform' // funnel; centre lower than the margin
  | 'umbonate' // convex with a central boss
  | 'bracket'; // kidney/fan shelf, attached at one edge

/** Where the gills meet the stipe — the most diagnostic feature of an agaric. */
export type GillAttachment = 'free' | 'adnexed' | 'adnate' | 'decurrent';

export type CapMargin = 'entire' | 'striate' | 'inrolled';
export type GillSpacing = 'crowded' | 'close' | 'distant';
export type StipeBase = 'equal' | 'bulbous' | 'rooting';
/** Lateral/eccentric stipes are why bracket-formers look nothing like an Amanita. */
export type StipePosition = 'central' | 'eccentric' | 'lateral';

/** Inclusive [min, max] in millimetres. Real species vary; specimens sample this. */
export type RangeMm = readonly [number, number];

/**
 * The spore-bearing surface. This is the feature that actually separates the
 * body plans, so it is a discriminated union rather than a set of optional
 * fields — a species has exactly one, and the geometry builder switches on it.
 */
export type Hymenophore =
  | {
      readonly kind: 'gills';
      readonly attachment: GillAttachment;
      /** Primary lamellae reaching the cap margin. */
      readonly count: number;
      /** Tiers of shorter gills interleaved between the primaries. */
      readonly lamellulae: number;
      readonly spacing: GillSpacing;
      readonly colour: string;
    }
  | {
      readonly kind: 'pores';
      readonly poresPerMm: number;
      readonly depthMm: number;
      readonly colour: string;
    }
  | {
      readonly kind: 'teeth';
      readonly lengthMm: RangeMm;
      readonly densityPerCm2: number;
      readonly colour: string;
    }
  | {
      readonly kind: 'smooth';
      readonly colour: string;
    };

export interface Cap {
  readonly profile: CapProfile;
  readonly diameterMm: RangeMm;
  /** Cap height ÷ cap diameter. */
  readonly heightRatio: number;
  readonly margin: CapMargin;
  readonly colour: string;
}

export interface Stipe {
  readonly lengthMm: RangeMm;
  readonly diameterMm: RangeMm;
  /** Apex Ø ÷ base Ø. <1 tapers upward, >1 tapers downward. */
  readonly taper: number;
  readonly base: StipeBase;
  readonly position: StipePosition;
  readonly ring: boolean;
  readonly volva: boolean;
  readonly colour: string;
}

/** The branching mass a hydnoid fungus hangs its spines from. */
export interface Cushion {
  readonly diameterMm: RangeMm;
  /** Number of lobes the mass divides into. */
  readonly lobes: number;
  readonly colour: string;
}

export interface Blueprint {
  readonly species: string;
  readonly common: string;
  readonly bodyPlan: BodyPlan;
  /** Absent for hydnoid and clavarioid — those have no cap at all. */
  readonly cap?: Cap;
  /** Absent for hydnoid. For clavarioid this IS the fruiting body. */
  readonly stipe?: Stipe;
  /** Present only for hydnoid. */
  readonly cushion?: Cushion;
  readonly hymenophore: Hymenophore;
  readonly ornament?: {
    readonly warts?: { readonly count: number; readonly radiusMm: number };
  };
  readonly sporePrint: string;
}

/** Concrete dimensions for one specimen, sampled from a blueprint's ranges. */
export interface Specimen {
  readonly capDiameter: number;
  readonly capHeight: number;
  readonly stipeLength: number;
  readonly stipeDiameter: number;
  readonly cushionDiameter: number;
}

/** Which structure a run of vertices belongs to. */
export type PartName = 'cap' | 'stipe' | 'hymenophore' | 'cushion';

/** Half-open vertex range [start, end) for one part. */
export type PartRange = readonly [number, number];

/** Plain arrays, ready for a BufferGeometry. The generator knows nothing about three.js. */
export interface Mesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
  /** Per-vertex colour, so cap/hymenophore/stipe can differ within one mesh. */
  readonly colors: Float32Array;
  /**
   * Vertex ranges per structure. Lets a viewer give the pore surface a
   * different material to the cap, and lets the tests assert on the gills
   * alone rather than inferring from a bounding box that the stipe dominates.
   */
  readonly parts: Partial<Record<PartName, PartRange>>;
}
