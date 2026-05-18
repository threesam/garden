<script lang="ts">
  import type { BennyPlaylist } from '$lib/benny/playlists';
  import LazyMount from '$lib/components/LazyMount.svelte';

  interface Props {
    playlists: BennyPlaylist[];
  }

  let { playlists }: Props = $props();

  const CARD_HEIGHT = 380;
</script>

<div class="relative">
  <div
    class="flex snap-x snap-mandatory overflow-x-auto scroll-pl-6 pb-3 pr-6 [scrollbar-color:var(--coin)_transparent] [scrollbar-width:thin] md:scroll-pl-9 md:pr-9"
  >
    {#each playlists as p (p.id)}
      <div
        class="ml-6 flex-[0_0_69vw] snap-start overflow-hidden rounded-xl bg-zinc-800 md:ml-9 md:flex-[0_0_352px]"
        style="height: {CARD_HEIGHT}px"
      >
        <LazyMount rootMargin="200px" class="h-full w-full">
          <iframe
            src="https://open.spotify.com/embed/playlist/{p.id}?theme=0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title={p.name}
            class="block h-full w-full border-0"
          ></iframe>
        </LazyMount>
      </div>
    {/each}
  </div>
</div>
