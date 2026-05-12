"use client";

import dynamic from "next/dynamic";

// Lives in its own "use client" file so `cloud-canvas.tsx` can stay a
// server component — `next/dynamic` with `ssr: false` (required since
// the shader needs DOM canvas + WebGL) would otherwise force its
// caller into client mode.
const CloudCanvasLive = dynamic(
  () => import("./cloud-canvas-live").then((m) => m.CloudCanvasLive),
  { ssr: false },
);

export function CloudCanvasDev({ mirror = false }: { mirror?: boolean }) {
  return <CloudCanvasLive mirror={mirror} />;
}
