<script lang="ts">
	import wordsData from '../../../../data/messages/dianchik/words-data.json';
</script>

<div>
	<span class="font-mono text-[10px] text-zinc-600">busiest day</span>
	<p class="mt-1.5 text-2xl font-bold text-black">{wordsData.peak_messages.count}</p>
	<p class="mt-1.5 font-mono text-[10px] text-zinc-600">
		messages on {wordsData.peak_messages.date}
	</p>
</div>
