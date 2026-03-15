"use client";

import dynamic from "next/dynamic";

const ParticleSketch = dynamic(() => import("@/components/hero/hero-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
      loading sketch...
    </div>
  ),
});

export function HeroSketchCarousel() {
  return (
    <div className="absolute inset-0">
      <ParticleSketch />
    </div>
  );
}
