<script lang="ts">
	// The deana card's label cycles its second character — DIANA / D_ANA /
	// DEANA / D-ANA — on a fixed-width slot so the word never reflows.
	import { onMount } from 'svelte';

	const CHARS = ['I', '_', 'E', '-'];

	// Slot width = the widest character in CHARS, measured in Michroma:
	// I 0.281em, - 0.500em, _ 0.531em, E 0.875em. Sized to the widest so no
	// glyph overflows its slot and every narrower one centres inside it. The
	// old 0.9em was tuned for Recursive Mono, where every advance is equal —
	// Michroma is proportional, so it no longer matched anything.
	const SLOT_EM = 0.875;

	let idx = $state(0);

	onMount(() => {
		const id = setInterval(() => {
			idx = (idx + 1) % CHARS.length;
		}, 2000);
		return () => { clearInterval(id); };
	});
</script>

<!--
  tracking-normal is load-bearing. The card label sets tracking-meta (0.15em),
  and letter-spacing is applied AFTER every character — including the last one
  inside this span. text-center then centres glyph + that trailing space, which
  pushed the character left of its slot and made the gap before it read wider
  than the gap after it. Zeroing it here centres the glyph alone; the label's
  own tracking still supplies the gaps on both sides of the slot.
-->
D<span class="inline-block text-center tracking-normal" style="width: {SLOT_EM}em"
	>{CHARS[idx]}</span
>ANA
