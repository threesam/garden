<script lang="ts">
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';

	const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	const heatmap = modulesData.heatmap as number[][];

	const maxVal = Math.max(...heatmap.flat());

	function cellColor(val: number): string {
		const intensity = val / maxVal;
		if (intensity === 0) return 'rgba(0,0,0,0.03)';
		const r = Math.round(212 * intensity + 40 * (1 - intensity));
		const g = Math.round(175 * intensity + 40 * (1 - intensity));
		const b = Math.round(55 * intensity + 40 * (1 - intensity));
		const a = 0.15 + intensity * 0.7;
		return `rgba(${r},${g},${b},${a})`;
	}
</script>

<div>
	<div class="mb-3 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-label text-zinc-600">when we talked</span>
		<span class="font-mono text-[10px] text-zinc-600">hour of day x day of week</span>
	</div>
	<div class="overflow-x-auto">
		<div class="min-w-150">
			<!-- Hour labels -->
			<div class="mb-1.5 flex" style="padding-left: 32px;">
				{#each { length: 24 } as _, h (h)}
					<span class="flex-1 text-center font-mono text-[8px] text-zinc-600">
						{h % 6 === 0 ? `${h}` : ''}
					</span>
				{/each}
			</div>
			<!-- Grid -->
			{#each DAYS as day, dow (day)}
				<div class="mb-px flex items-center gap-1.5">
					<span class="w-7 text-right font-mono text-[9px] text-zinc-600">{day}</span>
					<div class="flex flex-1 gap-px">
						{#each { length: 24 } as _, h (h)}
							<div
								class="flex-1 rounded-[2px] transition-colors"
								style="height: 18px; background-color: {cellColor(heatmap[dow][h])};"
								title="{day} {h}:00 — {heatmap[dow][h]} messages"
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
