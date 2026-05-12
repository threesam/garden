"use client";

import { useEffect } from "react";

/**
 * Keeps the URL hash in sync with the currently-centered scroll-snap section,
 * and scrolls to a hash on mount (so /art#3 lands on the day-3 section).
 * Uses one IntersectionObserver across all sections; the most-visible section
 * wins and replaces history state without creating entries.
 */
export function ArtScrollSync() {
  useEffect(() => {
    const scroller = document.getElementById("art-scroller");
    if (!scroller) return;
    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>("section[data-art-slug]")
    );
    if (sections.length === 0) return;

    // Scroll to hash on mount (the snap container overrides the default
    // anchor-navigation, so we do it explicitly).
    const initialHash = window.location.hash.replace(/^#/, "");
    if (initialHash) {
      const target = sections.find((s) => s.dataset.artSlug === initialHash);
      if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
    }

    let currentSlug = initialHash || sections[0].dataset.artSlug!;
    const visibility = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).dataset.artSlug;
          if (!slug) continue;
          visibility.set(slug, entry.intersectionRatio);
        }
        // Pick the section with highest visibility
        let best: string | null = null;
        let bestRatio = 0;
        for (const [slug, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = slug;
          }
        }
        if (best && best !== currentSlug) {
          currentSlug = best;
          history.replaceState(null, "", `#${best}`);
        }
      },
      {
        root: scroller,
        threshold: [0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return null;
}
