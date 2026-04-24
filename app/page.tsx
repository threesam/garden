import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { Gallery } from "@/components/gallery/gallery";

// Homepage lays out into a single viewport: 25dvh clouds on top (CSS-mirrored
// so the darker end meets the page edge), 50dvh gallery strip, 25dvh clouds
// below (unmirrored — darker end at page bottom). Both share the same shader
// and animate L→R in the same direction. No page scroll. The shared bottom
// Anchor from layout.tsx is suppressed on `/` so the 25dvh footer cloud fits
// in-layout instead of pushing the page taller.
export default function Home() {
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
      <section className="relative h-[25dvh] w-full overflow-hidden">
        <CloudCanvas mirror />
      </section>
      <div className="relative h-[50dvh] w-full">
        <Gallery />
      </div>
      <section className="relative h-[25dvh] w-full overflow-hidden">
        <CloudCanvas />
      </section>
    </div>
  );
}
