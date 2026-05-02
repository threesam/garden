import Link from "next/link";

export default function SixtomCaseStudyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 md:px-9">
      <Link href="/resonance" className="text-xs text-zinc-400 hover:text-zinc-200">
        ← back to resonance
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-zinc-100">
        Sixtom — AI-driven ecommerce systems
      </h1>

      <section className="section-shell mt-9 rounded-2xl p-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          problem
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-300 md:text-base">
          Build an adaptable ecommerce architecture where AI-assisted workflows
          can support merchandising, operational insight, and experimentation
          without fragmenting the core commerce stack.
        </p>
      </section>

      <section className="section-shell mt-6 rounded-2xl p-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          system architecture
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-sm leading-7 text-zinc-300 md:text-base">
          <li>Next.js application layer for storefront and internal tooling.</li>
          <li>Shopify commerce backbone for catalog, checkout, and operations.</li>
          <li>
            Data pipeline layer for event collection, modeling, and reporting.
          </li>
          <li>
            AI-enabled services for structured content workflows and support
            utilities.
          </li>
        </ul>
      </section>

      <section className="section-shell mt-6 rounded-2xl p-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          technologies
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-300 md:text-base">
          Next.js, Shopify, TypeScript, event pipelines, analytics tooling, and
          conversion optimization frameworks.
        </p>
      </section>

      <section className="section-shell mt-6 rounded-2xl p-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          outcomes
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-300 md:text-base">
          Delivered a modular foundation for AI-aware ecommerce execution with a
          practical path for ongoing experimentation, clearer operational
          visibility, and iterative conversion improvements.
        </p>
      </section>
    </main>
  );
}
