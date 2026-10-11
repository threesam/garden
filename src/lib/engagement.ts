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
  // What each player is on, and how far into it this play has got, as a
  // percentage. A player that moves to another file starts again.
  const played = new WeakMap<HTMLMediaElement, { src: string; at: number }>();

  // SvelteKit changes page without loading a new document, so a new address
  // is what starts the counts again.
  const turnPage = (): void => {
    if (location.pathname === path) return;
    path = location.pathname;
    depth = 0;
    seconds = 0;
  };

  // Every handler waits for the tracker, which loads after the page does, so
  // nothing reached before it arrives is marked as told and then lost.
  const onScroll = (): void => {
    if (!window.umami) return;
    turnPage();
    const room = document.documentElement.scrollHeight - innerHeight;
    // Less than a screen of scrolling says nothing about reading.
    if (room < innerHeight) return;
    const now = Math.round((scrollY / room) * 100);
    for (const mark of crossed(SCROLL_MARKS, depth, now)) track(`scroll-${String(mark)}`);
    depth = Math.max(depth, now);
  };

  // Only seconds with the page in front of the visitor count.
  // ponytail: looked at once a second, so a mark can be a second out.
  const tick = (): void => {
    if (!window.umami) return;
    turnPage();
    if (document.visibilityState !== 'visible') return;
    seconds += 1;
    if (SECOND_MARKS.includes(seconds)) track(`engaged-${String(seconds)}s`);
  };

  // Media events do not bubble, but the capture phase passes through here on
  // the way down, so one listener hears every video and sound on the site.
  // Muted loops are decoration and are left out.
  // ponytail: a jump forward counts every mark it passes, so `media-75` means
  // "got to 75%", not "sat through 75%". Count watched seconds if that matters.
  const onTime = ({ target: media }: Event): void => {
    if (!window.umami || !(media instanceof HTMLMediaElement)) return;
    if (media.muted || media.paused) return;
    if (!Number.isFinite(media.duration) || media.duration === 0) return;
    const src = media.currentSrc;
    // The file's name, without the folder or the cache stamp.
    const data = { src: src.split(/[?#]/)[0]?.split('/').pop() ?? '' };
    const now = (media.currentTime / media.duration) * 100;
    const last = played.get(media);
    let was = last?.src === src ? last.at : undefined;
    if (was === undefined) {
      track('media-play', data);
      was = 0;
    } else if (was >= END && now < END) {
      track('media-replay', data);
      was = 0;
    }
    for (const mark of crossed(MEDIA_MARKS, was, now)) {
      track(mark === END ? 'media-end' : `media-${String(mark)}`, data);
    }
    played.set(media, { src, at: Math.max(was, now) });
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
