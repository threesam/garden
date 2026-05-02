"use client";

import { useState } from "react";
import { AsciiGallery } from "@/components/ascii/ascii-gallery";
import { DEANA_IMAGES } from "@/components/messages/deana-images";

const CHARS = ["I", "_", "E", "-"];

export function EmojiHero() {
  const [charIdx, setCharIdx] = useState(0);

  return (
    <div className="relative h-[50dvh] w-full overflow-hidden mb-3" style={{ backgroundColor: "var(--white)" }}>
      <AsciiGallery
        srcs={DEANA_IMAGES}
        className="absolute inset-0"
        onIndexChange={(idx) => setCharIdx(idx % CHARS.length)}
      />
      <div className="absolute inset-0 flex items-end justify-start pointer-events-none p-6 md:p-18">
        <h1 className="font-mono text-2xl md:text-5xl font-bold tracking-[0.1em] uppercase text-black">
          D<span className="inline-block w-6 md:w-9 text-center">{CHARS[charIdx]}</span>ANA
        </h1>
      </div>
    </div>
  );
}
