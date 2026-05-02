"use client";

import { useEffect, useState } from "react";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";

interface VoronoiImageProps {
  src: string;
  alt: string;
}

export function VoronoiImage({ src, alt }: VoronoiImageProps) {
  const [aspect, setAspect] = useState(2576 / 1449);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.width / img.height);
    img.src = src;
  }, [src]);

  const isBanner = alt.includes("|");

  if (isBanner) {
    const parts = alt.split("|");
    const heading = parts[0].trim().replace(/\\n/g, "\n");
    const color = parts[1]?.trim() || "white";
    const pos = parts[2]?.trim() || "left";
    const isBottom = pos.startsWith("bottom");
    const isMiddleVertical = pos === "center";
    const isRight = pos.includes("right");
    const isCenter = pos.includes("center");
    const hClass = isCenter
      ? "left-1/2 -translate-x-1/2 text-center"
      : isRight
        ? "right-6 text-right md:right-20"
        : "left-6 md:left-20";
    const vClass = isBottom
      ? "bottom-6 md:bottom-20"
      : isMiddleVertical
        ? "top-1/2 -translate-y-1/2"
        : "top-6 md:top-20";

    return (
      <div
        className="voronoi-banner snap-start"
        style={{ ["--banner-aspect" as string]: String(aspect) }}
      >
        <div className="voronoi-banner-inner">
          <VoronoiCanvas imageSrc={src} invert showLetters={false} />
          <span
            className={`absolute ${vClass} ${hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl pointer-events-none z-10`}
            style={{ color, whiteSpace: "pre-line" }}
          >
            {heading}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative my-9 -mx-6 w-full overflow-hidden rounded-lg md:-mx-9"
      style={{ aspectRatio: aspect }}
    >
      <VoronoiCanvas imageSrc={src} invert showLetters={false} />
      {alt && <span className="sr-only">{alt}</span>}
    </div>
  );
}
