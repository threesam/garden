import type { ReactNode } from "react";

interface MoodProps {
  title: string;
  children?: ReactNode;
}

/**
 * The feeling before the words. A generated visual world that sets the emotional
 * tone of the piece. Holds the title — the name of the thing. Nothing else competes.
 */
export function Mood({ title, children }: MoodProps) {
  return (
    <section className="relative flex h-dvh w-full items-end overflow-hidden">
      {/* Sketch / visual layer — passed as children */}
      {children && (
        <div className="absolute inset-0">{children}</div>
      )}

      {/* Title — anchored to the bottom, floating over the visual */}
      <h1 className="relative z-10 px-6 pb-12 font-mono text-sm tracking-[0.2em] text-foreground/70 md:px-9 md:pb-18 md:text-base">
        {title}
      </h1>
    </section>
  );
}
