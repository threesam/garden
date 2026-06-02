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

<!-- `bg-black` (--black) sits behind the canvas so any uncovered area
     during mount/load shows the warm brand dark instead of whatever
     the container happens to be — voronoi instances always read as
     "on dark". `object-cover` lets the canvas crop-fill the container
     when the pixel buffer aspect ratio doesn't match. -->
<div class="absolute inset-0 bg-black">
  <canvas class="absolute inset-0 h-full w-full object-cover" use:voronoi={params}></canvas>
</div>
