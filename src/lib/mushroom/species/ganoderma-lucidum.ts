import type { Blueprint } from '../types';

/**
 * Reishi. A lacquered kidney-shaped bracket with a pore surface beneath and a
 * stipe that, when present at all, joins at the edge rather than the centre.
 * Woody rather than fleshy, so it holds its shape for years.
 *
 * Measurements from Phillips, *Mushrooms of Britain and Europe*.
 */
export const ganodermaLucidum: Blueprint = {
  species: 'Ganoderma lucidum',
  common: 'reishi',
  bodyPlan: 'polyporoid',
  cap: {
    profile: 'bracket',
    diameterMm: [50, 250],
    heightRatio: 0.12,
    margin: 'entire',
    colour: '#7c2d12',
  },
  stipe: {
    lengthMm: [30, 150],
    diameterMm: [10, 30],
    taper: 1.0,
    base: 'equal',
    position: 'lateral',
    ring: false,
    volva: false,
    colour: '#5b2410',
  },
  hymenophore: {
    // Pores, not gills — tiny tubes packed across the underside.
    kind: 'pores',
    poresPerMm: 4,
    depthMm: 8,
    colour: '#e8dcc8',
  },
  sporePrint: 'brown',
};
