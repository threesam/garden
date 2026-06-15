// Intrinsic pixel dimensions of the static /assets used on content pages.
//
// One source of truth for two CLS guards that both need an image's shape
// *before* the bitmap decodes:
//   • markdown.ts stamps width/height on inline <img>s.
//   • the /self Voronoi banners reserve their box via assetAspect() so the
//     canvas fades into correctly-shaped space instead of snapping on load.
//
// Hand-maintained (these are fixed editorial assets). Regenerate with:
//   for f in static/assets/*.{webp,png}; do
//     printf '%s ' "$f"; sips -g pixelWidth -g pixelHeight "$f" | awk '/pixel/{print $2}' | paste -sd' ';
//   done

export interface Dimensions {
  w: number;
  h: number;
}

export const assetDimensions: Record<string, Dimensions> = {
  "/assets/piece-of-paper.webp": { w: 1449, h: 2576 },
  "/assets/velvet-door.webp": { w: 1137, h: 704 },
  "/assets/blondie.webp": { w: 795, h: 573 },
  "/assets/fault-lines.webp": { w: 2000, h: 999 },
  "/assets/adventure.webp": { w: 882, h: 573 },
  "/assets/dissonance.webp": { w: 560, h: 386 },
  "/assets/chip-malt-new-address.png": { w: 1142, h: 134 },
};

/** Aspect ratio (width / height) for a known asset, or undefined if unmapped. */
export function assetAspect(src: string): number | undefined {
  const d = assetDimensions[src];
  return d ? d.w / d.h : undefined;
}
