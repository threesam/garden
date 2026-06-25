<script lang="ts">
  import { voronoi } from './actions/voronoi';
  import type { VoronoiParams } from './actions/voronoi';

  type Props = VoronoiParams;

  let {
    invert = false,
    showLetters = true,
    imageSrc,
    mobileImageSrc,
    scale,
    fit = 'contain',
    renderScale = 1,
  }: Props = $props();

  // Canvas starts hidden; the voronoi action fires onReady after the texture
  // upload + first real frame so we can fade in instead of flashing the
  // gradient-cells path while the image decodes.
  let ready = $state(false);

  const params: VoronoiParams = $derived({
    invert,
    showLetters,
    imageSrc,
    mobileImageSrc,
    scale,
    fit,
    renderScale,
    onReady: () => (ready = true),
  });
</script>

<!-- bg-black sits behind the canvas so the pre-ready frames show the warm
     brand dark instead of whatever the container or page happens to be —
     voronoi instances always read as "on dark". object-cover lets the
     canvas crop-fill the container when the buffer aspect ratio doesn't
     match. -->
<div class="absolute inset-0 bg-black">
  <canvas
    class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out"
    style:opacity={ready ? 1 : 0}
    use:voronoi={params}
  ></canvas>
</div>
