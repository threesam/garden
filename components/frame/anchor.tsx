"use client";

import { usePathname } from "next/navigation";
import { CloudCanvas } from "@/components/canvas/cloud-canvas";

// Pages where the ambient cloud footer would compete with the page's own
// full-bleed animations / immersive scroll experience. Also hidden on `/`
// because the homepage lays out its own 25dvh bottom cloud inside a
// single-viewport flex column.
const HIDE_ON = ["/anything-but-analog"];
const EXACT_HIDE_ON = new Set(["/"]);

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
