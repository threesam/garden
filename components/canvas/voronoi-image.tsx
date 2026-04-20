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
    const isRight = pos.includes("right");
    const isCenter = pos.includes("center");
    const hClass = isCenter
      ? "left-1/2 -translate-x-1/2 text-center"
      : isRight
        ? "right-6 text-right md:right-20"
        : "left-6 md:left-20";
    const vClass = isBottom
      ? "bottom-6 md:bottom-20"
      : "top-6 md:top-20";

    return (
      <div
        className="relative my-12 -mx-6 md:mx-0 md:w-[768px] md:max-w-[768px] md:left-1/2 md:-translate-x-1/2 overflow-hidden md:rounded-lg"
        style={{ aspectRatio: aspect }}
      >
        <VoronoiCanvas imageSrc={src} invert />
        <span
          className={`absolute ${vClass} ${hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl pointer-events-none z-10`}
          style={{ color, whiteSpace: "pre-line" }}
        >
          {heading}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative my-8 rounded-lg overflow-hidden w-full md:w-[768px] md:max-w-[768px] md:left-1/2 md:-translate-x-1/2"
      style={{ aspectRatio: aspect }}
    >
      <VoronoiCanvas imageSrc={src} invert />
      {alt && <span className="sr-only">{alt}</span>}
    </div>
  );
}
