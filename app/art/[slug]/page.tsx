import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { sketches, getSketch } from "@/lib/art/registry";
import { ArtRedirect } from "./redirect";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return sketches.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sketch = getSketch(slug);
  if (!sketch) return { title: "not found" };
  const ogUrl = `/art/og/${sketch.slug}.png`;
  return {
    title: `${sketch.title} — art — threesam`,
    description: `${sketch.title} (${sketch.date}), generative sketch.`,
    openGraph: {
      title: `${sketch.title} — threesam`,
      description: `${sketch.title} (${sketch.date}).`,
      images: [ogUrl],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

/**
 * Thin shell page: server-renders per-sketch metadata (title, og:image, etc.)
 * so crawlers see a rich social card, and client-redirects humans to the
 * scroll-snap gallery at /art#<slug>.
 */
export default async function ArtSketchPage({ params }: Props) {
  const { slug } = await params;
  const sketch = getSketch(slug);
  if (!sketch) notFound();

  const target = `/art#${sketch.slug}`;
  return (
    <main
      className="flex h-[100dvh] items-center justify-center"
      style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
    >
      <ArtRedirect target={target} />
      <noscript>
        <Link href={target} className="underline">
          continue to {sketch.title}
        </Link>
      </noscript>
    </main>
  );
}
