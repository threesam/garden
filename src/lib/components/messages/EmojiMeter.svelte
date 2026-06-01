<script lang="ts">
	import emojiData from '../../../../data/messages/dianchik/emoji-data.json';

	interface EmojiEntry {
		emoji: string;
		count: number;
	}

	const sam = emojiData.sam as EmojiEntry[];
	const dia = emojiData.dianchik as EmojiEntry[];
	const samMax = sam[0]?.count ?? 1;
	const diaMax = dia[0]?.count ?? 1;

	const show = 25;
</script>

{#snippet emojiBar(emoji: string, count: number, max: number, color: string)}
	<div class="flex items-center gap-1.5">
		<span
			class="w-5 text-center text-sm leading-none"
			style="font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;"
			>{emoji}</span
		>
		<div class="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
			<div
				class="h-full rounded-full transition-all"
				style="width: {(count / max) * 100}%; background-color: {color};"
			></div>
		</div>
		<span class="w-10 text-right font-mono text-[9px] text-zinc-600">{count}</span>
	</div>
{/snippet}

<div>
	<div class="mb-6 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-label text-zinc-600">emoji</span>
		<span class="font-mono text-[10px] text-zinc-600">
			{(emojiData.sam_total + emojiData.dia_total).toLocaleString()} total
		</span>
	</div>
	<div class="grid gap-6 sm:grid-cols-2">
		<div>
			<div class="mb-3 flex items-baseline justify-between">
				<span class="font-mono text-[10px] text-zinc-600">dianchik</span>
				<span class="font-mono text-[9px] text-zinc-600">{emojiData.dia_unique} unique</span>
			</div>
			<div class="space-y-1.5">
				{#each dia.slice(0, show) as e (e.emoji)}
					{@render emojiBar(e.emoji, e.count, diaMax, 'rgba(180,140,20,0.7)')}
				{/each}
			</div>
		</div>
		<div>
			<div class="mb-3 flex items-baseline justify-between">
				<span class="font-mono text-[10px] text-zinc-600">sam</span>
				<span class="font-mono text-[9px] text-zinc-600">{emojiData.sam_unique} unique</span>
			</div>
			<div class="space-y-1.5">
				{#each sam.slice(0, show) as e (e.emoji)}
					{@render emojiBar(e.emoji, e.count, samMax, 'rgba(0,0,0,0.4)')}
				{/each}
			</div>
		</div>
	</div>
</div>
