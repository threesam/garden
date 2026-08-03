import type { Blueprint } from '../types';

/**
 * Oyster mushroom. Shelves in overlapping tiers off dead hardwood, each cap a
 * fan attached at one edge by a stub of a stipe, gills running down onto it.
 *
 * Measurements from Phillips, *Mushrooms of Britain and Europe*. The
 * appearance fields (waviness, fan arc, margin colour) are read off
 * photographs rather than published — a field guide describes a margin as
 * "wavy" and leaves the amount to the eye.
 */
export const pleurotusOstreatus: Blueprint = {
  species: 'Pleurotus ostreatus',
  common: 'oyster mushroom',
  cap: {
    diameterMm: [60, 140],
    heightRatio: 0.14,
    thicknessRatio: 0.055,
    // Not a full disc: the fan opens away from its attachment.
    fanDeg: 250,
    waviness: 0.85,
    colour: '#9d968a',
    // The rim catches the light warmer and paler than the rest of the cap.
    marginColour: '#cbb083',
  },
  stipe: {
    lengthMm: [8, 16],
    diameterMm: [9, 15],
    colour: '#efe9dc',
  },
  gills: {
    count: 96,
    depthRatio: 0.062,
    colour: '#f2ece0',
  },
  cluster: {
    caps: [6, 9],
    spreadDeg: 190,
    tierRise: 0.48,
  },
  sporePrint: 'lilac-grey',
};
