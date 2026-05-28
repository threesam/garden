<script lang="ts">
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';

	interface LoveFirst {
		date: string;
		sender: string;
		text: string;
	}

	const firstSam = (modulesData as Record<string, unknown>).love_first_sam as LoveFirst | null;
	const firstDia = (modulesData as Record<string, unknown>).love_first_dia as LoveFirst | null;
	const count = modulesData.love_count as number;
</script>

{#if firstSam || firstDia}
	<div class="my-12 rounded-2xl border border-white/5 bg-[var(--black)] p-6 md:p-9">
		<div class="mb-6 flex items-baseline justify-between">
			<span class="font-mono text-xs tracking-[0.16em] text-zinc-400">"i love you"</span>
			<span class="font-mono text-[10px] text-zinc-400">{count.toLocaleString()} times</span>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			{#if firstSam}
				<div class="rounded-lg border border-white/5 p-3">
					<span class="font-mono text-[10px] text-zinc-400">sam, first</span>
					<p class="mt-1.5 text-sm leading-relaxed text-zinc-300">"{firstSam.text}"</p>
					<p class="mt-1.5 font-mono text-[10px] text-zinc-400">{firstSam.date}</p>
				</div>
			{/if}
			{#if firstDia}
				<div class="rounded-lg border border-white/5 p-3">
					<span class="font-mono text-[10px] text-zinc-400">dianchik, first</span>
					<p class="mt-1.5 text-sm leading-relaxed text-zinc-300">"{firstDia.text}"</p>
					<p class="mt-1.5 font-mono text-[10px] text-zinc-400">{firstDia.date}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
