import type { Sketch } from './types';

// Lazily import a single sketch by slug. `import.meta.glob` (lazy form) makes
// Vite code-split every sketch into its own chunk and emit only dynamic
// imports here — so this module pulls in *no* sketch code itself. Consumers
// that render one or two sketches (the homepage gallery, /thoughts, /sounds)
// no longer bundle the whole 31-sketch registry; they fetch just the chunk
// they need. Slugs map 1:1 to their file (slug "30" -> sketches/day30.ts,
// which exports `day30`).
const loaders = import.meta.glob<Record<string, Sketch>>('./sketches/day*.ts');

export async function loadSketch(slug: string): Promise<Sketch | null> {
  const loader = loaders[`./sketches/day${slug}.ts`];
  if (!loader) return null;
  const mod = await loader();
  return mod[`day${slug}`] ?? null;
}
