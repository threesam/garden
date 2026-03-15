import type { Metadata } from "next";
import { StepDashboard } from "@/components/fitness/step-dashboard";
import type { StepEntry } from "@/types/fitness";
import stepData from "@/data/steps.mock.json";

export const metadata: Metadata = {
  title: "source — threesam",
  description:
    "Body, mind, 20 years of holistic discipline. The foundation everything is built on.",
};

const entries = stepData.entries as StepEntry[];

export default function SourcePage() {
  return (
    <main className="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-16 pt-20 md:px-8">
      <h1 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        source
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        body, mind, 20 years of holistic discipline. maintain the source and
        the output takes care of itself. spiritual, multiverse-aware,
        comfortable being uncomfortable.
      </p>

      <section className="section-shell mt-12 rounded-2xl p-6 md:p-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          daily movement
        </h2>
        <p className="mt-3 mb-5 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
          step tracking with calendar view, weekly totals, and annual trend.
          the discipline is the practice — not the metric.
        </p>
        <StepDashboard entries={entries} />
      </section>

      <section className="section-shell mt-8 rounded-2xl p-6 md:p-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          philosophy
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-400 md:text-base">
          <p>
            the body is the instrument. if it&apos;s not tuned, nothing
            else matters — not the code, not the art, not the business.
          </p>
          <p>
            contrarian by nature. if others do x, try something different.
            taste-driven — aesthetics and quality aren&apos;t afterthoughts,
            they&apos;re the point.
          </p>
          <p>
            sci-fi energy — exploration of the unknown, comfortable at
            the frontier.
          </p>
        </div>
      </section>
    </main>
  );
}
