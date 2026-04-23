"use client";

import { useEffect, useRef, useState } from "react";
import { SketchHost } from "./sketch-host";

export interface SketchMeta {
  slug: string;
  date: string;
  description?: string;
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
// lookahead defaults to 1 so at most two sketches animate concurrently
// (current + next). The previous default of 2 meant 3 rAF pipelines were
// running in lockstep whenever the user sat mid-gallery — measurable
// wins on mobile battery and desktop fan noise for sketches that do
// heavy per-frame work.
export function ArtGallery({ sketches, heroCount = 1, lookahead = 1, lookback = 0 }: Props) {
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
      // DOM index 0 = hero; sketches start at heroCount. When the user
      // is still on/before the hero we set a sentinel value far enough
      // from sketch-index 0 that even with `lookahead` the first sketch
      // stays torn down. Previously `Math.max(0, ...)` clamped to 0 on
      // the hero, which kept the first sketch active while the hero's
      // own canvas was running — noticeable lag on the hero section.
      const gallery = rawIdx - heroCount;
      const sketchIdx = gallery < 0 ? -100 : Math.min(sketches.length - 1, gallery);
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
              className="pointer-events-none absolute top-5 left-5 z-10 grid place-items-center font-mono text-xs font-bold uppercase tracking-[0.12em] md:top-6 md:left-8"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "var(--black)",
                color: "var(--white)",
                boxShadow: "inset 0 0 0 1.5px var(--white), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              }}
            >
              {s.slug}
            </span>
            <span
              className="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-xs uppercase tracking-[0.25em] md:bottom-10 md:left-10 md:text-sm"
              style={{ color: "var(--white)", mixBlendMode: "difference" }}
            >
              {s.date}
            </span>
            {s.description ? (
              <span
                className="pointer-events-none absolute right-6 bottom-6 z-10 max-w-[60%] text-right font-mono text-xs uppercase tracking-[0.2em] md:right-10 md:bottom-10 md:max-w-[40%] md:text-sm"
                style={{ color: "var(--white)" }}
              >
                {s.description}
              </span>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
