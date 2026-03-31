import { Marked } from 'marked';
import { markedEmoji } from 'marked-emoji';
import * as emoji from 'node-emoji';

const emojiMap = new Proxy({} as Record<string, string>, {
  get(_, name: string) { return emoji.get(name); },
  has(_, name: string) { return emoji.has(name); },
});

const md = new Marked({
  renderer: {
    heading({ text, depth }) {
      if (depth === 1)
        return `<h1 class="mb-10 font-mono text-2xl font-bold tracking-[0.1em] md:text-3xl">${text}</h1>`;
      if (depth === 2)
        return `<h2 class="mb-6 mt-12 font-mono text-xl font-bold tracking-[0.08em]">${text}</h2>`;
      return false;
    },
    paragraph({ text }) {
      return `<p class="mb-6 font-sans text-base leading-relaxed md:text-lg md:leading-relaxed">${text}</p>`;
    },
    hr() {
      return '<hr class="my-12 border-t border-current/10" />';
    },
    link({ href, text }) {
      const external = href.startsWith('http') || href.startsWith('//');
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} class="underline underline-offset-2 decoration-current/40 hover:opacity-70 transition-opacity">${text}</a>`;
    },
  },
});

md.use(markedEmoji({ emojis: emojiMap }));

interface ProseProps {
  content: string;
}

export function Prose({ content }: ProseProps) {
  const html = md.parse(content) as string;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
