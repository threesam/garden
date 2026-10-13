<script lang="ts">
  import SeoHead from "$lib/components/SeoHead.svelte";
  import StoryLayers from "$lib/components/StoryLayers.svelte";
  import { POSTER, PUBLISHED, TURNS, layers } from "$lib/love-bombed-story";
  import { articleNode } from "$lib/seo";

  const PATH = "/thoughts/love-bombed";
  const DESCRIPTION =
    "the second mouth machine piece: a 94 second video for a birthday, built up in eight layers. what Sam asked for, and the piece as each ask left it.";
</script>

<SeoHead
  title="love bombed"
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={POSTER}
  ogImageAlt="hands on a guitar in wine on pink, with the words 10 years of birthdays along the bottom"
  preloadImage={POSTER}
  schema={articleNode({
    path: PATH,
    headline: "love bombed",
    image: POSTER,
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: PATH, name: "love bombed" },
  ]}
/>

<StoryLayers
  {layers}
  rawPath="/thoughts/love-bombed/raw"
  summary="two days in october · {TURNS} turns"
/>
