import type { Metadata } from "next";
import Link from "next/link";
import { WorkCard } from "@/components/portfolio/work-card";

export const metadata: Metadata = {
  title: "resonance — threesam",
  description:
    "The impact that reaches others. Client work, case studies, and value delivered.",
};

const IMPACT_ITEMS = [
  {
    title: "Made In Cookware",
    category: "impact story",
    summary:
      "Headless commerce systems with Next.js storefront architecture and performance-focused pipelines.",
    href: "/case-studies/made-in-cookware",
  },
  {
    title: "Sixtom",
    category: "impact story",
    summary:
      "AI-enabled ecommerce systems spanning Shopify integrations, analytics layers, and conversion experiments.",
    href: "/case-studies/sixtom",
  },
  {
    title: "CRO & Ecommerce Systems",
    category: "impact story",
    summary:
      "Instrumentation, testing frameworks, and product workflow tooling for rapid iteration.",
    href: "/case-studies/cro-ecommerce-systems",
  },
];

export default function ResonancePage() {
  return (
    <main className="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-16 pt-20 md:px-8">
      <h1 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        resonance
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        the impact that reaches others and leaves the world better. experiences
        created for clients, generative pieces that move people, knowledge
        shared. value delivered.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {IMPACT_ITEMS.map((item) => (
          <WorkCard key={item.title} {...item} />
        ))}
      </div>

      <section className="section-shell mt-12 rounded-2xl p-6 md:p-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          work with me
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
          for client engagements, consulting, and studio work —
        </p>
        <a
          href="https://sixtom.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-sm text-zinc-300 transition hover:text-zinc-100"
        >
          sixtom.com ↗
        </a>
      </section>
    </main>
  );
}
