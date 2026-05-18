<script lang="ts">
  import { particleText } from './actions/particle-text';
  import type { ParticleTextParams } from './actions/particle-text';

  interface Props {
    countOverride?: number;
    hideText?: boolean;
    pointSize?: number;
    repelRadius?: number;
    lowDpr?: boolean;
  }

  let {
    countOverride,
    hideText = false,
    pointSize = 1.0,
    repelRadius,
    lowDpr = false,
  }: Props = $props();

  let containerEl: HTMLDivElement | undefined = $state();
  let textCanvasEl: HTMLCanvasElement | undefined = $state();

  const glParams: ParticleTextParams | undefined = $derived(
    containerEl && textCanvasEl
      ? {
          container: containerEl,
          textCanvas: textCanvasEl,
          countOverride,
          hideText,
          pointSize,
          repelRadius,
          lowDpr,
        }
      : undefined
  );
</script>

<div
  bind:this={containerEl}
  class="relative h-full w-full overflow-hidden"
  style="background-color: var(--white)"
>
  <canvas bind:this={textCanvasEl} class="absolute inset-0"></canvas>
  {#if glParams}
    <canvas class="absolute inset-0" use:particleText={glParams}></canvas>
  {/if}
</div>
