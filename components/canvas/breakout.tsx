import type { ReactNode } from "react";

interface BreakoutProps {
  children: ReactNode;
}

/**
 * A single sentence that breaks out of the flow — bigger, alone, breathing.
 * Use sparingly. It earned it.
 */
export function Breakout({ children }: BreakoutProps) {
  return (
    <p className="my-18 text-2xl leading-snug text-foreground md:my-24 md:text-3xl md:leading-snug">
      {children}
    </p>
  );
}
