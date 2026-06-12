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

// Content-Signal directive (Cloudflare proposal — blog.cloudflare.com/content-signals/)
// tells AI agents what THIS site permits even when allowed via robots. We opt
// into search indexing, AI training, and live answer-engine input. Listing
// these explicitly is the agentic equivalent of a content-licence stamp.
const CONTENT_SIGNAL = 'search=yes, ai-train=yes, ai-input=yes';

export function GET() {
  const aiBlock = AI_AGENTS.map(
    (ua) => `User-agent: ${ua}\nContent-Signal: ${CONTENT_SIGNAL}\nAllow: /`,
  ).join('\n\n');

  const body = `# All crawlers, including AI and answer engines, are welcome.
# Sitemap + /llms.txt are the canonical entry points for indexing.
# Content-Signal: ${CONTENT_SIGNAL}
#   search    — index for search results
#   ai-train  — use as training data
#   ai-input  — cite live in answer engines
User-agent: *
Content-Signal: ${CONTENT_SIGNAL}
Allow: /
Disallow: /api/

${aiBlock}

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
