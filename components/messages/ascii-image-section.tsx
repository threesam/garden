"use client";

import { useMemo } from "react";
import { AsciiImage } from "./ascii-image";
import { DanaLabel } from "./dana-label";
import { LazyMount } from "@/components/lazy-mount";

interface Props {
  src: string;
  /** Optional secondary src for crossfade cycling (rare). */
  altSrcs?: string[];
}

/**
 * Full-screen (100dvh) section rendering one image as ASCII art with the
 * animated "D-ANA" label pinned bottom-left. `AsciiImage` only mounts when
 * the section is near the viewport (via LazyMount) — 5 of these on one
 * page would otherwise decode every image on initial load.
 */
export function AsciiImageSection({ src, altSrcs }: Props) {
  // Stable array identity so AsciiImage's effect doesn't tear down each render.
  const srcs = useMemo(() => (altSrcs?.length ? [src, ...altSrcs] : [src]), [src, altSrcs]);

  return (
    <section
      className="relative h-dvh w-full snap-start overflow-hidden"
      style={{
        backgroundColor: "var(--white)",
        contentVisibility: "auto",
        containIntrinsicSize: "100vw 100dvh",
      }}
    >
      <LazyMount className="absolute inset-0">
        <AsciiImage srcs={srcs} className="h-full w-full" />
      </LazyMount>
      <span
        className="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-2xl font-bold uppercase tracking-[0.3em] md:bottom-10 md:left-10 md:text-5xl"
        style={{
          color: "var(--black)",
          // Legible against the noisy ASCII field. mixBlend:difference
          // flickered char-by-char through the art and was unreadable.
          // Solid black with a subtle cream halo keeps the letters
          // crisp wherever ASCII char density dips.
          textShadow:
            "0 0 2px rgba(245,244,240,0.95), 0 1px 6px rgba(245,244,240,0.7)",
        }}
      >
        <DanaLabel />
      </span>
    </section>
  );
}
