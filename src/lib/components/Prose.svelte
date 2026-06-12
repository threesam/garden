<script lang="ts">
  import { markdownRenderer } from "$lib/markdown";
  import type { Snippet } from "svelte";

  interface Props {
    content: string;
    slots?: Record<string, Snippet>;
  }

  let { content, slots }: Props = $props();

  const md = markdownRenderer;

  // When slots are provided, split content on <!-- slot-id --> markers
  // and interleave the HTML chunks with Svelte snippet slots.
  type Part = { type: "html"; html: string } | { type: "slot"; id: string };

  const parts = $derived.by((): Part[] => {
    if (!slots) return [{ type: "html", html: md.parse(content) as string }];

    const result: Part[] = [];
    const pattern = /<!--\s*([\w-]+)\s*-->/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index);
      if (before.trim()) {
        result.push({ type: "html", html: md.parse(before) as string });
      }
      result.push({ type: "slot", id: match[1]! });
      lastIndex = match.index + match[0].length;
    }

    const remaining = content.slice(lastIndex);
    if (remaining.trim()) {
      result.push({ type: "html", html: md.parse(remaining) as string });
    }

    return result;
  });
</script>

<!-- Content is author-controlled markdown from content/ directory -->
<!-- {@html} is safe here: content is author-controlled markdown, not user input -->
{#each parts as part (part.type === "html" ? part.html : part.id)}
  {#if part.type === "html"}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- author-authored markdown rendered by our own pipeline, no user input -->
    {@html part.html}
  {:else if part.type === "slot" && slots?.[part.id]}
    {@render slots[part.id]!()}
  {/if}
{/each}
