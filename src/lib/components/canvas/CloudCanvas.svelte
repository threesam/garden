<script lang="ts">
  import { dev } from '$app/environment';
  import { cloudShader } from './actions/cloud-shader';

  interface Props {
    /**
     * Flip the strip vertically so the gradient's darker end sits against
     * the page edge ("header" placement). Unmirrored leaves the darker
     * end at the bottom, fitting "footer" placements.
     */
    mirror?: boolean;
  }

  let { mirror = false }: Props = $props();

  const transformStyle = $derived(mirror ? 'scaleY(-1)' : undefined);
</script>

<!--
  Prod: baked WebP (zero JS overhead, optimal 13 KB asset).
  Dev: live WebGL shader via cloudShader action on a 2D-proxy <canvas>.
  SvelteKit's `dev` flag is a build-time constant so the shader branch
  dead-code-eliminates from the production bundle — mirrors the
  process.env.NODE_ENV branch in the original cloud-canvas.tsx.
-->
{#if dev}
  <canvas
    class="absolute inset-0 h-full w-full"
    style={transformStyle ? `transform: ${transformStyle}` : undefined}
    use:cloudShader
  ></canvas>
{:else}
  <!-- Source is already an optimal 13 KB WebP; `object-cover` + fill
       via absolute inset replicates Next.js Image fill + sizes="100vw".
       priority=true on the original → no lazy loading here. -->
  <img
    src="/assets/clouds.webp"
    alt=""
    class="absolute inset-0 h-full w-full object-cover"
    style={transformStyle ? `transform: ${transformStyle}` : undefined}
    fetchpriority="high"
    loading="eager"
  />
{/if}
