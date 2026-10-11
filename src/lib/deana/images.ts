// Pre-baked ASCII prints (see scripts/generate-deana-ascii.mjs) shared by the
// homepage gallery card and the /deana page hero. Static <img srcset>
// replaces the prior ~960ms runtime canvas conversion on the critical path.
export interface AsciiSrc {
	sm: string;
	md: string;
	lg: string;
}

// Each address is written out whole so the build can fingerprint it
// (asset-version.ts): a re-baked print is fetched again with nothing to bump.
export const DEANA_ASCII: AsciiSrc[] = [
	{
		sm: "/assets/deana-ascii/deana-6-sm.webp",
		md: "/assets/deana-ascii/deana-6-md.webp",
		lg: "/assets/deana-ascii/deana-6-lg.webp",
	},
	{
		sm: "/assets/deana-ascii/deana-5-sm.webp",
		md: "/assets/deana-ascii/deana-5-md.webp",
		lg: "/assets/deana-ascii/deana-5-lg.webp",
	},
	{
		sm: "/assets/deana-ascii/deana-hero-3-sm.webp",
		md: "/assets/deana-ascii/deana-hero-3-md.webp",
		lg: "/assets/deana-ascii/deana-hero-3-lg.webp",
	},
	{
		sm: "/assets/deana-ascii/deana-hero-sm.webp",
		md: "/assets/deana-ascii/deana-hero-md.webp",
		lg: "/assets/deana-ascii/deana-hero-lg.webp",
	},
	{
		sm: "/assets/deana-ascii/deana-hero-5-sm.webp",
		md: "/assets/deana-ascii/deana-hero-5-md.webp",
		lg: "/assets/deana-ascii/deana-hero-5-lg.webp",
	},
	{
		sm: "/assets/deana-ascii/deana-hero-6-sm.webp",
		md: "/assets/deana-ascii/deana-hero-6-md.webp",
		lg: "/assets/deana-ascii/deana-hero-6-lg.webp",
	},
];

// Widths match SM_W / MD_W / LG_W in scripts/generate-deana-ascii.mjs.
export const asciiSrcset = (s: AsciiSrc): string => `${s.sm} 320w, ${s.md} 480w, ${s.lg} 700w`;
