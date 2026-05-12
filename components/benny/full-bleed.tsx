import type { ReactNode } from "react";

export function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 my-9 w-screen -translate-x-1/2">
      {children}
    </div>
  );
}
