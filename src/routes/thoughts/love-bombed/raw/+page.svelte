<script lang="ts">
  import MakingLog from "$lib/components/MakingLog.svelte";
  import SeoHead from "$lib/components/SeoHead.svelte";
  import { OG, POSTER, PUBLISHED, TURNS } from "$lib/love-bombed-story";
  import { articleNode } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  const PATH = "/thoughts/love-bombed/raw";
  const TITLE = "love bombed, the raw log";
  const DESCRIPTION = `the full log behind a 94 second video: ${TURNS} turns, each of Sam's asks quoted, what came back, what was kept and what went wrong.`;
</script>

<SeoHead
  title={TITLE}
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={OG}
  ogImageAlt="hands on a guitar in wine, over rows of small letters on pink"
  preloadImage={POSTER}
  schema={articleNode({
    path: PATH,
    headline: TITLE,
    image: OG,
    datePublished: PUBLISHED,
  })}
  breadcrumbTrail={[
    { path: "/", name: "threesam" },
    { path: "/thoughts", name: "thoughts" },
    { path: "/thoughts/love-bombed", name: "love bombed" },
    { path: PATH, name: "the raw log" },
  ]}
/>

<MakingLog {html} />
