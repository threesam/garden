import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { Gallery } from "@/components/gallery/gallery";

export default function Home() {
  return (
    <>
      <section className="relative h-[50vh] w-full overflow-hidden">
        <CloudCanvas invert />
      </section>
      <Gallery />
    </>
  );
}
