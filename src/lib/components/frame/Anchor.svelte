<script lang="ts">
  import { page } from '$app/stores';
  import LazyMount from '$lib/components/LazyMount.svelte';
  import CloudCanvas from '$lib/components/canvas/CloudCanvas.svelte';
  import BrandSignoff from '$lib/components/frame/BrandSignoff.svelte';

  // Pages where the ambient cloud footer competes with the page's own
  // full-bleed animations / immersive scroll. /thoughts and /sounds are
  // full-viewport WIP pages whose own sketch background fills the screen.
  const HIDE_PREFIXES = ['/anything-but-analog'];
  const EXACT_HIDE = new Set(['/', '/thoughts', '/sounds', '/benny', '/dad']);

  const pathname = $derived($page.url.pathname);

  const hidden = $derived(
    EXACT_HIDE.has(pathname) ||
      HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );
</script>

{#if !hidden}
  <!-- 200px scroll-ahead so the WebGL context warms before the user reaches it -->
  <div class="relative w-full">
    <LazyMount class="relative h-[30dvh] w-full md:h-[50dvh]" rootMargin="200px">
      <CloudCanvas />
    </LazyMount>
    <BrandSignoff />
  </div>
{/if}
