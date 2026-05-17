import type { Action } from 'svelte/action';
import {
	Chart,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Filler,
} from 'chart.js';
import type { ChartConfiguration } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

export const lineChart: Action<HTMLCanvasElement, ChartConfiguration> = (node, config) => {
	let chart = new Chart(node, config);

	return {
		update(next: ChartConfiguration) {
			chart.data = next.data;
			chart.options = next.options ?? {};
			chart.update();
		},
		destroy() {
			chart.destroy();
		},
	};
};
