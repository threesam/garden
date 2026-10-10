import type { Action } from 'svelte/action';

interface VideoVisibilityOptions {
  /**
   * When true, the video plays as soon as it scrolls into view and
   * pauses whenever it leaves, so it never spends CPU offscreen. If the
   * video has controls and the reader pauses it, it stays paused until
   * they press play. Turning this off while a clip plays stops the clip.
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
  // The reader pressed pause: autoplay leaves the clip alone until they
  // press play again.
  let held = false;

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
    held = true;
  };
  const onPlay = () => {
    held = false;
  };
  node.addEventListener('pause', onPause);
  node.addEventListener('play', onPlay);

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) {
        if (autoplay) {
          if (!held) void node.play().catch(() => undefined);
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
      const next = newOptions?.autoplay ?? false;
      // Autoplay withdrawn (reduced motion switched on): stop what it started.
      if (autoplay && !next && !node.paused) {
        ourPause = true;
        node.pause();
      }
      // A resume owed under the old mode is not owed under the new one.
      if (autoplay !== next) wasPlaying = false;
      autoplay = next;
    },
    destroy() {
      node.removeEventListener('pause', onPause);
      node.removeEventListener('play', onPlay);
      io.disconnect();
    },
  };
};
