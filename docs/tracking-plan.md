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
|             | `sound-press`         | `src`             | the memo picture on /thoughts/mouth-machine is pressed                        |
| 5. leave to | `outbound-click`      | `host`, `path`, `from` | any off-site link, left or middle click                                  |

On every page, from `src/lib/engagement.ts` (the same file runs sixtom.com and
pyredivers.com, so the names match across all three):

| event                                      | data  | fires when                                                                       |
| ------------------------------------------ | ----- | -------------------------------------------------------------------------------- |
| `scroll-25` `-50` `-75` `-100`             |       | that far down the page, once per page view. Pages under two screens are skipped  |
| `engaged-10s` `-30s` `-60s` `-180s`        |       | that many seconds with the page in front of the visitor (hidden tabs do not count) |
| `media-play`                               | `src` | a video or sound with its sound on starts                                        |
| `media-25` `-50` `-75`, `media-end`        | `src` | it gets that far. `media-end` is 95%, because a loop never reports an end        |
| `media-replay`                             | `src` | it comes round again, or is taken back after the end                             |

Muted loops are decoration and are not followed. Each mark is its own event
name so umami's Journey and Funnel reports can put them in order, for example
pageview → `scroll-50` → `media-play` → `media-end` → `outbound-click`.

## reading one visitor

Umami → threesam.com → **Sessions**, pick a session: its page views and events
are listed in the order they happened. **Reports → Journey** shows the common
paths across everyone; **Reports → Funnel** takes any run of the events above.
Filter either by `utm_campaign` to follow one post.

`essay-read` is the conversion. Reads ÷ pageviews per essay is the finish
rate. It counts reaching the end however fast, so a skimmer counts too.
`outbound-click` with `host=pyredivers.com` is the bridge to the podcast;
pyre's own analytics shows threesam.com as the referrer on the other side.

Essays with a `ReadMark`: /thoughts/the-peach, /thoughts/certainly-uncertain,
/thoughts/mouth-machine, /thoughts/mouth-machine/raw, /self, /dad, /benny. **A new essay needs one too** (`tests/essay-read.spec.ts`
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
