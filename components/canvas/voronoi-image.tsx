"use client";

import { useEffect, useState } from "react";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";

interface VoronoiImageProps {
  src: string;
  alt: string;
}

export function VoronoiImage({ src, alt }: VoronoiImageProps) {
  const [aspect, setAspect] = useState(2576 / 1449);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.width / img.height);
    img.src = src;
  }, [src]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

    const innerStyle = {
      width: `min(100vw, 100dvh * ${aspect})`,
      maxHeight: "100dvh",
      aspectRatio: aspect,
    };

    if (isDesktop) {
      return (
        <div
          className="relative my-12 flex items-center justify-center overflow-hidden"
          style={{
            left: "calc(50% - 50vw)",
            width: "100vw",
            height: "100dvh",
            backgroundColor: "var(--black)",
          }}
        >
          <div className="relative overflow-hidden md:rounded-lg" style={innerStyle}>
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
        className="relative my-12 overflow-hidden"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          ...innerStyle,
        }}
      >
        <VoronoiCanvas imageSrc={src} invert showLetters={false} />
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
      <VoronoiCanvas imageSrc={src} invert showLetters={false} />
      {alt && <span className="sr-only">{alt}</span>}
    </div>
  );
}
