"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Delegated click listener at the document root. Captures every left-click
// on an anchor whose href resolves to a different host than the current
// page — covers markdown-rendered links, raw <a> tags, and Next <Link>
// (which renders <a> under the hood). Use capture phase so we still fire
// when an inner handler calls stopPropagation.
export function OutboundTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol)) return;
      if (url.host === window.location.host) return;
      track("outbound-click", {
        host: url.host,
        path: url.pathname,
        from: window.location.pathname,
      });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
