import { Marked } from 'marked';
import { markedEmoji } from 'marked-emoji';
import * as emoji from 'node-emoji';
import { linkClasses } from './link';

const emojiMap = new Proxy({} as Record<string, string>, {
  get(_, name: string) { return emoji.get(name); },
  has(_, name: string) { return emoji.has(name); },
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
        return `<h2 class="mb-6 mt-18 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:mt-24 md:text-5xl">${text}</h2>`;
      return false;
    },
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      // If paragraph is only emojis (1-3), render larger like iMessage
      const stripped = text.replace(/<[^>]+>/g, '').trim();
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
      const external = href.startsWith('http') || href.startsWith('//');
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} class="${linkClasses}">${text}</a>`;
    },
    image({ href, text }) {
      if (text && text.includes('|')) {
        // Hero image: "HEADING|color|position" e.g. "BLONDIE|white" or "ADVENTURE|white|right" or "VELVET DOOR|white|bottom-left"
        const parts = text.split('|');
        const heading = parts[0].trim().replace(/\\n/g, '<br/>');
        const color = parts[1]?.trim() || 'white';
        const pos = parts[2]?.trim() || 'left';
        const isBottom = pos.startsWith('bottom');
        const isRight = pos.includes('right');
        const isCenter = pos.includes('center');
        let hClass = 'left-6 md:left-18';
        if (isCenter) hClass = 'left-1/2 -translate-x-1/2 text-center';
        else if (isRight) hClass = 'right-6 text-right md:right-18';
        const vClass = isBottom
          ? 'bottom-6 md:bottom-18'
          : 'top-6 md:top-18';
        return `<div class="relative my-12 -mx-6 md:-mx-9"><img src="${href}" alt="${heading}" class="w-full md:rounded-lg" /><span class="absolute ${vClass} ${hClass} font-mono text-2xl font-bold uppercase tracking-[0.1em] md:text-5xl" style="color: ${color}">${heading}</span></div>`;
      }
      return `<img src="${href}" alt="${text ?? ''}" class="relative my-9 -mx-6 block w-full rounded-lg md:-mx-9" />`;
    },
  },
});

interface ProseProps {
  content: string;
  slots?: Record<string, React.ReactNode>;
}

export function Prose({ content, slots }: ProseProps) {
  if (!slots) {
    const html = md.parse(content) as string;
    // Content is author-controlled markdown from content/ directory, not user input
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Split on <!-- slot-name --> markers and interleave React components
  const parts: React.ReactNode[] = [];
  const pattern = /<!--\s*([\w-]+)\s*-->/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before.trim()) {
      parts.push(<div key={key++} dangerouslySetInnerHTML={{ __html: md.parse(before) as string }} />);
    }
    const slotName = match[1];
    if (slots[slotName]) {
      parts.push(<div key={key++}>{slots[slotName]}</div>);
    }
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining.trim()) {
    parts.push(<div key={key++} dangerouslySetInnerHTML={{ __html: md.parse(remaining) as string }} />);
  }

  return <>{parts}</>;
}
