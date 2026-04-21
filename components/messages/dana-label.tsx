"use client";

import { useEffect, useState } from "react";

const CHARS = ["I", "_", "E", "-"];

export function DanaLabel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % CHARS.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      D
      {/* em-based slot so the middle letter scales with whatever font size
          DanaLabel is rendered at — the old `w-6` (24px fixed) worked at
          small sizes but collapsed against the D / ANA at md:text-5xl. */}
      <span className="inline-block w-[0.9em] text-center">{CHARS[idx]}</span>
      ANA
    </>
  );
}
