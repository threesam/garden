<script lang="ts">
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

  let { children } = $props();
</script>

<svelte:head>
  <!-- Warm the TCP+TLS handshake to the analytics origin so the async
       script tag below doesn't pay that latency on cold visits. -->
  <link rel="preconnect" href="https://analytics.sixtom.com" crossorigin />
  <link rel="dns-prefetch" href="https://analytics.sixtom.com" />
  <script
    src="https://analytics.sixtom.com/script.js"
    data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
    async
  ></script>
</svelte:head>

<OutboundTracker />
<Guide />
<div class="bg-white">
  {@render children()}
</div>
<Anchor />
