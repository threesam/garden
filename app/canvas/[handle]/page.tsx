import { CloudCanvas } from "@/components/canvas/cloud-canvas";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";
import { VoronoiImage } from "@/components/canvas/voronoi-image";
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

const HERO_IMAGE_MAP: Record<string, string> = {
  self: "/assets/self-hero.png",
};

const VORONOI_CONTENT_HANDLES = new Set(["self"]);

function extractVoronoiImages(markdown: string) {
  const slots: Record<string, React.ReactNode> = {};
  const imageRegex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let i = 0;
  const processed = markdown.replace(imageRegex, (match, alt, src) => {
    // Only banners (alt contains "|") get the voronoi treatment
    if (!alt.includes("|")) return match;
    const id = `voronoi-img-${i++}`;
    slots[id] = <VoronoiImage src={src} alt={alt} />;
    return `<!-- ${id} -->`;
  });
  return { processed, slots };
}

export default async function CanvasPage({ params }: Props) {
  const { handle } = await params;
  const markdown = await getContent(handle);
  const heroType = HERO_MAP[handle] ?? "cloud";
  const heroImage = HERO_IMAGE_MAP[handle];

  const useVoronoiImages = markdown && VORONOI_CONTENT_HANDLES.has(handle);
  const { processed, slots: voronoiImageSlots } = useVoronoiImages
    ? extractVoronoiImages(markdown)
    : { processed: markdown ?? "", slots: {} };

  return (
    <>
      <div
        className={`relative w-full overflow-hidden ${heroImage ? "h-[100dvh]" : "h-[50dvh]"}`}
      >
        {heroType === "voronoi" ? (
          <>
            <VoronoiCanvas invert imageSrc={heroImage} showLetters={false} fit="cover" />
            {handle === "self" && (
              <h1
                className="absolute bottom-6 left-6 md:bottom-20 md:left-20 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:text-8xl pointer-events-none z-10"
                style={{ color: "white" }}
              >
                self
              </h1>
            )}
          </>
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
            content={processed}
            slots={{
              "message-timeline": <MessageTimeline />,
              "anything-but-analog": <ParticleTextCanvas />,
              ...voronoiImageSlots,
            }}
          />
        </section>
      )}
    </>
  );
}
