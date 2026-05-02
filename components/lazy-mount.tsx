"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * Minimum height reserved while the child isn't yet mounted. Prefer not
   * setting this when the parent already reserves space (e.g. a
   * `min-h-dvh` section). Default: no reserved height.
   */
  placeholderMinHeight?: string;
  /** How early to mount before visible. Config — not a dep. */
  rootMargin?: string;
  /** Optional class on the wrapping div. */
  className?: string;
}

/**
 * Defers mounting of its children until the wrapper scrolls near the
 * viewport. Disconnects the IntersectionObserver after first mount so the
 * children stay mounted thereafter (unlike a virtualizer). Useful when a
 * page stacks many content blocks that each do heavy work on mount and
 * you want time-to-interactive to stay cheap.
 */
export function LazyMount({
  children,
  placeholderMinHeight,
  rootMargin = "400px",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Snapshot config into a ref so prop identity changes don't re-init the IO.
  const rootMarginRef = useRef(rootMargin);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: rootMarginRef.current }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={mounted || !placeholderMinHeight ? undefined : { minHeight: placeholderMinHeight }}
    >
      {mounted ? children : null}
    </div>
  );
}
