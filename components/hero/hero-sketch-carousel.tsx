"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const ParticleSketch = dynamic(() => import("@/components/hero/hero-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
      loading sketch...
    </div>
  ),
});

const MountainSketch = dynamic(
  () => import("@/components/hero/mountain-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
        loading sketch...
      </div>
    ),
  },
);

const SKETCHES = [
  { id: "particles", label: "particles", Component: ParticleSketch },
  { id: "mountains", label: "mountains", Component: MountainSketch },
] as const;

const SWIPE_THRESHOLD = 48;

export function HeroSketchCarousel() {
  const [index, setIndex] = useState(0);
  const startXRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const activeSketch = SKETCHES[index];
  const ActiveComponent = activeSketch.Component;

  const go = (direction: 1 | -1) => {
    setIndex((prev) => (prev + direction + SKETCHES.length) % SKETCHES.length);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    if (startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    startXRef.current = null;
    pointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) go(1);
    else go(-1);
  };

  const onPointerCancel = () => {
    startXRef.current = null;
    pointerIdRef.current = null;
  };

  const onPointerLeave = () => {
    startXRef.current = null;
    pointerIdRef.current = null;
  };

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      <ActiveComponent key={activeSketch.id} />

      <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => go(-1)}
            className="text-xs text-zinc-300 hover:text-zinc-100"
            aria-label="previous sketch"
          >
            ←
          </button>
          <span className="title-up font-mono text-[10px] tracking-[0.18em] text-zinc-300">
            {activeSketch.label}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            className="text-xs text-zinc-300 hover:text-zinc-100"
            aria-label="next sketch"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
