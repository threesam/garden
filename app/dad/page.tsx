import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { Prose } from "@/components/prose";
import { AsciiImage } from "@/components/messages/ascii-image";
import { LazyMount } from "@/components/lazy-mount";

export const metadata: Metadata = {
  title: "dad — threesam",
  description: "stories about my dad.",
};

export default async function DadPage() {
  const markdown = await getContent("dad");

  return (
    <main
      className="min-h-screen bg-zinc-900"
      style={{ color: "var(--white)" }}
    >
      <section className="relative h-dvh w-full overflow-hidden bg-zinc-900">
        <LazyMount className="absolute inset-0">
          <AsciiImage srcs={["/assets/dad-1.jpg"]} className="h-full w-full" inverted />
        </LazyMount>
        <h1
          className="pointer-events-none absolute bottom-6 left-6 z-10 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:bottom-20 md:left-20 md:text-8xl"
          style={{ color: "var(--white)" }}
        >
          dad
        </h1>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-20 md:px-8 md:pt-32">
        <div className="tier-essay">
          {markdown ? (
            <Prose content={markdown} />
          ) : (
            <p className="font-sans text-base leading-relaxed md:text-2xl md:leading-relaxed">
              more soon.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
