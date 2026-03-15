import Link from "next/link";
import { AudioReactiveProvider } from "@/components/audio/audio-reactive-provider";
import { VisitorTracker } from "@/components/counters/visitor-tracker";
import { GenerativeHero } from "@/components/hero/generative-hero";
import { BioSection } from "@/components/sections/bio-section";

export default function Home() {
  return (
    <AudioReactiveProvider>
      <VisitorTracker />
      <main className="copy-lower pb-16">
        <GenerativeHero />
        <BioSection />

        <section className="mx-auto mt-12 max-w-6xl px-6 md:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/signal"
              className="group section-shell rounded-2xl p-6 transition hover:border-white/30 hover:bg-black/50"
            >
              <h3 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
                signal
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                generative sketches, music, and audio-reactive experiments.
                the creative output.
              </p>
              <span className="mt-4 inline-block text-xs text-zinc-300 group-hover:text-zinc-100">
                explore →
              </span>
            </Link>

            <Link
              href="/source"
              className="group section-shell rounded-2xl p-6 transition hover:border-white/30 hover:bg-black/50"
            >
              <h3 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
                source
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                body, mind, 20 years of holistic discipline.
                the foundation everything is built on.
              </p>
              <span className="mt-4 inline-block text-xs text-zinc-300 group-hover:text-zinc-100">
                explore →
              </span>
            </Link>

            <Link
              href="/resonance"
              className="group section-shell rounded-2xl p-6 transition hover:border-white/30 hover:bg-black/50"
            >
              <h3 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
                resonance
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                the impact that reaches others. client work,
                case studies, and value delivered.
              </p>
              <span className="mt-4 inline-block text-xs text-zinc-300 group-hover:text-zinc-100">
                explore →
              </span>
            </Link>
          </div>
        </section>
      </main>
    </AudioReactiveProvider>
  );
}
