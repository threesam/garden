import type { RouteId } from '$app/types';

export interface NavRoute {
  // static routes only, so each href is also its route id (preloadCode takes ids)
  href: RouteId;
  label: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { href: '/',                    label: 'home' },
  { href: '/self',                 label: 'self' },
  { href: '/anything-but-analog', label: 'analog' },
  { href: '/dad',                 label: 'dad' },
  { href: '/deana',               label: 'D-ANA' },
  { href: '/benny',               label: 'benny' },
  { href: '/shelf',               label: 'shelf' },
  { href: '/sounds',              label: 'sounds' },
  { href: '/wetyu',               label: 'wetyu' },
  { href: '/thoughts',            label: 'thoughts' },
];
