<script lang="ts">
	import wordsData from '../../../../data/messages/dianchik/words-data.json';
</script>

<div>
	<span class="font-mono text-[10px] text-zinc-600">most words in a day</span>
	<p class="mt-1.5 text-2xl font-bold text-black">{wordsData.peak_words.count.toLocaleString()}</p>
	<p class="mt-1.5 font-mono text-[10px] text-zinc-600">
		words on {wordsData.peak_words.date}
	</p>
</div>
