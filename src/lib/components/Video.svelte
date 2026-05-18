<script lang="ts">
  import { videoVisibility } from '$lib/actions/video-visibility';

  interface Source {
    src: string;
    type: string;
  }

  interface Track {
    src: string;
    srclang: string;
    label: string;
    kind?: 'subtitles' | 'captions' | 'descriptions';
    default?: boolean;
  }

  interface Props {
    src?: string;
    sources?: Source[];
    tracks?: Track[];
    poster?: string;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsinline?: boolean;
    preload?: '' | 'none' | 'metadata' | 'auto';
    fetchpriority?: 'high' | 'low' | 'auto';
    'aria-label'?: string;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    src,
    sources,
    tracks,
    poster,
    autoplay = false,
    controls = false,
    loop = false,
    muted = false,
    playsinline = false,
    preload = 'metadata',
    fetchpriority,
    'aria-label': ariaLabel,
    class: klass = '',
    children,
  }: Props = $props();

  const effectiveSrc = $derived(sources ? undefined : src);
</script>

<!--
  Drop-in <video> that pauses offscreen via videoVisibility action.
  Pass autoplay for decorative bg video (always syncs to visibility).
  Omit it and the action only pauses/resumes user-initiated playback.
  Accepts either a single src or a sources array for multi-codec
  (webm + mp4 fallback), and an optional tracks array for subtitles.
-->
<!-- fetchpriority is a valid HTML attribute but absent from Svelte's HTMLVideoAttributes -->
<video
  src={effectiveSrc}
  {poster}
  autoplay={autoplay || undefined}
  controls={controls || undefined}
  loop={loop || undefined}
  muted={muted || undefined}
  playsinline={playsinline || undefined}
  {preload}
  {...(fetchpriority ? ({ fetchpriority } as Record<string, string>) : {})}
  aria-label={ariaLabel}
  class={klass}
  use:videoVisibility={{ autoplay }}
>
  {#if sources}
    {#each sources as s (s.src)}
      <source src={s.src} type={s.type} />
    {/each}
  {/if}
  {#if tracks}
    {#each tracks as t (t.src)}
      <track
        src={t.src}
        srclang={t.srclang}
        label={t.label}
        kind={t.kind ?? 'subtitles'}
        default={t.default}
      />
    {/each}
  {/if}
  {#if children}{@render children()}{/if}
</video>
