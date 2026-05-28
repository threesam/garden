<script lang="ts">
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';

	interface LoveFirst {
		date: string;
		sender: string;
		text: string;
	}

	const firstSam = (modulesData as Record<string, unknown>).love_first_sam as LoveFirst | null;
	const firstDia = (modulesData as Record<string, unknown>).love_first_dia as LoveFirst | null;
	const loveCount = modulesData.love_count as number;
</script>

<!-- MilestoneSam -->
{#if firstSam}
	<div>
		<span class="font-mono text-[10px] text-zinc-600">first "love you" — sam</span>
		<p class="mt-1.5 text-sm leading-relaxed text-[var(--black)]">"{firstSam.text}"</p>
		<p class="mt-1.5 font-mono text-[10px] text-zinc-600">{firstSam.date}</p>
	</div>
{/if}

<!-- MilestoneDia -->
{#if firstDia}
	<div>
		<span class="font-mono text-[10px] text-zinc-600">first "love you" — dianchik</span>
		<p class="mt-1.5 text-sm leading-relaxed text-[var(--black)]">"{firstDia.text}"</p>
		<p class="mt-1.5 font-mono text-[10px] text-zinc-600">{firstDia.date}</p>
	</div>
{/if}

<!-- MilestoneCount -->
<div>
	<span class="font-mono text-[10px] text-zinc-600">"i love you"</span>
	<p class="mt-1.5 text-2xl font-bold text-[var(--black)]">{loveCount.toLocaleString()}</p>
	<p class="mt-1.5 font-mono text-[10px] text-zinc-600">times and counting</p>
</div>
