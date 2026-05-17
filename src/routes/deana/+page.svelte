<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import LazyMount from "$lib/components/LazyMount.svelte";
  import AsciiImageSection from "$lib/components/messages/AsciiImageSection.svelte";
  import MessageTimeline from "$lib/components/messages/MessageTimeline.svelte";
  import ClockHeatmap from "$lib/components/messages/ClockHeatmap.svelte";
  import LazyWordCloud from "$lib/components/messages/LazyWordCloud.svelte";
  import TotalWords from "$lib/components/messages/TotalWords.svelte";
  import BusiestDay from "$lib/components/messages/BusiestDay.svelte";
  import MostWords from "$lib/components/messages/MostWords.svelte";
  import EmojiMeter from "$lib/components/messages/EmojiMeter.svelte";
  import PetNames from "$lib/components/messages/PetNames.svelte";

  const DEANA_IMAGES = [
    "/assets/deana-6.jpg",
    "/assets/deana-5.webp",
    "/assets/deana-hero-3.webp",
    "/assets/deana-hero.webp",
    "/assets/deana-hero-5.webp",
    "/assets/deana-hero-6.webp",
  ];

  const g = "gap-3 md:gap-6";
</script>

<SeoHead
  title="deana"
  description="102,549 messages. 10 years. One conversation."
  ogImage="/og/deana.png"
  canonical="/deana"
/>

<main style="background-color: var(--white);">
  <AsciiImageSection src={DEANA_IMAGES[0]} />

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <LazyMount>
        <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
          <MessageTimeline />
        </div>
      </LazyMount>
    </div>
  </section>

  <AsciiImageSection src={DEANA_IMAGES[1]} />

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <LazyMount>
        <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
          <ClockHeatmap />
        </div>
      </LazyMount>
    </div>
  </section>

  <AsciiImageSection src={DEANA_IMAGES[2]} />

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <LazyMount>
        <div class="grid grid-cols-1 md:grid-cols-3 {g}">
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 md:col-span-2">
            <LazyWordCloud />
          </div>
          <div class="grid grid-rows-3 {g}">
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              <TotalWords />
            </div>
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              <BusiestDay />
            </div>
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              <MostWords />
            </div>
          </div>
        </div>
      </LazyMount>
    </div>
  </section>

  <AsciiImageSection src={DEANA_IMAGES[3]} />

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <LazyMount>
        <div class="grid grid-cols-1 md:grid-cols-2 {g}">
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
            <EmojiMeter />
          </div>
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
            <PetNames />
          </div>
        </div>
      </LazyMount>
    </div>
  </section>
</main>
