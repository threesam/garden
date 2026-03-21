import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";
import { getContent } from "@/lib/content";
import { Prose } from "@/components/prose";

interface Props {
  params: Promise<{ handle: string }>;
}

const HERO_MAP: Record<string, "voronoi" | "cloud"> = {
  self: "voronoi",
};

export default async function CanvasPage({ params }: Props) {
  const { handle } = await params;
  const markdown = await getContent(handle);
  const heroType = HERO_MAP[handle] ?? "cloud";

  return (
    <>
      <div className="relative h-[50dvh] w-full overflow-hidden">
        {heroType === "voronoi" ? (
          <VoronoiCanvas invert />
        ) : (
          <CloudCanvas invert />
        )}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="font-mono text-2xl font-bold tracking-[0.3em]"
            style={{ color: "var(--black)" }}
          >
            {handle.toUpperCase()}
          </span>
        </div>
      </div>

      {markdown && (
        <section
          className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-24"
          style={{ color: "var(--black)" }}
        >
          <Prose content={markdown} />
        </section>
      )}
    </>
  );
}
