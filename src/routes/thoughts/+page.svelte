<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import SketchHost from "$lib/components/art/SketchHost.svelte";
  import { blogNode } from "$lib/seo";

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
  class="relative min-h-dvh w-full overflow-hidden bg-[var(--black)] px-6 py-18 md:px-9 md:py-24"
>
  <div class="pointer-events-none absolute inset-0 z-0">
    <SketchHost slug="30" active interactive={false} bgClass="bg-[var(--black)]" />
  </div>

  <header class="relative z-10 mx-auto mb-12 max-w-7xl md:mb-18">
    <h1
      class="font-mono text-4xl font-bold uppercase tracking-[0.2em] text-[var(--white)] md:text-7xl"
    >
      thoughts
    </h1>
  </header>
  <section
    class="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-9"
  >
    {#each cards as card (card.href)}
      <a
        href={card.href}
        class="group relative block aspect-[4/5] border-2 border-[var(--black)] transition-[border-color,transform] duration-700 hover:border-[var(--coin)] hover:[transform:rotate(-1.3deg)]"
      >
        <div class="absolute inset-x-0 top-0 h-[70%] overflow-hidden">
          <img
            src={card.img}
            alt=""
            loading="lazy"
            class="h-full w-full object-cover [image-rendering:pixelated]"
          />
        </div>
        <div class="absolute inset-x-0 bottom-0 h-[30%] px-3 py-3">
          <span
            class="inline-block bg-black/70 p-3 font-mono text-xl font-bold uppercase tracking-[0.3em] text-[var(--white)] transition-colors duration-300 group-hover:text-[var(--coin)] md:text-2xl"
          >
            {card.title}
          </span>
          <p
            class="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-zinc-300 md:text-sm"
          >
            {card.description}
          </p>
        </div>
      </a>
    {/each}
  </section>
</main>
