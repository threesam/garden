<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { articleNode } from "$lib/seo";
  import { BENNY_PLAYLISTS } from "$lib/benny/playlists";
  import Video from "$lib/components/Video.svelte";
  import SixToMidnightBanner from "$lib/components/benny/SixToMidnightBanner.svelte";
  import SoundcloudSlider from "$lib/components/benny/SoundcloudSlider.svelte";
  import BennyPhotoMosaic from "$lib/components/benny/BennyPhotoMosaic.svelte";
  import PlaylistSlider from "$lib/components/benny/PlaylistSlider.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { parts } = $derived(data);
</script>

<SeoHead
  title="benny"
  description="remembering 102 jackson street."
  ogImage="/og/benny.png"
  canonical="/benny"
  preloadImage="/assets/sixtomidnight-tribute-poster.jpg"
  ogType="article"
  schema={articleNode({
    path: "/benny",
    headline: "benny — remembering 102 Jackson Street",
    image: "/og/benny.png",
  })}
/>

<main class="min-h-screen bg-[var(--black)]" style="color: var(--white);">
  <section class="relative grid min-h-[80vh] place-content-center overflow-hidden text-center">
    <Video
      autoplay
      loop
      muted
      playsinline
      preload="metadata"
      fetchpriority="high"
      poster="/assets/sixtomidnight-tribute-poster.jpg"
      class="absolute inset-0 h-full w-full object-cover opacity-50"
      aria-label="six to midnight productions montage"
      sources={[
        { src: "/assets/sixtomidnight-tribute.webm", type: "video/webm" },
        { src: "/assets/sixtomidnight-tribute.mp4", type: "video/mp4" },
      ]}
    />
    <div class="relative z-10 px-6">
      <h2 class="font-mono text-sm uppercase tracking-[0.22em] text-[var(--coin)] md:text-base">
        remembering
      </h2>
      <h1
        class="mt-3 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:text-6xl"
        style="color: var(--white);"
      >
        102 Jackson Street
      </h1>
    </div>
  </section>

  <SixToMidnightBanner />

  {#if parts}
    <section>
      <div class="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
        {#each parts as part, i (i)}
          {#if part.type === "html"}
            {@html part.html}
          {:else if part.name === "soundcloud"}
            <div class="relative left-1/2 my-9 w-screen -translate-x-1/2">
              <SoundcloudSlider />
            </div>
          {:else if part.name === "video"}
            <div class="relative left-1/2 my-9 w-screen -translate-x-1/2">
              <video
                controls
                preload="metadata"
                poster="/assets/benny/the_podcast-poster.jpg"
                class="w-full aspect-video block"
                aria-label="play the podcast"
              >
                <source src="/assets/benny/the_podcast.mp4" type="video/mp4" />
                <track kind="subtitles" src="/assets/benny/the_podcast.vtt" srclang="en" label="English" default />
              </video>
            </div>
          {:else if part.name === "photo-mosaic"}
            <div class="relative left-1/2 my-9 w-screen -translate-x-1/2">
              <BennyPhotoMosaic />
            </div>
          {:else if part.name === "playlists"}
            <div class="relative left-1/2 my-9 w-screen -translate-x-1/2">
              <PlaylistSlider playlists={BENNY_PLAYLISTS} />
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <section class="border-t border-zinc-800 py-18 md:py-24">
    <div class="mx-auto max-w-3xl px-6 md:px-9">
      <p class="mb-9 font-mono text-xs uppercase tracking-[0.22em] text-[var(--coin)] md:text-sm">
        // archived · sixtomidnightproductions
      </p>
      <div class="flex items-center gap-9 md:gap-12">
        <a
          href="https://www.facebook.com/pages/Six-to-Midnight-Production-Studios/166143110389253"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Six to Midnight on Facebook"
          class="text-zinc-500 transition-colors duration-300 hover:text-[var(--coin)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            class="h-16 w-16 md:h-24 md:w-24"
          >
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/sixtomidnightproductions"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Six to Midnight on Instagram"
          class="text-zinc-500 transition-colors duration-300 hover:text-[var(--coin)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            class="h-16 w-16 md:h-24 md:w-24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.011 3.584-.069 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163Zm0 1.802c-3.141 0-3.5.012-4.732.069-1.018.046-1.926.21-2.633.917-.708.708-.871 1.616-.917 2.633C3.66 8.5 3.648 8.859 3.648 12c0 3.141.012 3.5.069 4.732.046 1.018.21 1.926.917 2.633.708.708 1.616.871 2.633.917 1.232.057 1.591.069 4.732.069s3.5-.012 4.732-.069c1.018-.046 1.926-.21 2.633-.917.708-.708.871-1.616.917-2.633.057-1.232.069-1.591.069-4.732s-.012-3.5-.069-4.732c-.046-1.018-.21-1.926-.917-2.633-.708-.708-1.616-.871-2.633-.917C15.5 3.977 15.141 3.965 12 3.965Zm0 3.063A4.973 4.973 0 1 0 12 17a4.973 4.973 0 0 0 0-9.972Zm0 8.205a3.232 3.232 0 1 1 0-6.464 3.232 3.232 0 0 1 0 6.464ZM18.406 6.78a1.163 1.163 0 1 0-.001-2.327 1.163 1.163 0 0 0 .001 2.327Z" />
          </svg>
        </a>
      </div>
    </div>
  </section>
</main>
