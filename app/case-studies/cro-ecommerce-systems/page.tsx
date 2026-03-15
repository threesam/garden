import Link from "next/link";

export default function CroEcommerceSystemsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14 md:px-8">
      <Link href="/resonance" className="text-xs text-zinc-400 hover:text-zinc-200">
        ← back to resonance
      </Link>
      <h1 className="mt-5 text-3xl font-semibold text-zinc-100">
        CRO &amp; Ecommerce Systems
      </h1>
      <p className="mt-5 text-sm leading-7 text-zinc-300 md:text-base">
        Placeholder case study scaffold for experimentation frameworks,
        instrumentation strategies, and conversion system architecture.
      </p>
    </main>
  );
}
