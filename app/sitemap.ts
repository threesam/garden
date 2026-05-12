import type { MetadataRoute } from "next";
import { visibleSketches } from "@/lib/art/registry";
import { SITE_URL } from "@/lib/seo";

// Only routes reachable from the homepage (directly via the Gallery, or
// indirectly via /canvas/self's body links to /benny and /dad). Orphan
// pages — /signal, /source, /resonance, /case-studies/* — are excluded
// until something on the navigable surface links to them.
const STATIC_ROUTES = [
  "/",
  "/canvas/self",
  "/shelf",
  "/sounds",
  "/thoughts",
  "/dad",
  "/deana",
  "/benny",
  "/anything-but-analog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
  const sketchEntries: MetadataRoute.Sitemap = visibleSketches.map((s) => ({
    url: `${SITE_URL}/anything-but-analog/${s.slug}`,
    lastModified: s.date ? new Date(s.date) : now,
  }));
  return [...staticEntries, ...sketchEntries];
}
