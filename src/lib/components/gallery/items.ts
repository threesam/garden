/**
 * What the sliding gallery can carry.
 *
 * A card renders one of two ways: `handle` pulls in a live canvas sketch (the
 * homepage treatment), `img` shows a static image. Thought cards use the
 * second — their pixel art already exists and six more WebGL contexts in a
 * footer that appears on every page is not a trade worth making.
 */
export interface GalleryItem {
  label: string;
  href: string;
  handle?: CanvasHandle;
  img?: string;
}

export type CanvasHandle =
  | 'self'
  | 'deana'
  | 'shelf'
  | 'anything-but-analog'
  | 'thoughts'
  | 'sounds';

/** The six top-level sections — the homepage set. */
export const SITE_ITEMS: readonly GalleryItem[] = [
  { label: 'self', handle: 'self', href: '/self' },
  { label: 'sounds', handle: 'sounds', href: '/sounds' },
  { label: 'thoughts', handle: 'thoughts', href: '/thoughts' },
  { label: 'D-ANA', handle: 'deana', href: '/deana' },
  { label: 'shelf', handle: 'shelf', href: '/shelf' },
  { label: 'analog', handle: 'anything-but-analog', href: '/anything-but-analog' },
];

/** Bump when scripts/generate-thoughts-pixel.mjs changes. Mirrors /thoughts. */
const PIXEL_V = 3;
const pixel = (slug: string): string => `/assets/thoughts-pixel/${slug}.webp?v=${PIXEL_V}`;

/** The reading set, shown in the footer while you're inside /thoughts. */
export const THOUGHT_ITEMS: readonly GalleryItem[] = [
  { label: 'the peach', href: '/thoughts/the-peach', img: pixel('the-peach') },
  {
    label: 'certainly uncertain',
    href: '/thoughts/certainly-uncertain',
    img: pixel('certainly-uncertain'),
  },
  { label: 'self', href: '/self', img: pixel('self') },
  { label: 'benny', href: '/benny', img: pixel('benny') },
  { label: 'dad', href: '/dad', img: pixel('dad') },
];
