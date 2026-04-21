import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SketchHost } from "@/components/art/sketch-host";
import { sketches, getSketch } from "@/lib/art/registry";

interface Props {
  params: Promise<{ slug: string }>;
}

// Every sketch (including hidden ones) gets a raw page, so broken/slow
// sketches can still be viewed directly without cluttering the gallery.
export async function generateStaticParams() {
  return sketches.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sketch = getSketch(slug);
  if (!sketch) return { title: "not found" };
  return {
    title: `${sketch.title} — raw — threesam`,
    description: `${sketch.title} (${sketch.date}), raw sketch view.`,
  };
}

/**
 * Full-screen isolated view of a single sketch. Unlike /anything-but-analog/<n>
 * (which redirects to the gallery hash), this actually mounts the sketch in
 * its own viewport with nothing else on the page.
 */
export default async function RawSketchPage({ params }: Props) {
  const { slug } = await params;
  const sketch = getSketch(slug);
  if (!sketch) notFound();

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden" style={{ backgroundColor: "var(--black)" }}>
      <SketchHost slug={sketch.slug} active />
      <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex items-baseline justify-between px-6 font-mono text-xs uppercase tracking-[0.25em] md:top-10 md:px-10 md:text-sm">
        <Link
          href="/anything-but-analog"
          className="pointer-events-auto transition-opacity hover:opacity-60"
          style={{ color: "var(--white)", mixBlendMode: "difference" }}
        >
          ← gallery
        </Link>
        <span style={{ color: "var(--white)", mixBlendMode: "difference" }}>
          {sketch.slug} · {sketch.date}
        </span>
      </div>
    </main>
  );
}
