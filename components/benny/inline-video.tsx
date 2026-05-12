"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  src: string;
  poster: string;
  width: number;
  height: number;
  label?: string;
}

export function InlineVideo({ src, poster, width, height, label }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        preload="auto"
        className="block w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block w-full overflow-hidden border-0 p-0"
      aria-label={label ?? "play video"}
    >
      <Image
        src={poster}
        alt=""
        width={width}
        height={height}
        sizes="100vw"
        className="block w-full"
        priority={false}
      />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50"
      >
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-[var(--coin)] shadow-2xl md:h-24 md:w-24">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 text-[var(--black)] md:h-12 md:w-12">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
