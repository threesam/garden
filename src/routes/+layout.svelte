<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  // Self-hosted fonts via @fontsource (drops Google Fonts CDN dependency)
  // wght = proportional weight axis (300-1000); mono = MONO axis (proportional↔mono);
  // casl = CASL axis (casual glyphs). slnt is always 0 so omitted.
  import '@fontsource-variable/recursive/wght.css';
  import '@fontsource-variable/recursive/mono.css';
  import '@fontsource-variable/recursive/casl.css';
  // Epilogue (used inside .tier-essay on /self and /dad) is imported by
  // those routes directly so the other 7 pages don't ship 3 unused
  // weight files. See src/lib/fonts/epilogue.ts.
  import Guide from '$lib/components/frame/Guide.svelte';
  import OutboundTracker from '$lib/components/OutboundTracker.svelte';
  import Anchor from '$lib/components/frame/Anchor.svelte';
  import { diveMode } from '$lib/dive-mode.svelte';

  let { children }: { children: import('svelte').Snippet } = $props();

  // Analytics only fire on the canonical prod host(s). Vercel preview URLs
  // and local dev see no tracker — so feature work, link checks, and
  // automated runs don't pollute the dashboard. Hostname check happens
  // post-hydration (prerendered HTML is identical across hosts).
  // Both apex and www serve live 200s (no redirect between them — verified
  // via curl), so both must be allowlisted or www visitors go untracked.
  onMount(() => {
    if (!['threesam.com', 'www.threesam.com'].includes(location.hostname)) return;
    const preconnect = Object.assign(document.createElement('link'), {
      rel: 'preconnect',
      href: 'https://analytics.sixtom.com',
      crossOrigin: 'anonymous',
    });
    const script = Object.assign(document.createElement('script'), {
      src: 'https://analytics.sixtom.com/script.js',
      async: true,
    });
    script.dataset['websiteId'] = '2a502ffa-58a1-4057-be13-e46f0354cfb7';
    document.head.append(preconnect, script);
  });
</script>

<OutboundTracker />
<!-- the guide coin leaves with everything else during the dive send-off;
     wrapper (not Guide itself) so the fade composes with its own state -->
<div class="guide-slot" class:diving-away={diveMode.leaving}>
  <Guide />
</div>
<div class="bg-white">
  {@render children()}
</div>
<Anchor />

<style>
  .guide-slot.diving-away {
    opacity: 0;
    transition: opacity 1s ease;
    pointer-events: none;
  }
</style>
