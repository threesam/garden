<script lang="ts">
  // One letter of the wordmark, as dots.
  //
  // Static SVG, not canvas: with nothing animating, vector circles are the
  // sharper choice — the browser antialiases them against the real device
  // pixel grid at any zoom, where a canvas is locked to whatever backing
  // resolution it was sized at.
  //
  // Decorative: BrandSignoff carries the accessible name for the whole mark.
  import { INK_ROWS, INK_TOP, FILL, letterCells, type WordmarkLetter } from '$lib/wordmark';

  let { letter }: { letter: WordmarkLetter } = $props();

  const cols = $derived(letter.rows[0]?.length ?? 0);
  const cells = $derived(letterCells(letter));
  const r = FILL / 2;

  /** Michroma reports the word's ink height as this fraction of font-size. */
  const INK_EM = 0.761;
  /** One grid column/row, in em. */
  const PITCH_EM = INK_EM / INK_ROWS;
</script>

<!-- The viewBox is cropped to the inked rows, not the full padded grid, so the
     box height IS the letterform height and nothing hangs below the baseline.
     The trailing margin restores the wordmark's own letter-spacing, which
     cropping each glyph to its ink box would otherwise throw away. -->
<svg
  class="glyph"
  style:height="{INK_EM}em"
  style:margin-right="{letter.gap * PITCH_EM}em"
  viewBox="0 {INK_TOP} {cols} {INK_ROWS}"
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
>
  {#each cells as [x, y] (`${x}-${y}`)}
    <circle cx={x + 0.5} cy={y + 0.5} {r} />
  {/each}
</svg>

<style>
  .glyph {
    /* An inline-block's baseline is its bottom margin edge, so with the box
       cropped to the ink the glyph sits directly on the baseline. */
    display: inline-block;
    vertical-align: baseline;
    width: auto;
  }
</style>
