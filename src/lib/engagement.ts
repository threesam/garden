// What a visitor did with a page after it loaded: how far down they got, how
// long it was in front of them, what they played and where they left for.
// Every mark is its own event name, so umami's journey and funnel reports can
// read them in order.
//
// The same file runs on threesam.com, sixtom.com and pyredivers.com. Change
// one, change all three.

const SCROLL_MARKS = [25, 50, 75, 100];
const SECOND_MARKS = [10, 30, 60, 180];
// A looping video goes back to the start without ever saying it ended, so
// getting this far counts as the end.
const END = 95;
const MEDIA_MARKS = [25, 50, 75, END];

/** The marks passed on the way from one reading up to the next. */
export const crossed = (marks: readonly number[], from: number, to: number): number[] =>
  marks.filter((mark) => mark > from && mark <= to);

const track = (name: string, data?: Record<string, string>): void => {
  window.umami?.track(name, data);
};

/** Start watching. Mount once per site: `onMount(watchEngagement)`. */
export function watchEngagement(): () => void {
  let path = location.pathname;
  let depth = 0;
  let seconds = 0;
  // How far into each video or sound this play has got, as a percentage.
  const played = new WeakMap<HTMLMediaElement, number>();

  // SvelteKit changes page without loading a new document, so a new address
  // is what starts the counts again.
  const turnPage = (): void => {
    if (location.pathname === path) return;
    path = location.pathname;
    depth = 0;
    seconds = 0;
  };

  const onScroll = (): void => {
    turnPage();
    const room = document.documentElement.scrollHeight - innerHeight;
    // Less than a screen of scrolling says nothing about reading.
    if (room < innerHeight) return;
    const now = Math.round((scrollY / room) * 100);
    for (const mark of crossed(SCROLL_MARKS, depth, now)) track(`scroll-${mark}`);
    depth = Math.max(depth, now);
  };

  // Only seconds with the page in front of the visitor count.
  const tick = (): void => {
    turnPage();
    if (document.visibilityState !== 'visible') return;
    seconds += 1;
    if (SECOND_MARKS.includes(seconds)) track(`engaged-${seconds}s`);
  };

  // Media events do not bubble, but the capture phase passes through here on
  // the way down, so one listener hears every video and sound on the site.
  // Muted loops are decoration and are left out.
  // ponytail: a jump forward counts every mark it passes, so `media-75` means
  // "got to 75%", not "sat through 75%". Count watched seconds if that matters.
  const onTime = ({ target: media }: Event): void => {
    if (!(media instanceof HTMLMediaElement) || media.muted || media.paused) return;
    if (!Number.isFinite(media.duration) || media.duration === 0) return;
    const data = { src: new URL(media.currentSrc).pathname.split('/').pop() ?? '' };
    const now = (media.currentTime / media.duration) * 100;
    let was = played.get(media);
    if (was === undefined) {
      track('media-play', data);
      was = 0;
    } else if (was >= END && now < END) {
      track('media-replay', data);
      was = 0;
    }
    for (const mark of crossed(MEDIA_MARKS, was, now)) {
      track(mark === END ? 'media-end' : `media-${mark}`, data);
    }
    played.set(media, Math.max(was, now));
  };

  // Capture phase so an inner stopPropagation can't hide the click. Both click
  // and auxclick, because a middle click to open a new tab fires only auxclick.
  const onClick = (event: MouseEvent): void => {
    if (event.button !== 0 && event.button !== 1) return;
    const anchor = (event.target as Element | null)?.closest('a');
    if (!anchor?.href.startsWith('http') || anchor.origin === location.origin) return;
    track('outbound-click', { host: anchor.host, path: anchor.pathname, from: location.pathname });
  };

  const off = new AbortController();
  const timer = setInterval(tick, 1000);
  addEventListener('scroll', onScroll, { passive: true, signal: off.signal });
  document.addEventListener('timeupdate', onTime, { capture: true, signal: off.signal });
  document.addEventListener('click', onClick, { capture: true, signal: off.signal });
  document.addEventListener('auxclick', onClick, { capture: true, signal: off.signal });
  return () => {
    clearInterval(timer);
    off.abort();
  };
}
