"use client";

import { useEffect, useState } from "react";
import { AsciiImage } from "./ascii-image";

const SRCS = ["/assets/deana-6.jpg", "/assets/deana-5.png", "/assets/deana-hero-3.png", "/assets/deana-hero.png", "/assets/deana-hero-5.png"];
const CHARS = ["I", "_", "E", "-"];

export function EmojiHero() {
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCharIdx((i) => (i + 1) % CHARS.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[50dvh] w-full overflow-hidden mb-3 md:mb-4" style={{ backgroundColor: "var(--white)" }}>
      <AsciiImage srcs={SRCS} className="absolute inset-0" />
      <div className="absolute inset-0 flex items-end justify-start pointer-events-none p-6 md:p-20">
        <h1 className="font-mono text-2xl md:text-5xl font-bold tracking-[0.1em] uppercase text-black">
          D<span className="inline-block w-6 md:w-10 text-center">{CHARS[charIdx]}</span>ANA
        </h1>
      </div>
    </div>
  );
}
