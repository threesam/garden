import { StepDashboard } from "@/components/fitness/step-dashboard";
import type { StepEntry } from "@/types/fitness";
import stepData from "@/data/steps.mock.json";

const entries = stepData.entries as StepEntry[];

export function DisciplineSection() {
  return (
    <section className="section-shell mx-auto mt-12 max-w-6xl rounded-2xl p-6 md:p-9">
      <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        fitness / discipline
      </h2>
      <p className="mt-3 mb-6 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        Daily step tracking with calendar view, weekly totals, and annual trend
        bars. Data is currently mock JSON and can be replaced with real exports
        later.
      </p>
      <StepDashboard entries={entries} />
    </section>
  );
}
