import type { ReactNode } from "react";

interface CanvasProps {
  children: ReactNode;
}

/**
 * A singular piece of work. Wraps Mood → Thoughts → Vision in order.
 * Each page composes its own Canvas with unique slot components.
 */
export function Canvas({ children }: CanvasProps) {
  return <article className="min-h-screen">{children}</article>;
}
