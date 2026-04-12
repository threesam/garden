"use client";

import { AsciiCanvas } from "./ascii-canvas";

interface AsciiHeroProps {
  src: string;
  heading: string;
  color?: string;
  position?: string;
}

export function AsciiHero({ src, heading, color = "white", position = "left" }: AsciiHeroProps) {
  const isBottom = position.startsWith("bottom");
  const isRight = position.includes("right");
  const isCenter = position.includes("center");

  const hClass = isCenter
    ? "left-1/2 -translate-x-1/2 text-center"
    : isRight
      ? "right-6 text-right md:right-20"
      : "left-6 md:left-20";
  const vClass = isBottom
    ? "bottom-6 md:bottom-20"
    : "top-6 md:top-20";

  return (
    <div className="relative my-12 -mx-6 md:mx-0 md:w-[768px] md:max-w-[768px] md:left-1/2 md:-translate-x-1/2 overflow-hidden md:rounded-lg" style={{ height: 400, backgroundColor: "var(--white)" }}>
      <AsciiCanvas src={src} className="absolute inset-0" />
      <span
        className={`absolute ${vClass} ${hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl`}
        style={{ color }}
      >
        {heading}
      </span>
    </div>
  );
}
