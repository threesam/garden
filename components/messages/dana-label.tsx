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
    <>D<span className="inline-block w-6 text-center">{CHARS[idx]}</span>ANA</>
  );
}
