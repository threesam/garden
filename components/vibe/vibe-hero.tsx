"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { extractDominantColor } from "@/lib/dominant-color";
import type { Book } from "@/lib/goodreads";

// --black #1a1a14 as normalized RGB — metaballs start invisible on the black section.
const BG_COLOR: [number, number, number] = [26 / 255, 26 / 255, 20 / 255];

interface VibeHeroProps {
  featured: Book | null;
  featuredLabel: string;
}

export function VibeHero({ featured, featuredLabel }: VibeHeroProps) {
  const coverRef = useRef<HTMLImageElement>(null);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState<[number, number, number]>(BG_COLOR);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!featured?.coverUrl) return;
    let cancelled = false;
    extractDominantColor(featured.coverUrl).then((c) => {
      if (!cancelled && c) setColor(c);
    });
    return () => {
      cancelled = true;
    };
  }, [featured?.coverUrl]);

  const updateTarget = useCallback(() => {
    const rect = coverRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, []);

  const clearTarget = useCallback(() => setTarget(null), []);

  const patternUrl = useMemo(() => {
    const cssColor = `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`;
    const tileW = 900;
    const tileH = 460;
    const phrase = "WHAT'S MY VIBE? ".repeat(10);
    const rows = [
      { y: 38, size: 26, offset: 0 },
      { y: 92, size: 16, offset: -140 },
      { y: 148, size: 34, offset: 70 },
      { y: 200, size: 20, offset: -60 },
      { y: 258, size: 44, offset: 110 },
      { y: 316, size: 18, offset: -90 },
      { y: 366, size: 28, offset: 30 },
      { y: 420, size: 14, offset: -50 },
    ];
    const rowsSvg = rows
      .map(
        (r) =>
          `<text x='${r.offset}' y='${r.y}' font-family='monospace' font-size='${r.size}' font-weight='700' letter-spacing='${Math.round(r.size * 0.3)}' fill='${cssColor}'>${phrase}</text>`
      )
      .join("");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}' viewBox='0 0 ${tileW} ${tileH}'>${rowsSvg}</svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [color]);

  return (
    <section
      className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden px-6 pt-24 pb-16 md:items-center md:px-10 md:py-16"
      style={{ background: "var(--black)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0, backgroundImage: patternUrl, backgroundRepeat: "repeat", opacity: 0.13 }}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
        <MetaballCanvas color={color} trackCursor={false} target={target} />
      </div>

      <h1 className="sr-only">what&apos;s my vibe?</h1>

      {featured ? (
        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12">
          <a
            href={`https://www.goodreads.com/book/show/${featured.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cover flex items-center justify-center md:justify-end"
            onMouseEnter={updateTarget}
            onMouseLeave={clearTarget}
          >
            {featured.coverUrl ? (
              <img
                ref={coverRef}
                src={featured.coverUrl}
                alt={featured.cleanTitle}
                style={{ "--shadow-rgb": `${Math.round(color[0] * 255)} ${Math.round(color[1] * 255)} ${Math.round(color[2] * 255)}` } as React.CSSProperties}
                className="block h-auto w-full shadow-[0_20px_50px_-15px_rgb(var(--shadow-rgb)/0.45)] transition duration-700 group-hover/cover:-translate-y-1 group-hover/cover:-rotate-[1.3deg] group-hover/cover:shadow-[0_50px_120px_-20px_rgb(var(--shadow-rgb)/0.8)] md:h-auto md:max-h-[60dvh] md:w-auto"
              />
            ) : null}
          </a>

          <div className="flex flex-col gap-4 md:max-w-md" style={{ color: "var(--white)" }}>
            <a
              href={`https://www.goodreads.com/book/show/${featured.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3"
            >
              <div className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: "var(--coin)" }}>
                {featuredLabel}
              </div>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">{featured.cleanTitle}</h2>
              <div className="text-base opacity-70">
                {featured.author}
                {featured.series ? (
                  <span>
                    {" · "}
                    {featured.series} #{featured.seriesNumber}
                  </span>
                ) : null}
              </div>
            </a>

            {featured.description ? (
              <div>
                <p
                  className={`whitespace-pre-line text-sm leading-relaxed opacity-75 md:text-base ${expanded ? "" : "max-md:line-clamp-3"}`}
                >
                  {featured.description}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded((x) => !x)}
                  className="mt-2 font-mono text-xs uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-80 md:hidden"
                  style={{ color: "var(--coin)" }}
                >
                  {expanded ? "show less" : "read more"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
