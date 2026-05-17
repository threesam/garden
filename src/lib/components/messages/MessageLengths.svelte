<script lang="ts">
	import { lineChart } from './actions/lineChart.js';
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';
	import type { ChartConfiguration } from 'chart.js';

	const { labels, sam, dianchik } = modulesData.avg_lengths as {
		labels: string[];
		sam: number[];
		dianchik: number[];
	};

	const chartConfig: ChartConfiguration = {
		type: 'line',
		data: {
			labels,
			datasets: [
				{
					label: 'sam',
					data: sam,
					borderColor: 'rgba(255, 255, 255, 0.5)',
					backgroundColor: 'rgba(255, 255, 255, 0.05)',
					borderWidth: 1.5,
					pointRadius: 0,
					tension: 0.3,
					fill: true,
				},
				{
					label: 'dianchik',
					data: dianchik,
					borderColor: 'rgba(212, 175, 55, 0.6)',
					backgroundColor: 'rgba(212, 175, 55, 0.05)',
					borderWidth: 1.5,
					pointRadius: 0,
					tension: 0.3,
					fill: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			scales: {
				x: {
					ticks: {
						color: 'rgba(255,255,255,0.3)',
						font: { family: 'monospace', size: 9 },
						callback: (_, i) => {
							const l = labels[i];
							return l.endsWith('-01') ? l.slice(0, 4) : '';
						},
					},
					grid: { display: false },
					border: { display: false },
				},
				y: {
					ticks: {
						color: 'rgba(255,255,255,0.2)',
						font: { family: 'monospace', size: 9 },
					},
					grid: { color: 'rgba(255,255,255,0.05)' },
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
						title: (items) => labels[items[0].dataIndex],
						label: (item) => `${item.dataset.label}: avg ${item.raw} chars`,
					},
				},
			},
		},
	};
</script>

<div>
	<div class="mb-3 flex items-baseline justify-between">
		<span class="font-mono text-xs tracking-[0.16em] text-zinc-600">message length over time</span>
		<span class="font-mono text-[10px] text-zinc-600">avg characters per message</span>
	</div>
	<div class="mb-3 flex gap-3">
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span
				class="inline-block h-[2px] w-3"
				style="background-color: rgba(255,255,255,0.5);"
			></span>
			sam
		</span>
		<span class="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
			<span
				class="inline-block h-[2px] w-3"
				style="background-color: rgba(212,175,55,0.6);"
			></span>
			dianchik
		</span>
	</div>
	<div style="height: 200px;">
		<canvas use:lineChart={chartConfig}></canvas>
	</div>
</div>
