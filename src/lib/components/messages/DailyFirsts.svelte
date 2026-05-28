<script lang="ts">
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';

	interface DailyFirst {
		date: string;
		sender: string;
		text: string;
		hour: number;
		minute?: number;
	}

	const firsts = modulesData.daily_firsts_sample as DailyFirst[];

	const perPage = 12;
	const totalPages = Math.ceil(firsts.length / perPage);

	let page = $state(0);
	const slice = $derived(firsts.slice(page * perPage, (page + 1) * perPage));
</script>

<div>
	<div class="mb-3 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-[0.16em] text-zinc-600">first message of the day</span>
		<span class="font-mono text-[10px] text-zinc-600">{firsts.length} days</span>
	</div>
	<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
		{#each slice as f (f.date)}
			<div class="rounded-lg border border-zinc-200 p-3">
				<p class="line-clamp-2 text-sm leading-relaxed text-[var(--black)]">"{f.text}"</p>
				<p class="mt-1.5 font-mono text-[9px] text-zinc-600">
					{f.sender.split(' ')[0].toLowerCase()} — {f.date}, {f.hour}:{String(f.minute ?? 0).padStart(2, '0')}
				</p>
			</div>
		{/each}
	</div>
	{#if totalPages > 1}
		<div class="mt-3 flex items-center justify-center gap-3">
			<button
				onclick={() => (page = Math.max(0, page - 1))}
				disabled={page === 0}
				class="font-mono text-[10px] text-zinc-600 hover:text-[var(--black)] disabled:opacity-30"
			>
				prev
			</button>
			<span class="font-mono text-[10px] text-zinc-600">{page + 1} / {totalPages}</span>
			<button
				onclick={() => (page = Math.min(totalPages - 1, page + 1))}
				disabled={page === totalPages - 1}
				class="font-mono text-[10px] text-zinc-600 hover:text-[var(--black)] disabled:opacity-30"
			>
				next
			</button>
		</div>
	{/if}
</div>
