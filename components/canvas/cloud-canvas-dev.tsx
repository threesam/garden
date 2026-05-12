"use client";

import dynamic from "next/dynamic";

// `next/dynamic` code-splits the live shader into its own chunk so the
// prod bundle's chunk graph never references it. The shader needs a DOM
// canvas and WebGL context, so ssr: false skips the server-side render
// attempt (which would fail on `document` / `WebGLRenderingContext`).
const CloudCanvasLive = dynamic(
  () => import("./cloud-canvas-live").then((m) => m.CloudCanvasLive),
  { ssr: false },
);

interface CloudCanvasDevProps {
  mirror?: boolean;
}

export function CloudCanvasDev({ mirror = false }: CloudCanvasDevProps) {
  return <CloudCanvasLive mirror={mirror} />;
}
