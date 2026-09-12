export interface NavRoute {
  href: string;
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
