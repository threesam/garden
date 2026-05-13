"use client";

import { useEffect, useRef, type RefObject } from "react";

interface Options {
  /**
   * When true, the video plays as soon as it scrolls into view and
   * pauses whenever it leaves. Use for background / decorative video
   * that should never spend CPU offscreen.
   *
   * When false, the hook respects the user's play state — it only
   * pauses on exit if the video is already playing, and only resumes
   * on re-entry if it was playing when it left. A video the user
   * never started stays paused.
   */
  autoplay?: boolean;
}

/**
 * Pause offscreen video, resume when it re-enters view. Saves CPU,
 * battery, and bandwidth on long pages where multiple video elements
 * coexist. Tied to the video ref so it works for both shared <Video>
 * wrappers and custom video components with their own UI.
 */
export function useVideoVisibility(
  ref: RefObject<HTMLVideoElement | null>,
  { autoplay = false }: Options = {},
) {
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const el = ref.current;
        if (!el) return;
        if (entry.isIntersecting) {
          if (autoplay || wasPlayingRef.current) {
            void el.play().catch(() => {});
          }
        } else if (!el.paused) {
          wasPlayingRef.current = !autoplay;
          el.pause();
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay, ref]);
}
