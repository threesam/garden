import type { MetadataRoute } from "next";
import { visibleSketches } from "@/lib/art/registry";

const SITE_URL = "https://threesam.com";

const STATIC_ROUTES = [
  "/",
  "/signal",
  "/source",
  "/resonance",
  "/canvas/self",
  "/shelf",
  "/sounds",
  "/thoughts",
  "/dad",
  "/deana",
  "/benny",
  "/anything-but-analog",
  "/case-studies/sixtom",
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
