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
    heightRatio: 0.13,
    thicknessRatio: 0.06,
    // Not a full disc: the fan opens away from its attachment.
    fanDeg: 238,
    waviness: 1,
    colour: '#8d8d83',
    // The rim catches the light warmer and paler than the rest of the cap.
    marginColour: '#d0b984',
  },
  stipe: {
    lengthMm: [3, 8],
    diameterMm: [13, 22],
    colour: '#efe9dc',
  },
  gills: {
    count: 150,
    depthRatio: 0.078,
    colour: '#f5f0e6',
  },
  cluster: {
    caps: [7, 9],
    spreadDeg: 190,
    // 0.48, not lower: at 0.28 the tiers interpenetrate and the whole flush
    // renders as one dough-like mass. Verified by screenshot, twice.
    tierRise: 0.4,
  },
  sporePrint: 'lilac-grey',
};
