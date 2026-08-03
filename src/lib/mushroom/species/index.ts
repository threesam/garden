import type { Blueprint } from '../types';
import { cordycepsMilitaris } from './cordyceps-militaris';
import { ganodermaLucidum } from './ganoderma-lucidum';
import { hericiumErinaceus } from './hericium-erinaceus';
import { pleurotusOstreatus } from './pleurotus-ostreatus';

export { cordycepsMilitaris, ganodermaLucidum, hericiumErinaceus, pleurotusOstreatus };

/** Every species, in picker order. One per body plan — the set proves the schema. */
export const SPECIES: readonly Blueprint[] = [
  pleurotusOstreatus, // agaricoid
  hericiumErinaceus, // hydnoid
  ganodermaLucidum, // polyporoid
  cordycepsMilitaris, // clavarioid
];
