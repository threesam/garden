import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";
import { getContent } from "@/lib/content";
import { Prose } from "@/components/prose";
import { MessageTimeline } from "@/components/messages/message-timeline";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";

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
      </div>

      {markdown && (
        <section
          className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-24"
          style={{ color: "var(--black)" }}
        >
          <Prose
            content={markdown}
            slots={{
              "message-timeline": <MessageTimeline />,
              "anything-but-analog": <ParticleTextCanvas />,
            }}
          />
        </section>
      )}
    </>
  );
}
