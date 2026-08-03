import type { Blueprint } from '../types';

/**
 * Scarlet caterpillar club. The fruiting body is a single club — effectively
 * all stipe, with a swollen fertile head and no cap. It grows out of a buried
 * insect host, which is why it stands alone rather than in a cluster.
 *
 * Modelled as a stipe with a smooth hymenophore: the fertile surface is the
 * club's own skin, dotted with embedded perithecia, not a separate structure.
 *
 * Measurements from Phillips, *Mushrooms of Britain and Europe*.
 */
export const cordycepsMilitaris: Blueprint = {
  species: 'Cordyceps militaris',
  common: 'scarlet caterpillar club',
  bodyPlan: 'clavarioid',
  stipe: {
    lengthMm: [20, 80],
    diameterMm: [3, 8],
    // Wider at the top than the base — the fertile head swells.
    taper: 1.6,
    base: 'rooting',
    position: 'central',
    ring: false,
    volva: false,
    colour: '#f97316',
  },
  hymenophore: {
    kind: 'smooth',
    colour: '#ea580c',
  },
  sporePrint: 'white',
};
