<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import StoryLayers from "$lib/components/StoryLayers.svelte";
  import { POSTER, PUBLISHED, layers } from "$lib/mouth-machine-story";
  import { articleNode } from "$lib/seo";

  const DESCRIPTION =
    "a 34 second video that started as a voice memo of mouth drums, built up in seven layers: what Sam asked for, and what each ask put on.";
</script>

<SeoHead
  title="sea foam"
  description={DESCRIPTION}
  canonical="/thoughts/mouth-machine"
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="a seafoam ring on a black ground"
  preloadImage={POSTER}
  schema={articleNode({
    path: "/thoughts/mouth-machine",
    headline: "sea foam",
    image: POSTER,
    datePublished: PUBLISHED,
    dateModified: "2026-10-11",
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: "/thoughts/mouth-machine", name: "sea foam" },
  ]}
/>

<StoryLayers
  {layers}
  rawPath="/thoughts/mouth-machine/raw"
  summary="one thursday night into friday afternoon · 45 turns"
  ending="where i stopped"
/>
