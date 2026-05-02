import Link from "next/link";

export default function GenerativeArtExperimentsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 md:px-9">
      <Link href="/signal" className="text-xs text-zinc-400 hover:text-zinc-200">
        ← back to signal
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-100">
        Generative Art Experiments
      </h1>
      <p className="mt-6 text-sm leading-7 text-zinc-300 md:text-base">
        Placeholder case study scaffold for shader studies, procedural systems,
        and audio-reactive visual experiments.
      </p>
    </main>
  );
}
