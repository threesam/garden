import type { Blueprint } from '../types';

/**
 * Lion's mane. No cap, no stipe, no gills — an unbranched cushion attached to
 * wood, hung with long downward-pointing spines. The spines ARE the fertile
 * surface, which is why the schema needs a hymenophore variant rather than a
 * gill count.
 *
 * Measurements from Phillips, *Mushrooms of Britain and Europe*.
 */
export const hericiumErinaceus: Blueprint = {
  species: 'Hericium erinaceus',
  common: "lion's mane",
  bodyPlan: 'hydnoid',
  cushion: {
    diameterMm: [80, 250],
    lobes: 5,
    colour: '#f6f0e2',
  },
  hymenophore: {
    kind: 'teeth',
    // Spines are long — up to 5cm — and hang under gravity, not radially.
    lengthMm: [20, 50],
    densityPerCm2: 9,
    colour: '#f6f0e2',
  },
  sporePrint: 'white',
};
