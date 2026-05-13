"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useVideoVisibility } from "@/lib/use-video-visibility";

interface Props {
  src: string;
  poster: string;
  width: number;
  height: number;
  label?: string;
}

function PlayingVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // autoplay=false: only pause/resume if the user is actively watching.
  // A user who clicks play then scrolls away gets a clean pause; if they
  // scroll back, the hook resumes from where they left off.
  useVideoVisibility(ref, { autoplay: false });
  return (
    <video
      ref={ref}
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

export function InlineVideo({ src, poster, width, height, label }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return <PlayingVideo src={src} poster={poster} />;
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
