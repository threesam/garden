<script lang="ts">
	import complimentsData from '../../../../data/messages/dianchik/compliments-data.json';

	interface ThemeEntry {
		theme: string;
		count: number;
	}

	const sam = complimentsData.sam as ThemeEntry[];
	const dia = complimentsData.dianchik as ThemeEntry[];

	const themeMap: Record<string, { sam: number; dia: number }> = {};
	for (const e of sam) themeMap[e.theme] = { sam: e.count, dia: 0 };
	for (const e of dia) {
		const existing = themeMap[e.theme] ?? { sam: 0, dia: 0 };
		existing.dia = e.count;
		themeMap[e.theme] = existing;
	}
	const ranked = Object.entries(themeMap).sort(
		(a, b) => b[1].sam + b[1].dia - (a[1].sam + a[1].dia)
	);

	const maxTotal = ranked[0] ? ranked[0][1].sam + ranked[0][1].dia : 1;
</script>

<div>
	<div class="mb-6 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-[0.16em] text-zinc-600">compliments</span>
		<span class="font-mono text-[10px] text-zinc-600">
			{(complimentsData.sam_total + complimentsData.dia_total).toLocaleString()} total
		</span>
	</div>
	<div class="mb-3 grid grid-cols-2 gap-3">
		<div class="rounded-lg border border-zinc-200 p-3 text-center">
			<p class="text-xl font-bold text-[var(--black)]">{complimentsData.sam_total}</p>
			<p class="font-mono text-[10px] text-zinc-600">from sam</p>
		</div>
		<div class="rounded-lg border border-zinc-200 p-3 text-center">
			<p class="text-xl font-bold text-[var(--black)]">{complimentsData.dia_total}</p>
			<p class="font-mono text-[10px] text-zinc-600">from dianchik</p>
		</div>
	</div>
	<div class="space-y-1.5">
		{#each ranked as [theme, { sam: s, dia: d }] (theme)}
			{@const total = s + d}
			{@const samPct = (s / maxTotal) * 100}
			{@const diaPct = (d / maxTotal) * 100}
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<span class="font-mono text-[10px] text-zinc-600">{theme}</span>
					<span class="font-mono text-[9px] text-zinc-600">{total}</span>
				</div>
				<div class="flex h-3 gap-px overflow-hidden rounded-full bg-zinc-100">
					<div
						class="rounded-full"
						style="width: {samPct}%; background-color: rgba(0,0,0,0.4);"
					></div>
					<div
						class="rounded-full"
						style="width: {diaPct}%; background-color: rgba(180,140,20,0.7);"
					></div>
				</div>
			</div>
		{/each}
	</div>
	<div class="mt-3 flex gap-3">
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span
				class="inline-block h-2 w-2 rounded-sm"
				style="background-color: rgba(0,0,0,0.4);"
			></span>
			sam
		</span>
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span
				class="inline-block h-2 w-2 rounded-sm"
				style="background-color: rgba(180,140,20,0.7);"
			></span>
			dianchik
		</span>
	</div>
</div>
