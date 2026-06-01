import { SITE_URL } from '$lib/seo';

export const prerender = true;

// Crawlers that surface this site through answer engines / LLMs are
// explicitly named in addition to the wildcard. Some bots only match
// when their UA is listed, and the absence of a named entry can read
// as a denial of training/citation rights even with a wildcard Allow.
// Order: search → AI/answer engines → wildcard.
const AI_AGENTS = [
  'GPTBot',                // OpenAI training
  'OAI-SearchBot',         // OpenAI search/ChatGPT browsing
  'ChatGPT-User',          // ChatGPT user-initiated fetches
  'ClaudeBot',             // Anthropic Claude training
  'Claude-Web',            // Anthropic Claude live browsing
  'Claude-SearchBot',
  'PerplexityBot',         // Perplexity answer engine
  'Perplexity-User',
  'Google-Extended',       // Bard/Gemini training
  'Applebot-Extended',     // Apple AI training
  'Bytespider',            // ByteDance / Doubao
  'CCBot',                 // Common Crawl
  'cohere-ai',
  'Diffbot',
  'meta-externalagent',    // Meta AI
];

export async function GET() {
  const aiBlock = AI_AGENTS.map((ua) => `User-agent: ${ua}\nAllow: /`).join('\n\n');

  const body = `# All crawlers, including AI and answer engines, are welcome.
# Sitemap + /llms.txt are the canonical entry points for indexing.
User-agent: *
Allow: /
Disallow: /api/

${aiBlock}

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
