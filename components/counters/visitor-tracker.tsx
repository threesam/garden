"use client";

import { useEffect } from "react";

const VISIT_KEY = "threesam-visit-v1";

export function VisitorTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(VISIT_KEY)) return;

    window.localStorage.setItem(VISIT_KEY, "1");
    void fetch("/api/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "visitor" }),
    });
  }, []);

  return null;
}
