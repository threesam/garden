<script lang="ts">
	import petData from '../../../../data/messages/dianchik/petnames-data.json';

	interface PetName {
		name: string;
		count: number;
	}

	const sam = petData.sam as PetName[];
	const dia = petData.dianchik as PetName[];
	const samMax = sam[0]?.count ?? 1;
	const diaMax = dia[0]?.count ?? 1;

	const show = 25;
</script>

{#snippet nameBar(name: string, count: number, max: number, color: string)}
	<div class="flex items-center gap-1.5">
		<span class="w-24 shrink-0 truncate text-left font-mono text-[10px] text-zinc-600">{name}</span>
		<div class="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
			<div
				class="h-full rounded-full"
				style="width: {(count / max) * 100}%; background-color: {color};"
			></div>
		</div>
		<span class="w-10 text-right font-mono text-[9px] text-zinc-600">{count}</span>
	</div>
{/snippet}

<div>
	<div class="mb-6 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-[0.16em] text-zinc-600">pet names</span>
	</div>
	<div class="grid gap-6 sm:grid-cols-2">
		<div>
			<div class="mb-3">
				<span class="font-mono text-[10px] text-zinc-600">dianchik calls him</span>
			</div>
			<div class="space-y-1.5">
				{#each dia.slice(0, show) as p (p.name)}
					{@render nameBar(p.name, p.count, diaMax, 'rgba(180,140,20,0.7)')}
				{/each}
			</div>
		</div>
		<div>
			<div class="mb-3">
				<span class="font-mono text-[10px] text-zinc-600">sam calls her</span>
			</div>
			<div class="space-y-1.5">
				{#each sam.slice(0, show) as p (p.name)}
					{@render nameBar(p.name, p.count, samMax, 'rgba(0,0,0,0.4)')}
				{/each}
			</div>
		</div>
	</div>
</div>
