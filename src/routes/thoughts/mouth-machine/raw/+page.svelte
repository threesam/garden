<script lang="ts">
  import MakingLog from "#lib/components/MakingLog.svelte";
  import SeoHead from "#lib/components/SeoHead.svelte";
  import { OG, POSTER, PUBLISHED } from "#lib/mouth-machine-story.js";
  import { articleNode } from "#lib/seo.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let { html } = $derived(data);

  const PATH = "/thoughts/mouth-machine/raw";
  const TITLE = "sea foam, the raw log";
  const DESCRIPTION =
    "the full log behind a 34 second video: 45 turns, each of Sam's asks quoted, what came back, what was kept and what went wrong.";
</script>

<SeoHead
  title={TITLE}
  description={DESCRIPTION}
  canonical={PATH}
  ogType="article"
  ogImage={OG}
  ogImageAlt="a seafoam ring on a black ground"
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
    { path: "/thoughts/mouth-machine", name: "sea foam" },
    { path: PATH, name: "the raw log" },
  ]}
/>

<MakingLog {html} />
