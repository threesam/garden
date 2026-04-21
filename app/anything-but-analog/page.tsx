import type { Metadata } from "next";
import { ArtGallery } from "@/components/art/art-gallery";
import { ArtScrollSync } from "@/components/art/art-scroll-sync";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";
import { visibleSketches } from "@/lib/art/registry";

export const metadata: Metadata = {
  title: "anything but analog — threesam",
  description: "generative sketches.",
  openGraph: {
    images: ["/og/anything-but-analog.png"],
  },
};

export default function AnythingButAnalogPage() {
  const meta = visibleSketches.map((s) => ({
    slug: s.slug,
    date: s.date,
    description: s.description,
  }));
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
      <ArtGallery sketches={meta} />
    </main>
  );
}
