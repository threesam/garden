<script lang="ts">
  import { onMount } from "svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import SketchHost from "$lib/components/art/SketchHost.svelte";
  import { sketchMode } from "$lib/art/sketch-mode";
  import { blogNode } from "$lib/seo";

  // /thoughts opts the bg sketch into its tinted mode for the duration
  // of this route. The homepage gallery leaves `active` off so its
  // day30 card keeps the original neutral grays.
  //
  // Hover triggers two parallel 3s transitions:
  //   - the card back face fades bg-white -> bg-coin via group-hover CSS
  //   - the sketch's currentSlow ramps 0 -> 1 (day30 lerps at 1/180 per
  //     frame, also 3s at 60fps)
  //
  // hoverCount survives mouseleave-A → mouseenter-B between adjacent
  // cards; the microtask deferral on leave catches the same handoff so
  // we don't tear sketchMode.slow down for one frame.
  let hoverCount = 0;

  // Defer mounting the day30 walker sketch until after first paint —
  // its 140-walker tick (curl noise + collision avoidance + per-walker
  // strokeRects) was burning ~1.9s of TBT on Lighthouse before LCP
  // landed. Pushing the mount to onMount + a requestAnimationFrame
  // means the static bg paints first, then the canvas spins up.
  let bgMounted = $state(false);

  $effect(() => {
    sketchMode.active = true;
    return () => {
      sketchMode.active = false;
      sketchMode.slow = 0;
    };
  });

  onMount(() => {
    requestAnimationFrame(() => {
      bgMounted = true;
    });
  });

  function enterCard() {
    hoverCount++;
    sketchMode.slow = 1;
  }
  function leaveCard() {
    hoverCount--;
    if (hoverCount <= 0) {
      hoverCount = 0;
      queueMicrotask(() => {
        if (hoverCount > 0) return;
        sketchMode.slow = 0;
      });
    }
  }

  // ?v=N busts the immutable 1-year cache when we re-bake the source
  // (covers iOS Safari, which won't even check the server otherwise).
  // Bump the version every time you change generate-thoughts-pixel.mjs.
  const PIXEL_V = 3;
  const cards = [
    {
      href: "/thoughts/the-peach",
      title: "the peach",
      description: "you have to taste it first.",
      img: `/assets/thoughts-pixel/the-peach.webp?v=${PIXEL_V}`,
    },
    {
      href: "/thoughts/certainly-uncertain",
      title: "certainly uncertain",
      description: "crush the chips.",
      img: `/assets/thoughts-pixel/certainly-uncertain.webp?v=${PIXEL_V}`,
    },
    {
      href: "/self",
      title: "self",
      description: "growing up in trenton.",
      img: `/assets/thoughts-pixel/self.webp?v=${PIXEL_V}`,
    },
    {
      href: "/benny",
      title: "benny",
      description: "remembering 102 jackson street.",
      img: `/assets/thoughts-pixel/benny.webp?v=${PIXEL_V}`,
    },
    {
      href: "/dad",
      title: "dad",
      description: "stories about my dad.",
      img: `/assets/thoughts-pixel/dad.webp?v=${PIXEL_V}`,
    },
  ];
</script>

<SeoHead
  title="thoughts"
  description="stories and thoughts."
  canonical="/thoughts"
  schema={blogNode({
    path: "/thoughts",
    name: "thoughts — threesam",
  })}
/>

<main
  class="relative min-h-dvh w-full overflow-hidden bg-black px-6 py-18 md:px-9 md:py-24"
>
  <div class="pointer-events-none absolute inset-0 z-0">
    {#if bgMounted}
      <SketchHost slug="30" active interactive={false} bgClass="bg-black" />
    {/if}
  </div>

  <header class="relative z-10 mx-auto mb-12 max-w-7xl md:mb-18">
    <h1
      class="font-mono text-4xl font-bold uppercase tracking-hero text-white md:text-7xl"
    >
      thoughts
    </h1>
  </header>
  <section
    class="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-9"
  >
    {#each cards as card (card.href)}
      <a
        href={card.href}
        onmouseenter={enterCard}
        onmouseleave={leaveCard}
        onclick={() => window.umami?.track("thoughts-card-click", { href: card.href })}
        class="group relative block transition-transform duration-700 hover:[transform:rotate(-1.3deg)]"
      >
        <!-- mobile: image-fills card, bottom-left white title + description over a dark→transparent fade -->
        <div class="relative aspect-[4/5] overflow-hidden rounded-2xl md:hidden">
          <img
            src={card.img}
            alt=""
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
          ></div>
          <div class="absolute right-4 bottom-4 left-4">
            <span
              class="block font-mono text-xl font-bold uppercase tracking-pill text-white"
            >
              {card.title}
            </span>
            <p
              class="mt-1.5 font-mono text-xs uppercase tracking-meta text-white"
            >
              {card.description}
            </p>
          </div>
        </div>

        <!-- desktop: image-only front; hover flips to a (white→coin) back with title + description.
             Each face carries its own rounded-2xl + overflow-hidden — the outer
             clip doesn't reliably apply to 3D-transformed children, so the back
             face was escaping the rounded corner during the flip. -->
        <div class="hidden aspect-[4/5] [perspective:1200px] md:block">
          <div
            class="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
          >
            <div class="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
              <img
                src={card.img}
                alt=""
                loading="lazy"
                class="h-full w-full object-cover [image-rendering:pixelated]"
              />
            </div>
            <div
              class="absolute inset-0 flex flex-col justify-center overflow-hidden rounded-2xl bg-white p-6 transition-colors duration-[3000ms] group-hover:bg-coin [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              <span
                class="block font-mono text-2xl font-bold uppercase tracking-pill text-black"
              >
                {card.title}
              </span>
              <p
                class="mt-3 font-mono text-sm uppercase tracking-meta text-black"
              >
                {card.description}
              </p>
            </div>
          </div>
        </div>
      </a>
    {/each}
  </section>
</main>
