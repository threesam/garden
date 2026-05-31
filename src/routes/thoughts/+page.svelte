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
        class="group relative block border-[3px] border-transparent transition-[border-color,transform] duration-700 hover:border-[var(--coin)] hover:[transform:rotate(-1.3deg)]"
      >
        <div class="aspect-[4/5] overflow-hidden">
          <img
            src={card.img}
            alt=""
            loading="lazy"
            class="h-full w-full object-cover [image-rendering:pixelated]"
          />
        </div>
        <div
          class="bg-[var(--white)]/90 px-4 py-4 transition-colors duration-700 group-hover:bg-[var(--coin)] md:px-5 md:py-5"
        >
          <span
            class="block font-mono text-xl font-bold uppercase tracking-[0.3em] text-[var(--black)] md:text-2xl"
          >
            {card.title}
          </span>
          <p
            class="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--black)] md:text-sm"
          >
            {card.description}
          </p>
        </div>
      </a>
    {/each}
  </section>
</main>
