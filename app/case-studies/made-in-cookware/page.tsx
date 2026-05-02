import Link from "next/link";

export default function MadeInCookwarePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 md:px-9">
      <Link href="/resonance" className="text-xs text-zinc-400 hover:text-zinc-200">
        ← back to resonance
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-100">
        Made In Cookware
      </h1>
      <p className="mt-6 text-sm leading-7 text-zinc-300 md:text-base">
        Placeholder case study scaffold for headless commerce implementation
        notes, architecture decisions, and performance learnings.
      </p>
    </main>
  );
}
