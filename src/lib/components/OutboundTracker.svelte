<script lang="ts">
  import { onMount } from 'svelte';

  // Capture phase so an inner stopPropagation can't hide the click; both
  // click and auxclick are bound because modern browsers fire auxclick
  // (not click) for middle-click "open in new tab" on button=1.
  onMount(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 && event.button !== 1) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.href;
      if (!href.startsWith('http:') && !href.startsWith('https:')) return;
      if (anchor.origin === window.location.origin) return;
      window.umami?.track('outbound-click', {
        host: anchor.host,
        path: anchor.pathname,
        from: window.location.pathname,
      });
    }
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
    };
  });
</script>
