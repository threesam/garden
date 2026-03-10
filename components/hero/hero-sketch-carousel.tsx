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

const ForestSketch = dynamic(() => import("@/components/hero/forest-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
      loading sketch...
    </div>
  ),
});

const SKETCHES = [
  { id: "particles", label: "particles", Component: ParticleSketch },
  { id: "mountains", label: "mountains", Component: MountainSketch },
  { id: "forest", label: "forest", Component: ForestSketch },
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
  const goTo = (target: number) => {
    setIndex((target + SKETCHES.length) % SKETCHES.length);
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
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1.5 backdrop-blur-md">
          {SKETCHES.map((sketch, sketchIndex) => {
            const active = sketchIndex === index;
            return (
              <button
                key={sketch.id}
                type="button"
                onClick={() => goTo(sketchIndex)}
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] transition ${
                  active
                    ? "bg-amber-200/20 text-amber-100"
                    : "text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                }`}
                aria-label={`show ${sketch.label} sketch`}
                aria-current={active}
              >
                {String(sketchIndex + 1).padStart(2, "0")} {sketch.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
