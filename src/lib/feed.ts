import { SITE_URL, SITE_DESCRIPTION } from "./seo";

export interface FeedItem {
  path: string;
  title: string;
  description: string;
  /** ISO 8601. Converted to RFC 822 on the way out. */
  date: string;
}

/**
 * The five characters that can end an XML document early. Titles are hand
 * written prose, so an ampersand or a bracket is a matter of time.
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build the RSS 2.0 document.
 *
 * `toUTCString()` already emits exactly the RFC 822/1123 form readers expect
 * ("Mon, 29 Jun 2026 00:00:00 GMT"), so there is no date library here and no
 * hand-rolled month table to get wrong.
 */
export function buildRss(items: FeedItem[]): string {
  const sorted = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const entries = sorted
    .map((item) => {
      const url = `${SITE_URL}${item.path}`;
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  // `atom:link rel="self"` is what validators and most readers use to confirm
  // the feed's own canonical address.
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>threesam</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>`;
}
