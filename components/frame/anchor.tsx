"use client";

import { usePathname } from "next/navigation";
import { CloudCanvas } from "@/components/canvas/cloud-canvas";

// Pages where the ambient cloud footer would compete with the page's own
// full-bleed animations / immersive scroll experience.
const HIDE_ON = ["/anything-but-analog"];

export function Anchor() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return (
    <div className="relative h-[50dvh] w-full">
      <CloudCanvas />
    </div>
  );
}
