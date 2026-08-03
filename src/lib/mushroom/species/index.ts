import type { Blueprint } from '../types';
import { pleurotusOstreatus } from './pleurotus-ostreatus';

export { pleurotusOstreatus };

/**
 * Every species. One, deliberately — the schema is being derived from a
 * species that looks right rather than guessed ahead of the first render.
 */
export const SPECIES: readonly Blueprint[] = [pleurotusOstreatus];
