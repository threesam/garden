<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import OutboundTracker from '$lib/components/OutboundTracker.svelte';
  import { PERSON_JSON_LD, WEBSITE_JSON_LD } from '$lib/seo';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Epilogue:wght@400;500;700&display=swap"
  />
  <script
    src="https://analytics.sixtom.com/script.js"
    data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
    async
  ></script>
  {@html `<script type="application/ld+json">${JSON.stringify(PERSON_JSON_LD)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(WEBSITE_JSON_LD)}</script>`}
</svelte:head>

<OutboundTracker />
<Nav />
<div style="background: var(--white)">
  {@render children()}
</div>
