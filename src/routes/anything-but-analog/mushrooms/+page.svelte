<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { collectionPageNode } from '$lib/seo';
  import MushroomViewer from '$lib/components/mushroom/MushroomViewer.svelte';
</script>

<SeoHead
  title="mushrooms — anything but analog"
  description="Procedurally grown fungi. Four body plans, built from field-guide measurements."
  ogImage="/og/anything-but-analog.png"
  canonical="/anything-but-analog/mushrooms"
  schema={collectionPageNode({
    path: '/anything-but-analog/mushrooms',
    name: 'mushrooms — threesam',
  })}
  breadcrumbTrail={[
    { path: '/', name: 'threesam' },
    { path: '/anything-but-analog', name: 'anything but analog' },
    { path: '/anything-but-analog/mushrooms', name: 'mushrooms' },
  ]}
/>

<main class="flex min-h-dvh flex-col gap-6 bg-black px-4 py-6 text-white sm:px-8">
  <header class="flex flex-col gap-1">
    <h1 class="font-display text-2xl lowercase sm:text-3xl">mushrooms</h1>
    <p class="max-w-prose font-mono text-xs text-white/50">
      Grown from a blueprint, not a model file. Every measurement below comes
      from a field guide, so the specimen is a plausible member of its species
      rather than a mushroom-shaped object.
    </p>
  </header>

  <div class="min-h-0 flex-1">
    <MushroomViewer />
  </div>
</main>
