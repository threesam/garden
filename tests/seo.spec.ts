import { test, expect } from '@playwright/test';

test.describe('llms.txt + robots.txt + sitemap.xml', () => {
  test('llms.txt lists every SITE_PAGES route and references citation guidance', async ({ request }) => {
    const r = await request.get('/llms.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    // Required sections.
    expect(body).toMatch(/^# threesam/);
    expect(body).toContain('## Pages');
    expect(body).toContain('## About');
    expect(body).toContain('## Citation');
    expect(body).toContain('## Machine-readable indexes');
    // Spot-check that pages list contains the routes we expect.
    expect(body).toContain('/self');
    expect(body).toContain('/sounds');
    expect(body).toContain('/anything-but-analog');
  });

  test('robots.txt explicitly welcomes major AI agents and points at the sitemap', async ({ request }) => {
    const r = await request.get('/robots.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    // Wildcard still present.
    expect(body).toMatch(/User-agent: \*/);
    expect(body).toMatch(/Allow: \//);
    // Sitemap pointer.
    expect(body).toContain('Sitemap: ');
    // The major AI/answer engines must be listed by name — wildcard
    // alone is insufficient for some bots.
    for (const ua of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']) {
      expect(body).toContain(`User-agent: ${ua}`);
    }
  });

  test('sitemap.xml is well-formed XML with /sounds, /shelf, /thoughts URLs', async ({ request }) => {
    const r = await request.get('/sitemap.xml');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/<urlset[^>]+xmlns/);
    expect(body).toContain('/sounds');
    expect(body).toContain('/shelf');
    expect(body).toContain('/thoughts');
  });
});

test.describe('per-page schema graph', () => {
  // Each route emits a JSON-LD <script>; verify the graph contains the
  // shared Person + WebSite + a page-specific node + breadcrumb where
  // applicable.
  const cases: { path: string; pageType: string; expectBreadcrumb: boolean }[] = [
    { path: '/shelf', pageType: 'CollectionPage', expectBreadcrumb: true },
    { path: '/sounds', pageType: 'CollectionPage', expectBreadcrumb: true },
    { path: '/thoughts', pageType: 'Blog', expectBreadcrumb: true },
    { path: '/self', pageType: 'ProfilePage', expectBreadcrumb: true },
    { path: '/anything-but-analog', pageType: 'CollectionPage', expectBreadcrumb: true },
    // Homepage is the single-hop root — no breadcrumb is correct.
    { path: '/', pageType: undefined as unknown as string, expectBreadcrumb: false },
  ];

  for (const c of cases) {
    test(`${c.path} JSON-LD graph${c.expectBreadcrumb ? ' includes BreadcrumbList' : ''}`, async ({ page }) => {
      await page.goto(c.path);
      const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(raw, 'page must emit at least one JSON-LD <script>').toBeTruthy();
      const graph = JSON.parse(raw!) as Record<string, unknown>;
      const nodes = graph['@graph'] as Record<string, unknown>[];
      const types = nodes.map((n) => n['@type']);
      expect(types).toContain('Person');
      expect(types).toContain('WebSite');
      if (c.pageType) expect(types).toContain(c.pageType);
      if (c.expectBreadcrumb) expect(types).toContain('BreadcrumbList');
      else expect(types).not.toContain('BreadcrumbList');
    });
  }
});
