<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import LazyMount from "$lib/components/LazyMount.svelte";
  // AsciiImageSection is above-the-fold — keep eager.
  import AsciiImageSection from "$lib/components/messages/AsciiImageSection.svelte";

  // All below-the-fold components are dynamically imported so their
  // modules are excluded from the initial page bundle.
  const loadMessageTimeline = () =>
    import("$lib/components/messages/MessageTimeline.svelte");
  const loadClockHeatmap = () =>
    import("$lib/components/messages/ClockHeatmap.svelte");
  const loadLazyWordCloud = () =>
    import("$lib/components/messages/LazyWordCloud.svelte");
  const loadTotalWords = () =>
    import("$lib/components/messages/TotalWords.svelte");
  const loadBusiestDay = () =>
    import("$lib/components/messages/BusiestDay.svelte");
  const loadMostWords = () =>
    import("$lib/components/messages/MostWords.svelte");
  const loadEmojiMeter = () =>
    import("$lib/components/messages/EmojiMeter.svelte");
  const loadPetNames = () =>
    import("$lib/components/messages/PetNames.svelte");

  const DEANA_IMAGES = [
    "/assets/deana-6.webp",
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
        {#await loadMessageTimeline() then mod}
          {@const MessageTimeline = mod.default}
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
            <MessageTimeline />
          </div>
        {/await}
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
        {#await loadClockHeatmap() then mod}
          {@const ClockHeatmap = mod.default}
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
            <ClockHeatmap />
          </div>
        {/await}
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
            {#await loadLazyWordCloud() then mod}
              {@const LazyWordCloud = mod.default}
              <LazyWordCloud />
            {/await}
          </div>
          <div class="grid grid-rows-3 {g}">
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              {#await loadTotalWords() then mod}
                {@const TotalWords = mod.default}
                <TotalWords />
              {/await}
            </div>
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              {#await loadBusiestDay() then mod}
                {@const BusiestDay = mod.default}
                <BusiestDay />
              {/await}
            </div>
            <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
              {#await loadMostWords() then mod}
                {@const MostWords = mod.default}
                <MostWords />
              {/await}
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
            {#await loadEmojiMeter() then mod}
              {@const EmojiMeter = mod.default}
              <EmojiMeter />
            {/await}
          </div>
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
            {#await loadPetNames() then mod}
              {@const PetNames = mod.default}
              <PetNames />
            {/await}
          </div>
        </div>
      </LazyMount>
    </div>
  </section>
</main>
