import type { Action } from 'svelte/action';

interface VideoVisibilityOptions {
  /**
   * When true, the video plays as soon as it scrolls into view and
   * pauses whenever it leaves — for background / decorative video that
   * should never spend CPU offscreen, regardless of user state.
   *
   * When false, respects the user's play state: pauses on exit only if
   * currently playing, resumes on re-entry only if it paused *because
   * of visibility*. A manual pause by the user clears the auto-resume
   * bit so a later scroll-in doesn't fight their intent.
   */
  autoplay?: boolean;
}

export const videoVisibility: Action<HTMLVideoElement, VideoVisibilityOptions | undefined> = (
  node,
  options,
) => {
  let autoplay = options?.autoplay ?? false;

  let wasPlaying = false;
  let ourPause = false;

  const onPause = () => {
    if (ourPause) {
      // We triggered this pause from the IO callback — swallow it and
      // leave wasPlaying alone.
      ourPause = false;
      return;
    }
    // User-initiated pause. Clear auto-resume bit so we don't fight
    // their intent on the next scroll-in.
    wasPlaying = false;
  };
  node.addEventListener('pause', onPause);

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) {
        if (autoplay) {
          void node.play().catch(() => undefined);
        } else if (wasPlaying) {
          wasPlaying = false;
          void node.play().catch(() => undefined);
        }
      } else if (!node.paused) {
        ourPause = true;
        if (!autoplay) wasPlaying = true;
        node.pause();
      }
    },
    { threshold: 0 },
  );
  io.observe(node);

  return {
    update(newOptions: VideoVisibilityOptions | undefined) {
      autoplay = newOptions?.autoplay ?? false;
    },
    destroy() {
      node.removeEventListener('pause', onPause);
      io.disconnect();
    },
  };
};
