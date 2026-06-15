<script lang="ts">
  import { onMount } from 'svelte';
  import VoronoiCanvas from './VoronoiCanvas.svelte';
  import LazyMount from '$lib/components/LazyMount.svelte';

  interface Props {
    src: string;
    alt: string;
    /**
     * Intrinsic aspect ratio (width / height). When supplied the banner box
     * reserves its true shape on first render, so the canvas fades into
     * already-correct space instead of snapping when the bitmap decodes —
     * no CLS. Omit only for assets not in the dimensions map; the onMount
     * fallback below then self-corrects (with the old one-time shift).
     */
    aspect?: number | undefined;
  }

  let { src, alt, aspect: initialAspect }: Props = $props();

  // Resolve order: the precomputed prop → an onload-measured fallback → a
  // last-resort landscape guess (2576/1449) for unmapped assets. Mapped
  // banners get their true shape on first render, so there's no snap.
  let measuredAspect = $state<number | null>(null);
  const aspect = $derived(initialAspect ?? measuredAspect ?? 2576 / 1449);

  onMount(() => {
    if (initialAspect != null) return;
    const img = new Image();
    img.onload = () => { measuredAspect = img.width / img.height; };
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

  const H_CLASSES: Record<'center' | 'right' | 'left', string> = {
    center: 'left-1/2 -translate-x-1/2 text-center',
    right: 'right-6 text-right md:right-20',
    left: 'left-6 md:left-20',
  };
  const hPos = $derived.by(() => {
    if (isCenter) return 'center' as const;
    if (isRight) return 'right' as const;
    return 'left' as const;
  });
  const hClass = $derived(H_CLASSES[hPos]);

  const V_CLASSES: Record<'bottom' | 'middle' | 'top', string> = {
    bottom: 'bottom-6 md:bottom-20',
    middle: 'top-1/2 -translate-y-1/2',
    top: 'top-6 md:top-20',
  };
  const vPos = $derived.by(() => {
    if (isBottom) return 'bottom' as const;
    if (isMiddleVertical) return 'middle' as const;
    return 'top' as const;
  });
  const vClass = $derived(V_CLASSES[vPos]);
</script>

{#if isBanner}
  <div
    class="voronoi-banner"
    style="--banner-aspect: {aspect}"
  >
    <div class="voronoi-banner-inner">
      <!-- Box reserves space immediately; only the WebGL canvas is deferred
           until it scrolls near the viewport (idle-scheduled so six shader
           compiles don't stack into a long task at load). -->
      <LazyMount class="absolute inset-0" rootMargin="200px" useIdle>
        <VoronoiCanvas imageSrc={src} invert showLetters={false} />
      </LazyMount>
      <span
        class="absolute {vClass} {hClass} font-mono text-2xl font-bold uppercase tracking-base md:text-5xl pointer-events-none z-10"
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
    <LazyMount class="absolute inset-0" rootMargin="200px" useIdle>
      <VoronoiCanvas imageSrc={src} invert showLetters={false} />
    </LazyMount>
    {#if alt}
      <span class="sr-only">{alt}</span>
    {/if}
  </div>
{/if}
