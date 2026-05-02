import type { Metadata } from "next";
import { SketchHost } from "@/components/art/sketch-host";

export const metadata: Metadata = {
  title: "thoughts — threesam",
  description: "essays (work in progress).",
};

// Under-construction landing for the essays collection. Uses the day30
// crowd-walker sketch as a live background (no caption or slug label —
// the sketch host renders raw bodies only) with a single centered title
// stating the page is still being built.
export default function ThoughtsPage() {
  return (
    <main
      className="relative h-dvh w-full overflow-hidden"
      style={{ backgroundColor: "var(--black)" }}
    >
      <SketchHost slug="30" active />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <h1
          className="font-mono text-4xl font-bold uppercase tracking-[0.2em] md:text-7xl"
          style={{ color: "var(--white)", mixBlendMode: "difference" }}
        >
          work in progress
        </h1>
      </div>
    </main>
  );
}
