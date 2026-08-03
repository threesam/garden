import type { Blueprint } from '../types';

/**
 * Oyster mushroom. The only agaric in the set — cap, gills, stipe — but an
 * atypical one: the gills run decurrent down a stipe set off to one side,
 * which is why it grows in shelved tiers off wood rather than standing in soil.
 *
 * Measurements from Phillips, *Mushrooms of Britain and Europe*.
 */
export const pleurotusOstreatus: Blueprint = {
  species: 'Pleurotus ostreatus',
  common: 'oyster mushroom',
  bodyPlan: 'agaricoid',
  cap: {
    profile: 'infundibuliform',
    diameterMm: [50, 200],
    heightRatio: 0.22,
    margin: 'inrolled',
    colour: '#8d8378',
  },
  stipe: {
    lengthMm: [10, 30],
    diameterMm: [10, 20],
    taper: 1.0,
    base: 'equal',
    position: 'lateral',
    ring: false,
    volva: false,
    colour: '#efe9dc',
  },
  hymenophore: {
    kind: 'gills',
    attachment: 'decurrent',
    count: 60,
    lamellulae: 1,
    spacing: 'close',
    colour: '#efe9dc',
  },
  sporePrint: 'lilac-grey',
};
