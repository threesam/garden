function parseMarkdown(md: string): string {
  return md
    // horizontal rules
    .replace(/^---$/gm, '<hr class="my-12 border-t border-current/10" />')
    // h1
    .replace(/^# (.+)$/gm, '<h1 class="mb-10 font-mono text-2xl font-bold tracking-[0.1em] md:text-3xl">$1</h1>')
    // h2
    .replace(/^## (.+)$/gm, '<h2 class="mb-6 mt-12 font-mono text-xl font-bold tracking-[0.08em]">$1</h2>')
    // emphasis *text*
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // arrows
    .replace(/→/g, "→")
    // paragraphs: wrap non-empty lines that aren't already tags
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      return `<p class="mb-6 font-sans text-base leading-relaxed md:text-lg md:leading-relaxed">${trimmed}</p>`;
    })
    .join("\n");
}

interface ProseProps {
  content: string;
}

export function Prose({ content }: ProseProps) {
  const html = parseMarkdown(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
