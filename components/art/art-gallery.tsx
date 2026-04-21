"use client";

import { useEffect, useRef, useState } from "react";
import { SketchHost } from "./sketch-host";

export interface SketchMeta {
  slug: string;
  date: string;
}

interface Props {
  sketches: SketchMeta[];
  /** Number of hero/non-sketch sections before this list. */
  heroCount?: number;
  /** How many sketches to keep active in the window ahead of the current. */
  lookahead?: number;
  /** How many previous sketches to keep (handles scroll-up). */
  lookback?: number;
}

/**
 * Gallery windowing coordinator. Watches scrollTop on the #art-scroller
 * and activates a sliding window of sketches: the current one plus `lookahead`
 * sections down and `lookback` sections up. Everything outside the window
 * is torn down (canvas cleared, state discarded) to keep memory bounded
 * regardless of how far the user has scrolled.
 */
export function ArtGallery({ sketches, heroCount = 1, lookahead = 2, lookback = 0 }: Props) {
  // Initial: first `lookahead+1` sketches active so hero → first sketches are
  // already warm on mount.
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("art-scroller") as HTMLElement | null;
    scrollerRef.current = el;
    if (!el) return;

    let rafId = 0;
    function update() {
      rafId = 0;
      const s = scrollerRef.current;
      if (!s) return;
      const h = s.clientHeight;
      if (h === 0) return;
      const rawIdx = Math.round(s.scrollTop / h);
      // DOM index 0 = hero; sketches start at heroCount. Clamp to [0, len-1].
      const sketchIdx = Math.max(0, Math.min(sketches.length - 1, rawIdx - heroCount));
      setActiveIdx((prev) => (prev === sketchIdx ? prev : sketchIdx));
    }

    function onScroll() {
      if (!rafId) rafId = requestAnimationFrame(update);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sketches.length, heroCount]);

  return (
    <>
      {sketches.map((s, i) => {
        const active = i >= activeIdx - lookback && i <= activeIdx + lookahead;
        return (
          <section
            key={s.slug}
            id={s.slug}
            data-art-slug={s.slug}
            className="relative h-[100dvh] w-full snap-start overflow-hidden"
            style={{ contentVisibility: "auto", containIntrinsicSize: "100dvh" }}
          >
            <SketchHost slug={s.slug} active={active} />
            <span
              className="pointer-events-none absolute top-6 left-6 z-10 font-mono text-sm font-bold uppercase tracking-[0.25em] md:top-10 md:left-10 md:text-base"
              style={{ color: "var(--white)", mixBlendMode: "difference" }}
            >
              {s.slug}
            </span>
            <span
              className="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-xs uppercase tracking-[0.25em] md:bottom-10 md:left-10 md:text-sm"
              style={{ color: "var(--white)", mixBlendMode: "difference" }}
            >
              {s.date}
            </span>
          </section>
        );
      })}
    </>
  );
}
