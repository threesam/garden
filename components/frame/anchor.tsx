"use client";

import { usePathname } from "next/navigation";
import { CloudCanvas } from "@/components/canvas/cloud-canvas";

// Pages where the ambient cloud footer would compete with the page's own
// full-bleed animations / immersive scroll experience. Also hidden on `/`
// because the homepage lays out its own 25dvh bottom cloud inside a
// single-viewport flex column. /thoughts and /sounds are full-viewport
// WIP pages whose own sketch background fills the screen — an extra
// cloud strip below pushes them past 100dvh and breaks the clean layout.
const HIDE_ON = ["/anything-but-analog"];
const EXACT_HIDE_ON = new Set(["/", "/thoughts", "/sounds", "/benny", "/dad"]);

export function Anchor() {
  const pathname = usePathname();
  if (EXACT_HIDE_ON.has(pathname)) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return (
    <div className="relative h-[30dvh] w-full md:h-[50dvh]">
      <CloudCanvas />
    </div>
  );
}
