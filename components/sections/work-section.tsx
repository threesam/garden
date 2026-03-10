import { WorkCard } from "@/components/portfolio/work-card";

const WORK_ITEMS = [
  {
    title: "Made In Cookware",
    category: "companies worked with",
    summary:
      "Headless commerce systems with Next.js storefront architecture and performance-focused pipelines.",
    href: "/case-studies/made-in-cookware",
  },
  {
    title: "Sixtom",
    category: "selected case studies",
    summary:
      "AI-enabled ecommerce systems spanning Shopify integrations, analytics layers, and conversion experiments.",
    href: "/case-studies/sixtom",
  },
  {
    title: "Generative Art Experiments",
    category: "engineering projects",
    summary:
      "WebGL + audio-reactive studies with parameterized systems for visual composition and interaction.",
    href: "/case-studies/generative-art-experiments",
  },
  {
    title: "CRO & Ecommerce Systems",
    category: "engineering projects",
    summary:
      "Instrumentation, testing frameworks, and product workflow tooling for rapid iteration.",
    href: "/case-studies/cro-ecommerce-systems",
  },
];

export function WorkSection() {
  return (
    <section className="section-shell mx-auto mt-12 max-w-6xl rounded-2xl p-6 md:p-8">
      <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        work / portfolio
      </h2>
      <p className="mt-3 mb-5 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        Technical resume and build archive: companies worked with, engineering
        projects, and selected case studies.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {WORK_ITEMS.map((item) => (
          <WorkCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
