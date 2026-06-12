import type { Action } from 'svelte/action';
import {
	Chart,
	BarController,
	BarElement,
	CategoryScale,
	LinearScale,
	Tooltip,
} from 'chart.js';
import type { ChartConfiguration } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export const barChart: Action<HTMLCanvasElement, ChartConfiguration> = (node, config) => {
	const chart = new Chart(node, config);

	return {
		update(next: ChartConfiguration) {
			chart.data = next.data;
			chart.options = next.options ?? {};
			chart.update('none');
		},
		destroy() {
			chart.destroy();
		},
	};
};
