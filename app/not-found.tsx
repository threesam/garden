import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
      style={{ background: "var(--black)", color: "var(--white)" }}
    >
      <div
        className="font-mono text-xs uppercase tracking-[0.3em]"
        style={{ color: "var(--coin)" }}
      >
        404
      </div>
      <h1 className="text-3xl font-bold leading-tight md:text-4xl">
        nothing here.
      </h1>
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-70"
        style={{ color: "var(--coin)" }}
      >
        back home
      </Link>
    </main>
  );
}
