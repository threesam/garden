<script lang="ts">
  // One letter of the wordmark, drawn as dots on a canvas.
  //
  // Canvas rather than SVG because the field animates every dot's radius and
  // alpha each frame — 1543 live <circle> elements would be 1543 style
  // recalcs per tick. One canvas per letter (not one for the word) so each
  // letter keeps its own box and the snake sequence can still collapse them
  // individually.
  //
  // Decorative: BrandSignoff carries the accessible name for the whole mark.
  import { onMount } from 'svelte';
  import { ROWS, FILL, letterCells, type WordmarkLetter } from '$lib/wordmark';
  import { clock, fieldAt, lerp, subscribe, FIELD } from '$lib/wordmark-motion.svelte';

  let { letter, inkEm = 0.761 }: { letter: WordmarkLetter; inkEm?: number } = $props();

  /** Alpha quantisation — 20 steps is below the eye's threshold at these sizes. */
  const ALPHA_STEPS = 20;

  const cells = $derived(letterCells(letter));
  const cols = $derived(letter.rows[0]?.length ?? 0);

  let canvas = $state<HTMLCanvasElement | null>(null);
  let fontPx = $state(0);

  // The canvas is sized off the parent's font-size so the dots scale with the
  // wordmark's responsive type instead of being pinned to a pixel size.
  onMount(() => {
    const measure = () => {
      if (canvas?.parentElement) fontPx = parseFloat(getComputedStyle(canvas.parentElement).fontSize);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvas?.parentElement) ro.observe(canvas.parentElement);
    // Ref-counted: the shared clock runs while any letter is mounted, and the
    // last one to unmount stops it.
    const unsubscribe = subscribe();
    return () => {
      ro.disconnect();
      unsubscribe();
    };
  });

  $effect(() => {
    const el = canvas;
    if (!el || !fontPx || !cols) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const inkPx = inkEm * fontPx;
    const pitch = inkPx / ROWS;
    const w = cols * pitch;

    el.width = Math.max(1, Math.round(w * dpr));
    el.height = Math.max(1, Math.round(inkPx * dpr));
    el.style.width = `${w}px`;
    el.style.height = `${inkPx}px`;

    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, inkPx);
    // Canvas has no `currentColor`, so the inherited text colour is read off
    // the element — that's what keeps the mark flipping with `tone`.
    ctx.fillStyle = getComputedStyle(el).color;

    const base = (FILL * pitch) / 2;
    const t = clock.elapsed;

    // Alpha is quantised into ALPHA_STEPS buckets so a letter costs a handful
    // of fills per frame instead of one per dot; the radius still varies
    // continuously. A fixed array indexed by bucket, not a Map — the key is
    // already a small integer.
    const buckets: [number, number, number][][] = Array.from({ length: ALPHA_STEPS + 1 }, () => []);
    for (const [x, y] of cells) {
      // Sampled in FULL-grid coordinates — letter.x0 offsets this letter into
      // the word — so the wave crosses letter boundaries without a seam.
      const n = fieldAt(letter.x0 + x, y, t);
      const r = base * lerp(n, FIELD.radius[0], FIELD.radius[1]);
      const step = Math.round(lerp(n, FIELD.alpha[0], FIELD.alpha[1]) * ALPHA_STEPS);
      buckets[step]?.push([(x + 0.5) * pitch, (y + 0.5) * pitch, r]);
    }
    buckets.forEach((list, step) => {
      if (list.length === 0) return;
      ctx.globalAlpha = step / ALPHA_STEPS;
      ctx.beginPath();
      for (const [cx, cy, r] of list) {
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  });
</script>

<canvas bind:this={canvas} class="glyph" aria-hidden="true"></canvas>

<style>
  .glyph {
    /* An inline-block's baseline is its bottom margin edge, so pulling the box
       down by the word's descent lands the dots on the same baseline as any
       text beside them. */
    display: inline-block;
    vertical-align: baseline;
    margin-bottom: -0.011em;
  }
</style>
