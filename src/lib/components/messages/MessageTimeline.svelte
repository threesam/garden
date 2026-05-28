<script lang="ts">
	import { barChart } from './actions/barChart.js';
	import rawData from '../../../../data/messages/dianchik/chart-data.json';
	import type { ChartConfiguration } from 'chart.js';

	const extra = rawData as unknown as Record<string, number[]>;
	const chartData = {
		labels: rawData.labels,
		sam: rawData.sam,
		dianchik: rawData.dianchik,
		sam_media: extra.sam_media ?? [],
		dianchik_media: extra.dianchik_media ?? [],
	};

	type Tab = 'messages' | 'media';

	const MSG_TOTAL =
		chartData.sam.reduce((a: number, b: number) => a + b, 0) +
		chartData.dianchik.reduce((a: number, b: number) => a + b, 0);
	const MEDIA_TOTAL =
		chartData.sam_media.reduce((a: number, b: number) => a + b, 0) +
		chartData.dianchik_media.reduce((a: number, b: number) => a + b, 0);

	const SAM_COLOR = 'rgba(0, 0, 0, 0.4)';
	const SAM_HOVER = 'rgba(0, 0, 0, 0.6)';
	const DIA_COLOR = 'rgba(180, 140, 20, 0.7)';
	const DIA_HOVER = 'rgba(180, 140, 20, 0.9)';

	let tab = $state<Tab>('messages');

	const total = $derived(tab === 'messages' ? MSG_TOTAL : MEDIA_TOTAL);

	function buildConfig(t: Tab): ChartConfiguration {
		const samData = t === 'messages' ? chartData.sam : chartData.sam_media;
		const diaData = t === 'messages' ? chartData.dianchik : chartData.dianchik_media;
		const label = t === 'messages' ? 'messages' : 'media';

		return {
			type: 'bar',
			data: {
				labels: chartData.labels,
				datasets: [
					{
						label: 'dianchik',
						data: diaData,
						backgroundColor: DIA_COLOR,
						hoverBackgroundColor: DIA_HOVER,
						borderRadius: 2,
					},
					{
						label: 'sam',
						data: samData,
						backgroundColor: SAM_COLOR,
						hoverBackgroundColor: SAM_HOVER,
						borderRadius: 2,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 400 },
				scales: {
					x: {
						stacked: true,
						ticks: {
							color: 'rgba(0,0,0,0.3)',
							font: { family: 'monospace', size: 9 },
							maxRotation: 90,
							callback: function (_: unknown, index: number) {
								const l = chartData.labels[index];
								return l.endsWith('-01') ? l.slice(0, 4) : '';
							},
						},
						grid: { display: false },
						border: { display: false },
					},
					y: {
						stacked: true,
						ticks: {
							color: 'rgba(0,0,0,0.2)',
							font: { family: 'monospace', size: 9 },
						},
						grid: { color: 'rgba(0,0,0,0.05)' },
						border: { display: false },
					},
				},
				plugins: {
					tooltip: {
						backgroundColor: 'rgba(0,0,0,0.85)',
						titleFont: { family: 'monospace', size: 11 },
						bodyFont: { family: 'monospace', size: 11 },
						padding: 10,
						callbacks: {
							title: (items: { dataIndex: number }[]) => chartData.labels[items[0].dataIndex],
							label: (item: {
								dataset: { label?: string };
								dataIndex: number;
								raw: unknown;
							}) => {
								const samVal =
									t === 'messages'
										? chartData.sam[item.dataIndex]
										: chartData.sam_media[item.dataIndex];
								const diaVal =
									t === 'messages'
										? chartData.dianchik[item.dataIndex]
										: chartData.dianchik_media[item.dataIndex];
								return `${item.dataset.label}: ${item.raw} ${label} (${samVal + diaVal} total)`;
							},
						},
					},
				},
			},
		};
	}

	const config = $derived(buildConfig(tab));
</script>

<div>
	<div class="mb-3 flex items-baseline justify-between">
		<div class="flex gap-3">
			<button
				onclick={() => (tab = 'messages')}
				class="font-mono text-xs tracking-[0.16em] transition-colors {tab === 'messages'
					? 'text-[var(--black)]'
					: 'text-zinc-600 hover:text-[var(--black)]'}"
			>
				messages
			</button>
			<button
				onclick={() => (tab = 'media')}
				class="font-mono text-xs tracking-[0.16em] transition-colors {tab === 'media'
					? 'text-[var(--black)]'
					: 'text-zinc-600 hover:text-[var(--black)]'}"
			>
				media
			</button>
		</div>
		<span class="font-mono text-[10px] text-zinc-600">{total.toLocaleString()} total</span>
	</div>
	<div class="mb-3 flex gap-3">
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span class="inline-block h-2 w-2 rounded-sm" style="background-color: {DIA_COLOR};"></span>
			dianchik
		</span>
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span class="inline-block h-2 w-2 rounded-sm" style="background-color: {SAM_COLOR};"></span>
			sam
		</span>
	</div>
	<div style="height: 220px;">
		<canvas use:barChart={config}></canvas>
	</div>
	<p class="mt-3 font-mono text-[10px] text-zinc-600">
		{chartData.labels[0]} — {chartData.labels[chartData.labels.length - 1]}
	</p>
</div>
