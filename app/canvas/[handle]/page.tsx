import { CloudCanvas } from "@/components/canvas/cloud-canvas";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function CanvasPage({ params }: Props) {
  const { handle } = await params;

  return (
    <div className="relative h-screen w-full">
      {/* Top cloud — black to white */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <CloudCanvas invert />
      </div>

      {/* Bottom cloud — white to black */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <CloudCanvas />
      </div>

      {/* Handle name — fixed center */}
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
        <span
          className="font-mono text-2xl font-bold tracking-[0.3em]"
          style={{ color: "var(--black)" }}
        >
          {handle.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
