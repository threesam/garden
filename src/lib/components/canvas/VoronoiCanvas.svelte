<script lang="ts">
  import { voronoi } from './actions/voronoi';
  import type { VoronoiParams } from './actions/voronoi';

  interface Props extends VoronoiParams {}

  let {
    invert = false,
    showLetters = true,
    imageSrc,
    mobileImageSrc,
    scale,
    fit = 'contain',
    renderScale = 1,
  }: Props = $props();

  const params: VoronoiParams = $derived({
    invert,
    showLetters,
    imageSrc,
    mobileImageSrc,
    scale,
    fit,
    renderScale,
  });
</script>

<canvas class="absolute inset-0 h-full w-full" use:voronoi={params}></canvas>
