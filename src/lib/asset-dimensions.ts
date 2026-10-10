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
  "/assets/mouth-machine/drops-on-the-one.webp": { w: 1400, h: 875 },
  "/assets/mouth-machine/drums-octave-down.webp": { w: 1600, h: 900 },
  "/assets/mouth-machine/guitar-only-first-video.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/guitar-only-second-video.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/layer-2-down-13.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/layer-2-softer.webp": { w: 1320, h: 715 },
  "/assets/mouth-machine/memo-first-look.webp": { w: 1600, h: 391 },
  "/assets/mouth-machine/piece-1-twelve-bars.webp": { w: 1600, h: 237 },
  "/assets/mouth-machine/piece-11-light-ground-drops.webp": { w: 1600, h: 284 },
  "/assets/mouth-machine/piece-11-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-12-smooth-rings.webp": { w: 1600, h: 285 },
  "/assets/mouth-machine/piece-12-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-13-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-14-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-15-third-video-both-grounds.webp": { w: 1600, h: 465 },
  "/assets/mouth-machine/piece-15-timeline-olive.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-15-timeline-seafoam.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-15-timeline-squeezed.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-16-guitar-up.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/piece-16-timeline-night-guitar-even.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-16-timeline-night-guitar-up.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-17-guitar-alone.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/piece-17-room-loop-out.webp": { w: 1600, h: 600 },
  "/assets/mouth-machine/piece-18-loop-point.webp": { w: 1600, h: 348 },
  "/assets/mouth-machine/piece-18-timeline-round.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-19-cut-not-fade.webp": { w: 1600, h: 952 },
  "/assets/mouth-machine/piece-19-timeline-round-cut.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-2-twelve-bars.webp": { w: 1600, h: 237 },
  "/assets/mouth-machine/piece-3-carry.webp": { w: 1600, h: 232 },
  "/assets/mouth-machine/piece-3-drops-to-sleep.webp": { w: 1600, h: 232 },
  "/assets/mouth-machine/piece-3-wait.webp": { w: 1600, h: 232 },
  "/assets/mouth-machine/piece-4-one-ring-one-bar.webp": { w: 1600, h: 356 },
  "/assets/mouth-machine/piece-4-second-video-plays-out.webp": { w: 1600, h: 316 },
  "/assets/mouth-machine/piece-4-timeline-four-drops.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-5-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-6-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-7-inner-four.webp": { w: 1600, h: 285 },
  "/assets/mouth-machine/piece-7-timeline-long-fade.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-7-timeline.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-8-clean-rings.webp": { w: 1600, h: 284 },
  "/assets/mouth-machine/piece-8-timeline-long-fade.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-9-timeline-ends-on-video.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/piece-9-timeline-rings-fade.webp": { w: 1600, h: 688 },
  "/assets/mouth-machine/portal-organic-drops.webp": { w: 1600, h: 136 },
  "/assets/mouth-machine/seafoam-and-olive.webp": { w: 1080, h: 1920 },
  "/assets/mouth-machine/seafoam-flip-on-go.webp": { w: 1600, h: 356 },
  "/assets/mouth-machine/seafoam-six-lines.webp": { w: 1600, h: 407 },
  "/assets/mouth-machine/take-1-beat.webp": { w: 1260, h: 364 },
  "/assets/mouth-machine/take-2-over-the-beat.webp": { w: 1260, h: 364 },
  "/assets/mouth-machine/take-3-go-to-sleep.webp": { w: 1260, h: 364 },
  "/assets/mouth-machine/take-4-guitar-in-the-dark.webp": { w: 1260, h: 364 },
  "/assets/mouth-machine/take-5-guitar-with-an-ending.webp": { w: 1260, h: 364 },
  "/assets/mouth-machine/third-video-line-fixed-and-following.webp": { w: 1600, h: 465 },
  "/assets/mouth-machine/video-4-in-the-dark.webp": { w: 540, h: 960 },
  "/assets/mouth-machine/video-5-guitar.webp": { w: 540, h: 960 },
};

/** Aspect ratio (width / height) for a known asset, or undefined if unmapped. */
export function assetAspect(src: string): number | undefined {
  const d = assetDimensions[src];
  return d ? d.w / d.h : undefined;
}
