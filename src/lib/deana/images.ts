// Pre-baked ASCII prints (see scripts/generate-deana-ascii.mjs) shared by the
// homepage gallery card and the /deana page hero. Static <img srcset>
// replaces the prior ~960ms runtime canvas conversion on the critical path.
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

// ?v=N busts Vercel's immutable 1-year cache on /assets/ when we re-bake the
// prints. Bump every time scripts/generate-deana-ascii.mjs changes the look
// (CELL, ramp, lumToTone) so browsers fetch the new bake instead of serving
// the stale cached webp from the same URL.
const DEANA_V = 7;

export const DEANA_ASCII: AsciiSrc[] = ASCII_BASES.map((base) => ({
	sm: `/assets/deana-ascii/${base}-sm.webp?v=${DEANA_V}`,
	lg: `/assets/deana-ascii/${base}-lg.webp?v=${DEANA_V}`,
}));

// Widths match SM_W / LG_W in scripts/generate-deana-ascii.mjs.
export const asciiSrcset = (s: AsciiSrc): string => `${s.sm} 320w, ${s.lg} 700w`;
