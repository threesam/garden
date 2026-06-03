<script lang="ts">
  import { metaball } from './actions/metaball';
  import type { MetaballParams } from './actions/metaball';

  interface Props extends MetaballParams {}

  let {
    color = [0.1, 0.1, 0.08],
    trackCursor = true,
    target = null,
    lowDpr = false,
  }: Props = $props();

  const params: MetaballParams = $derived({ color, trackCursor, target, lowDpr });
</script>

<canvas class="absolute inset-0 h-full w-full" use:metaball={params}></canvas>
