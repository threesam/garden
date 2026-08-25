<script lang="ts">
  import { page } from '$app/state';
  import CloudCanvas from '$lib/components/canvas/CloudCanvas.svelte';
</script>

<!--
  The clouds live here now. They were an ambient footer under every page, where
  they only ever read as a seam against the dark; a dead end is the one place
  the image has something to say.
-->
<main class="relative flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-white">
  <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[55dvh]">
    <CloudCanvas />
    <!-- Blend the top of the strip into the page instead of butting the
         image's lighter edge against black. -->
    <div class="cloud-fade absolute inset-x-0 top-0" aria-hidden="true"></div>
  </div>

  <div class="relative z-10 flex flex-col items-center gap-6">
    <div class="font-mono text-xs uppercase tracking-pill text-coin">
      {page.status === 404 ? '404' : page.status}
    </div>
    <h1 class="text-3xl font-bold leading-tight md:text-4xl">
      {page.status === 404 ? 'nothing here.' : (page.error?.message ?? 'something broke.')}
    </h1>
    <a
      href="/"
      class="font-mono text-xs uppercase tracking-hero text-coin underline underline-offset-4 transition-opacity hover:opacity-70"
    >
      back home
    </a>
  </div>
</main>

<style>
  .cloud-fade {
    height: 40%;
    background: linear-gradient(to bottom, #000, transparent);
  }
</style>
