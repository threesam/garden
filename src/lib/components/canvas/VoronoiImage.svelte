<script lang="ts">
  import { onMount } from 'svelte';
  import VoronoiCanvas from './VoronoiCanvas.svelte';

  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();

  let aspect = $state(2576 / 1449);

  onMount(() => {
    const img = new Image();
    img.onload = () => { aspect = img.width / img.height; };
    img.src = src;
  });

  const isBanner = $derived(alt.includes('|'));

  // Banner parsing — split once and derive the layout values
  const parts = $derived(isBanner ? alt.split('|') : []);
  const heading = $derived(isBanner ? (parts[0]?.trim() ?? '').replace(/\\n/g, '\n') : '');
  const color = $derived(isBanner ? (parts[1]?.trim() || 'white') : 'white');
  const pos = $derived(isBanner ? (parts[2]?.trim() || 'left') : 'left');

  const isBottom = $derived(pos.startsWith('bottom'));
  const isMiddleVertical = $derived(pos === 'center');
  const isRight = $derived(pos.includes('right'));
  const isCenter = $derived(pos.includes('center'));

  const hClass = $derived(
    isCenter
      ? 'left-1/2 -translate-x-1/2 text-center'
      : isRight
        ? 'right-6 text-right md:right-20'
        : 'left-6 md:left-20'
  );

  const vClass = $derived(
    isBottom
      ? 'bottom-6 md:bottom-20'
      : isMiddleVertical
        ? 'top-1/2 -translate-y-1/2'
        : 'top-6 md:top-20'
  );
</script>

{#if isBanner}
  <div
    class="voronoi-banner"
    style="--banner-aspect: {aspect}"
  >
    <div class="voronoi-banner-inner">
      <VoronoiCanvas imageSrc={src} invert showLetters={false} />
      <span
        class="absolute {vClass} {hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl pointer-events-none z-10"
        style="color: {color}; white-space: pre-line"
      >
        {heading}
      </span>
    </div>
  </div>
{:else}
  <div
    class="relative my-9 -mx-6 w-full overflow-hidden rounded-lg md:-mx-9"
    style="aspect-ratio: {aspect}"
  >
    <VoronoiCanvas imageSrc={src} invert showLetters={false} />
    {#if alt}
      <span class="sr-only">{alt}</span>
    {/if}
  </div>
{/if}
