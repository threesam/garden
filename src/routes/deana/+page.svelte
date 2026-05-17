<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";

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
  <!-- Phase 5: AsciiImageSection src={DEANA_IMAGES[0]} -->

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <!-- Phase 5: LazyMount -->
      <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
        <!-- Phase 5: MessageTimeline -->
      </div>
    </div>
  </section>

  <!-- Phase 5: AsciiImageSection src={DEANA_IMAGES[1]} -->

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <!-- Phase 5: LazyMount -->
      <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
        <!-- Phase 5: ClockHeatmap -->
      </div>
    </div>
  </section>

  <!-- Phase 5: AsciiImageSection src={DEANA_IMAGES[2]} -->

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <!-- Phase 5: LazyMount -->
      <div class="grid grid-cols-1 md:grid-cols-3 {g}">
        <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 md:col-span-2">
          <!-- Phase 5: LazyWordCloud -->
        </div>
        <div class="grid grid-rows-3 {g}">
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
            <!-- Phase 5: TotalWords -->
          </div>
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
            <!-- Phase 5: BusiestDay -->
          </div>
          <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9 flex items-center">
            <!-- Phase 5: MostWords -->
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Phase 5: AsciiImageSection src={DEANA_IMAGES[3]} -->

  <section
    class="w-full px-3 py-12 md:px-6 md:py-24"
    style="background-color: var(--white);"
  >
    <div class="mx-auto w-full max-w-7xl flex flex-col {g}">
      <!-- Phase 5: LazyMount -->
      <div class="grid grid-cols-1 md:grid-cols-2 {g}">
        <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
          <!-- Phase 5: EmojiMeter -->
        </div>
        <div class="rounded-3xl bg-white border border-zinc-200 p-6 md:p-9">
          <!-- Phase 5: PetNames -->
        </div>
      </div>
    </div>
  </section>
</main>
