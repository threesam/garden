"use client";

import { useEffect, useRef, type RefObject } from "react";

interface Options {
  /**
   * When true, the video plays as soon as it scrolls into view and
   * pauses whenever it leaves — for background / decorative video that
   * should never spend CPU offscreen, regardless of user state.
   *
   * When false, the hook respects the user's play state: pauses on
   * exit only if currently playing, resumes on re-entry only if it
   * paused *because of visibility*. A manual pause by the user
   * clears the auto-resume bit so a later scroll-in doesn't fight
   * their intent.
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
  const ourPauseRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPause = () => {
      // If we triggered this pause from the IO callback, the next
      // pause event is ours — swallow it and leave wasPlaying alone.
      if (ourPauseRef.current) {
        ourPauseRef.current = false;
        return;
      }
      // User-initiated pause. Clear the auto-resume bit so we don't
      // fight their intent on the next scroll-in.
      wasPlayingRef.current = false;
    };
    el.addEventListener("pause", onPause);

    const io = new IntersectionObserver(
      ([entry]) => {
        const el = ref.current;
        if (!el) return;
        if (entry.isIntersecting) {
          if (autoplay) {
            void el.play().catch(() => {});
          } else if (wasPlayingRef.current) {
            wasPlayingRef.current = false;
            void el.play().catch(() => {});
          }
        } else if (!el.paused) {
          ourPauseRef.current = true;
          if (!autoplay) wasPlayingRef.current = true;
          el.pause();
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      el.removeEventListener("pause", onPause);
      io.disconnect();
    };
  }, [autoplay, ref]);
}
