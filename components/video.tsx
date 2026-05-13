"use client";

import { useRef } from "react";
import { useVideoVisibility } from "@/lib/use-video-visibility";

interface Source {
  src: string;
  type: string;
}

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & {
  sources?: Source[];
};

// Drop-in <video> replacement that pauses offscreen via
// useVideoVisibility. Pass `autoPlay` for decorative bg video that
// should always sync to visibility; omit it and the hook only
// pauses/resumes user-initiated playback. Accepts either a single
// `src` or a `sources` array for multi-codec (webm + mp4 fallback).
export function Video({ sources, autoPlay, src, children, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useVideoVisibility(ref, { autoplay: !!autoPlay });

  return (
    <video ref={ref} autoPlay={autoPlay} src={sources ? undefined : src} {...rest}>
      {sources?.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
      {children}
    </video>
  );
}
