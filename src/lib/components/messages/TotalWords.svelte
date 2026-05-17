<script lang="ts">
	import wordsData from '../../../../data/messages/dianchik/words-data.json';

	const total = wordsData.sam_total_words + wordsData.dia_total_words;
</script>

<div>
	<span class="font-mono text-[10px] text-zinc-600">words written</span>
	<p class="mt-1.5 text-2xl font-bold text-black">{total.toLocaleString()}</p>
	<div class="mt-3 space-y-1.5">
		<div class="flex justify-between font-mono text-[10px] text-zinc-600">
			<span>sam</span>
			<span>{wordsData.sam_total_words.toLocaleString()}</span>
		</div>
		<div class="flex justify-between font-mono text-[10px] text-zinc-600">
			<span>dianchik</span>
			<span>{wordsData.dia_total_words.toLocaleString()}</span>
		</div>
	</div>
</div>
