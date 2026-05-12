"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Fires once per mount when the user scrolls past 90% of the document
// height. Mount only on essay-tier pages where "did they read to the
// bottom" is meaningful engagement — book grids and image timelines
// don't benefit from this signal.
export function ScrollDepth() {
  useEffect(() => {
    let fired = false;
    function onScroll() {
      if (fired) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY / max < 0.9) return;
      fired = true;
      track("scroll-depth-90", { path: window.location.pathname });
      window.removeEventListener("scroll", onScroll);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
