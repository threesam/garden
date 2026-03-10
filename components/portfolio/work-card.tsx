import Link from "next/link";

interface WorkCardProps {
  title: string;
  category: string;
  summary: string;
  href: string;
}

export function WorkCard({ title, category, summary, href }: WorkCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/10 bg-black/35 p-5 transition hover:border-white/30 hover:bg-black/50"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        {category}
      </div>
      <h3 className="title-up mt-3 text-lg font-semibold tracking-[0.06em] text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{summary}</p>
      <span className="mt-4 inline-block text-xs text-zinc-300 group-hover:text-zinc-100">
        open study →
      </span>
    </Link>
  );
}
