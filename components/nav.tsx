import Link from "next/link";

const INTERNAL_LINKS = [
  { href: "/signal", label: "signal" },
  { href: "/source", label: "source" },
  { href: "/resonance", label: "resonance" },
] as const;

export function Nav() {
  return (
    <nav className="fixed top-0 right-0 z-50 flex items-center gap-1 p-4 md:gap-2 md:p-6">
      <Link
        href="/"
        className="mr-2 font-mono text-xs tracking-[0.16em] text-zinc-300 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:mr-4 md:text-sm"
      >
        threesam
      </Link>
      {INTERNAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-zinc-400 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:text-xs"
        >
          {link.label}
        </Link>
      ))}
      <a
        href="https://sixtom.com"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-zinc-400 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:text-xs"
      >
        studio ↗
      </a>
    </nav>
  );
}
