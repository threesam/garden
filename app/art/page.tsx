import type { Metadata } from "next";
import { SketchHost } from "@/components/art/sketch-host";
import { ArtScrollSync } from "@/components/art/art-scroll-sync";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";
import { sketches } from "@/lib/art/registry";

export const metadata: Metadata = {
  title: "art — threesam",
  description: "generative sketches.",
  openGraph: {
    images: ["/art/og/index.png"],
  },
};

export default function ArtIndexPage() {
  return (
    <main
      id="art-scroller"
      className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll"
      style={{ backgroundColor: "var(--black)" }}
    >
      <ArtScrollSync />
      <section
        id="hero"
        data-art-slug="hero"
        className="relative h-[100dvh] w-full snap-start overflow-hidden"
      >
        <ParticleTextCanvas />
      </section>
      {sketches.map((s) => (
        <section
          key={s.slug}
          id={s.slug}
          data-art-slug={s.slug}
          className="relative h-[100dvh] w-full snap-start overflow-hidden"
        >
          <SketchHost slug={s.slug} />
          <span
            className="pointer-events-none absolute top-6 left-6 z-10 font-mono text-sm font-bold uppercase tracking-[0.25em] md:top-10 md:left-10 md:text-base"
            style={{ color: "var(--white)", mixBlendMode: "difference" }}
          >
            {s.slug}
          </span>
          <span
            className="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-xs uppercase tracking-[0.25em] md:bottom-10 md:left-10 md:text-sm"
            style={{ color: "var(--white)", mixBlendMode: "difference" }}
          >
            {s.date}
          </span>
        </section>
      ))}
    </main>
  );
}
