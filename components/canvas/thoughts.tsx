import type { ReactNode } from "react";

interface ThoughtsProps {
  children: ReactNode;
}

/**
 * What the author actually thinks. Long, unhurried writing.
 * The center of gravity. Compose with <Breakout> for emphasis
 * and inline images woven into the flow.
 */
export function Thoughts({ children }: ThoughtsProps) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 md:px-10 md:py-32">
      <div className="space-y-8 text-base leading-[1.9] text-foreground/80 md:text-lg md:leading-[2]">
        {children}
      </div>
    </section>
  );
}
