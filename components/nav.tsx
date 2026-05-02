import Link from "next/link";

const INTERNAL_LINKS = [
  { href: "/signal", label: "signal" },
  { href: "/source", label: "source" },
  { href: "/resonance", label: "resonance" },
] as const;

export function Nav() {
  return (
    <nav className="fixed top-0 right-0 z-50 flex items-center gap-1.5 p-3 md:gap-3 md:p-6">
      <Link
        href="/"
        className="mr-1.5 font-mono text-xs tracking-[0.16em] text-zinc-300 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:mr-3 md:text-sm"
      >
        threesam
      </Link>
      {INTERNAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:text-xs"
        >
          {link.label}
        </Link>
      ))}
      <a
        href="https://sixtom.com"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400 transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out md:text-xs"
      >
        studio ↗
      </a>
    </nav>
  );
}
