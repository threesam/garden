<script lang="ts">
  import { markdownRenderer } from "$lib/markdown";

  interface ProseSlot {
    /** Optional classes for the placeholder the component mounts into. */
    class?: string;
    /** Mount the slot content into `node`; return a cleanup fn. */
    mount: (node: HTMLElement) => () => void;
  }

  interface Props {
    content: string;
    slots?: Record<string, ProseSlot>;
  }

  let { content, slots }: Props = $props();

  const md = markdownRenderer;

  // Build the whole document as ONE html string: markdown chunks parsed as
  // before, each `<!-- slot-id -->` marker replaced by a placeholder <div>.
  // Rendering a single {@html} block (rather than interleaving {@html} with
  // {@render} inside an {#each}) gives the hydrator one opaque region to
  // claim — bare {@html} is "invisible" to Svelte, so interleaving it with
  // rendered snippets produced ambiguous node boundaries -> hydration_mismatch.
  // Output markup is byte-identical to the old split rendering apart from the
  // placeholder's data attribute name.
  const html = $derived.by(() => {
    if (!slots) return md.parse(content) as string;

    let out = "";
    const pattern = /<!--\s*([\w-]+)\s*-->/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index);
      if (before.trim()) out += md.parse(before) as string;
      const id = match[1]!;
      const slot = slots[id];
      if (slot) {
        const cls = slot.class ? ` class="${slot.class}"` : "";
        out += `<div data-prose-slot="${id}"${cls}></div>`;
      }
      lastIndex = match.index + match[0].length;
    }

    const remaining = content.slice(lastIndex);
    if (remaining.trim()) out += md.parse(remaining) as string;
    return out;
  });

  let container = $state<HTMLDivElement>();

  // Once the {@html} is in the DOM, mount each slot component into its
  // placeholder. Runs after hydration (same timing as the old createRawSnippet
  // setup), and re-runs if the rendered markup changes; cleans up on teardown.
  $effect(() => {
    void html; // re-mount when the rendered markup changes
    const root = container;
    if (!root || !slots) return;
    const cleanups: (() => void)[] = [];
    for (const node of root.querySelectorAll<HTMLElement>("[data-prose-slot]")) {
      const id = node.dataset["proseSlot"];
      const slot = id ? slots[id] : undefined;
      if (slot) cleanups.push(slot.mount(node));
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  });
</script>

<!-- display:contents so this wrapper generates no box — the parsed markdown
     flows as if it were a direct child of the essay section (identical layout),
     while still giving the effect a scoped root to query for placeholders. -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -- author-authored markdown rendered by our own pipeline, no user input -->
<div bind:this={container} style="display: contents">{@html html}</div>
