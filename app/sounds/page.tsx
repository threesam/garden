import type { Metadata } from "next";
import { SketchHost } from "@/components/art/sketch-host";

export const metadata: Metadata = {
  title: "sounds — threesam",
  description: "music playground (coming soon).",
};

// Placeholder landing for the upcoming music/sound playground. Uses
// day25 (eye-ocean / dot-grid perspective) as a static background with
// a single centered "coming soon" title. Day25 has no tick so it
// renders once and the canvas stays idle — ideal for a pre-launch page.
export default function SoundsPage() {
  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: "var(--black)" }}
    >
      <SketchHost slug="25" active />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <h1
          className="font-mono text-4xl font-bold uppercase tracking-[0.2em] md:text-7xl"
          style={{ color: "var(--white)", mixBlendMode: "difference" }}
        >
          coming soon
        </h1>
      </div>
    </main>
  );
}
