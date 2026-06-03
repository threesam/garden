// The deana photos drive two ASCII render paths:
//  - DEANA_PHOTOS (raw webp): the /deana page renders these to ASCII on a <canvas>
//    at runtime (AsciiImage) so its full-bleed sections stay crisp at any size/DPR.
//  - DEANA_ASCII (pre-baked, see scripts/generate-deana-ascii.mjs): the homepage
//    gallery card shows these static prints instead of running the ~960ms ASCII
//    conversion on the homepage's critical path. sm = card, lg = retina, via srcset.
const ASCII_BASES = [
	"deana-6",
	"deana-5",
	"deana-hero-3",
	"deana-hero",
	"deana-hero-5",
	"deana-hero-6",
];

export interface AsciiSrc {
	sm: string;
	lg: string;
}

export const DEANA_PHOTOS: string[] = ASCII_BASES.map((base) => `/assets/${base}.webp`);

// ?v=N busts Vercel's immutable 1-year cache on /assets/ when we re-bake the
// prints. Bump every time scripts/generate-deana-ascii.mjs changes the look
// (CELL, ramp, lumToTone) so browsers fetch the new bake instead of serving
// the stale cached webp from the same URL.
const DEANA_V = 5;

export const DEANA_ASCII: AsciiSrc[] = ASCII_BASES.map((base) => ({
	sm: `/assets/deana-ascii/${base}-sm.webp?v=${DEANA_V}`,
	lg: `/assets/deana-ascii/${base}-lg.webp?v=${DEANA_V}`,
}));

// Widths match SM_W / LG_W in scripts/generate-deana-ascii.mjs.
export const asciiSrcset = (s: AsciiSrc): string => `${s.sm} 380w, ${s.lg} 900w`;
