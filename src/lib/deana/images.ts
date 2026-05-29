// Pre-baked ASCII renders of the deana photos (see scripts/generate-deana-ascii.mjs).
// The raw source photos live in static/assets and are the build-time inputs to that
// script; at runtime the app only references these baked prints, so the homepage card
// + /deana sections don't convert pixels to ASCII in JS on load. `sm` is for the small
// homepage card, `lg` for full-width /deana sections — wired up via srcset.
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

export const DEANA_ASCII: AsciiSrc[] = ASCII_BASES.map((base) => ({
	sm: `/assets/deana-ascii/${base}-sm.webp`,
	lg: `/assets/deana-ascii/${base}-lg.webp`,
}));

// Widths match SM_W / LG_W in scripts/generate-deana-ascii.mjs.
export const asciiSrcset = (s: AsciiSrc): string => `${s.sm} 380w, ${s.lg} 900w`;
