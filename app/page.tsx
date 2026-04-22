import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { Gallery } from "@/components/gallery/gallery";

export default function Home() {
  return (
    <>
      <section className="relative h-[30dvh] w-full overflow-hidden md:h-[50dvh]">
        <CloudCanvas invert />
      </section>
      <Gallery />
    </>
  );
}
