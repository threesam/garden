<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import SketchHost from "$lib/components/art/SketchHost.svelte";
  import { sketchMode } from "$lib/art/sketch-mode";
  import { blogNode } from "$lib/seo";

  // The drain only begins after the card's 3D flip is fully painted.
  // Instead of guessing the duration we listen for the actual
  // `transitionend` of the flip's transform — guarantees we never start
  // mid-flip, even if the browser delays the first frame.
  //
  // hoverCount survives mouseleave-A → mouseenter-B; the microtask
  // deferral on leave catches the same handoff so we don't tear the
  // pending drain down between adjacent cards.
  let hoverCount = 0;

  function enterCard() {
    hoverCount++;
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
  function onSectionTransitionEnd(e: TransitionEvent) {
    // Only the card outer + inner flip transition `transform`. Both end
    // at the same paint; the first one to fire is enough.
    if (e.propertyName !== "transform") return;
    if (hoverCount === 0) return;
    if (sketchMode.slow === 1) return;
    sketchMode.slow = 1;
  }

  const cards = [
    {
      href: "/self",
      title: "self",
      description: "growing up in trenton.",
      img: "/assets/thoughts-pixel/self.webp",
    },
    {
      href: "/benny",
      title: "benny",
      description: "remembering 102 jackson street.",
      img: "/assets/thoughts-pixel/benny.webp",
    },
    {
      href: "/dad",
      title: "dad",
      description: "stories about my dad.",
      img: "/assets/thoughts-pixel/dad.webp",
    },
  ];
</script>

<SeoHead
  title="thoughts"
  description="essays."
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
    <SketchHost slug="30" active interactive={false} bgClass="bg-black" />
  </div>

  <header class="relative z-10 mx-auto mb-12 max-w-7xl md:mb-18">
    <h1
      class="font-mono text-4xl font-bold uppercase tracking-[0.2em] text-white md:text-7xl"
    >
      thoughts
    </h1>
  </header>
  <section
    ontransitionend={onSectionTransitionEnd}
    class="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-9"
  >
    {#each cards as card (card.href)}
      <a
        href={card.href}
        onmouseenter={enterCard}
        onmouseleave={leaveCard}
        class="group relative block transition-transform duration-700 hover:[transform:rotate(-1.3deg)]"
      >
        <!-- mobile: polaroid (cream card, image padded matching the text padding below) -->
        <div class="bg-white p-4 md:hidden">
          <div class="aspect-[4/5] overflow-hidden">
            <img
              src={card.img}
              alt=""
              loading="lazy"
              class="h-full w-full object-cover [image-rendering:pixelated]"
            />
          </div>
          <div class="mt-4">
            <span
              class="block font-mono text-xl font-bold uppercase tracking-[0.3em] text-black"
            >
              {card.title}
            </span>
            <p
              class="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-black"
            >
              {card.description}
            </p>
          </div>
        </div>

        <!-- desktop: image-only front; hover flips to a coin back with title + description -->
        <div class="hidden aspect-[4/5] [perspective:1200px] md:block">
          <div
            class="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
          >
            <div class="absolute inset-0 overflow-hidden [backface-visibility:hidden]">
              <img
                src={card.img}
                alt=""
                loading="lazy"
                class="h-full w-full object-cover [image-rendering:pixelated]"
              />
            </div>
            <div
              class="absolute inset-0 flex flex-col justify-center bg-coin p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              <span
                class="block font-mono text-2xl font-bold uppercase tracking-[0.3em] text-black"
              >
                {card.title}
              </span>
              <p
                class="mt-3 font-mono text-sm uppercase tracking-[0.15em] text-black"
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
