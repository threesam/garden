# tracking plan

Umami, self-hosted at analytics.sixtom.com, loaded only on threesam.com
(`+layout.svelte`). No cookies; `?test` ejects a browser (`?test=0` rejoins).

threesam is a content site, so the funnel is attention, not checkout:
land → read to the end → go somewhere next.

## events

| step        | event                 | data              | fires when                                                                    |
| ----------- | --------------------- | ----------------- | ----------------------------------------------------------------------------- |
| 1. land     | pageview              | referrer, `utm_*` | every visit                                                                   |
| 2. browse   | `thoughts-card-click` | `href`            | an essay card on /thoughts                                                    |
|             | `gallery-card-click`  | `handle`          | a gallery card                                                                |
|             | `aba-banner-click`    |                   | the anything-but-analog banner                                                |
| 3. **read** | **`essay-read`**      | `path`            | the end of an essay scrolls into view, once per view (`ReadMark.svelte`)      |
| 4. listen   | `sounds-play`         | `slug`, `variant` | a fresh play on /sounds                                                       |
| 5. leave to | `outbound-click`      | `host`, `path`, `from` | any off-site link, left or middle click (`OutboundTracker.svelte`)       |

`essay-read` is the conversion. Reads ÷ pageviews per essay is the finish
rate. It counts reaching the end however fast, so a skimmer counts too.
`outbound-click` with `host=pyredivers.com` is the bridge to the podcast;
pyre's own analytics shows threesam.com as the referrer on the other side.

Essays with a `ReadMark`: /thoughts/the-peach, /thoughts/certainly-uncertain,
/self, /dad, /benny. **A new essay needs one too** (`tests/essay-read.spec.ts`
lists them).

## tag every link you send

LinkedIn's app and DMs strip the referrer, so untagged links read as "direct"
(the biggest bucket today). Same convention as sixtom:

| param          | values                                                 |
| -------------- | ------------------------------------------------------ |
| `utm_source`   | `linkedin`, `dm`, `email`, `pyre`, `x`                 |
| `utm_medium`   | `social`, `dm`, `newsletter`, `podcast`                |
| `utm_campaign` | the push: `the-peach`, `ep4`, `outreach-2026-10`       |
| `utm_content`  | optional placement: `bio`, `first-comment`, `shownotes` |

Example: `https://threesam.com/thoughts/the-peach?utm_source=linkedin&utm_medium=social&utm_campaign=the-peach&utm_content=first-comment`

Lowercase, hyphens, no spaces.

## known blind spots

- **Essay links out** carry `rel="noopener noreferrer"` (`markdown.ts`), so a
  site an essay links to sees threesam as direct. Our own `outbound-click`
  still counts it.
- **Search** shows as google/ddg with no query; Search Console has the terms.
