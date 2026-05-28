<script lang="ts">
  import '../app.css';
  // Self-hosted fonts via @fontsource (drops Google Fonts CDN dependency)
  // wght = proportional weight axis (300-1000); mono = MONO axis (proportional↔mono);
  // casl = CASL axis (casual glyphs). slnt is always 0 so omitted.
  import '@fontsource-variable/recursive/wght.css';
  import '@fontsource-variable/recursive/mono.css';
  import '@fontsource-variable/recursive/casl.css';
  import '@fontsource/epilogue/400.css';
  import '@fontsource/epilogue/500.css';
  import '@fontsource/epilogue/700.css';
  import Guide from '$lib/components/frame/Guide.svelte';
  import OutboundTracker from '$lib/components/OutboundTracker.svelte';
  import Anchor from '$lib/components/frame/Anchor.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <script
    src="https://analytics.sixtom.com/script.js"
    data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
    async
  ></script>
</svelte:head>

<OutboundTracker />
<Guide />
<div style="background: var(--white)">
  {@render children()}
</div>
<Anchor />
