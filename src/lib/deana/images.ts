// Pre-baked ASCII renders of the deana photos (see scripts/generate-deana-ascii.mjs).
// The raw photos still live in static/assets (served in dev); prod displays these
// static prints so the homepage card + /deana sections don't convert pixels to
// ASCII in JS on load. `sm` is for the small homepage card, `lg` for full-width
// /deana sections — wired up via srcset.
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
