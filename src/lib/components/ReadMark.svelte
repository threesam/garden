<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // Drop after an essay's body: fires `essay-read` once per page view when the
  // end of the essay scrolls into view, so umami counts finishes, not opens.
  // ponytail: reaching the end counts however fast; add a dwell threshold if
  // skimmers swamp the numbers.
  const markRead: Attachment<HTMLElement> = (node) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const path = window.location.pathname;
      const track = () => {
        window.umami?.track('essay-read', { path });
      };
      // The layout injects umami async; a finish before it loads waits for it.
      if (window.umami) {
        track();
      } else {
        document
          .querySelector('script[data-website-id]')
          ?.addEventListener('load', track, { once: true });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  };
</script>

<div data-read-mark aria-hidden="true" {@attach markRead}></div>
