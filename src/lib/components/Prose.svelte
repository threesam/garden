<script lang="ts">
  import { Marked } from "marked";
  import { markedEmoji } from "marked-emoji";
  import * as emoji from "node-emoji";
  import type { Snippet } from "svelte";

  interface Props {
    content: string;
    slots?: Record<string, Snippet>;
  }

  let { content, slots }: Props = $props();

  const emojiMap = new Proxy({} as Record<string, string>, {
    get(_, name: string) {
      return emoji.get(name as string);
    },
    has(_, name: string) {
      return emoji.has(name as string);
    },
  });

  const md = new Marked();

  md.use(markedEmoji({ emojis: emojiMap }));

  md.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        if (depth === 1)
          return `<h1 class="mb-9 font-mono text-4xl font-bold uppercase tracking-[0.1em] md:text-6xl">${text}</h1>`;
        if (depth === 2)
          return `<h2 class="mb-6 mt-24 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:mt-36 md:text-5xl">${text}</h2>`;
        return false;
      },
      paragraph({ tokens }) {
        const text = this.parser.parseInline(tokens);
        const stripped = text.replace(/<[^>]+>/g, "").trim();
        const emojiOnly = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}){1,3}$/u.test(stripped);
        if (emojiOnly) {
          return `<p class="mb-6 text-4xl leading-normal">${text}</p>`;
        }
        return `<p class="mb-6 font-sans text-base leading-relaxed md:text-2xl md:leading-relaxed">${text}</p>`;
      },
      hr() {
        return '<hr class="my-12 border-t border-current/10" />';
      },
      link({ href, text }) {
        const external = href.startsWith("http") || href.startsWith("//");
        return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""} class="underline underline-offset-2 hover:opacity-70 transition-opacity">${text}</a>`;
      },
      image({ href, text }) {
        if (text && text.includes("|")) {
          const parts = text.split("|");
          const heading = parts[0].trim().replace(/\\n/g, "<br/>");
          const color = parts[1]?.trim() || "white";
          const pos = parts[2]?.trim() || "left";
          const isBottom = pos.startsWith("bottom");
          const isRight = pos.includes("right");
          const isCenter = pos.includes("center");
          let hClass = "left-6 md:left-18";
          if (isCenter) hClass = "left-1/2 -translate-x-1/2 text-center";
          else if (isRight) hClass = "right-6 text-right md:right-18";
          const vClass = isBottom ? "bottom-6 md:bottom-18" : "top-6 md:top-18";
          return `<div class="relative my-12 -mx-6 md:-mx-9"><img src="${href}" alt="${heading}" class="w-full md:rounded-lg" loading="lazy" /><span class="absolute ${vClass} ${hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl" style="color: ${color}">${heading}</span></div>`;
        }
        return `<img src="${href}" alt="${text ?? ""}" class="relative my-9 -mx-6 block w-full rounded-lg md:-mx-9" loading="lazy" />`;
      },
    },
  });

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
      result.push({ type: "slot", id: match[1] });
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
    {@html part.html}
  {:else if part.type === "slot" && slots?.[part.id]}
    {@render slots[part.id]()}
  {/if}
{/each}
