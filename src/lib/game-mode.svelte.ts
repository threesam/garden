// Module-level reactive state for the "click the s" snake easter egg on
// the homepage.
//
// Three flags drive the open/close UI sequence:
//
//   active          — wordmark "threesam → snake" letter animation runs;
//                     gallery + tagline fade out
//   countdownText   — empty | "3" | "2" | "1" | "slither!"; centered
//                     overlay shown between the letter animation and the
//                     game appearing
//   gameMounted     — SnakeGame component is in the DOM (faded in/out via
//                     Svelte's transition:fade on the wrapper)
//
// Open: active=true → 1200 ms (letter anim) → countdown "3"/"2"/"1"/
//       "slither!" each ~500 ms → countdownText="" + gameMounted=true.
// Close: gameMounted=false → 500 ms (game fade-out) → active=false.
//
// Every scheduled timer is cleared on the opposite action so rapid toggles
// don't strand state.
const LETTER_ANIM_MS = 1200;
const COUNT_STEP_MS = 500;
const SLITHER_MS = 700;
const CLOSE_DELAY_MS = 500;

class GameMode {
	active = $state(false);
	countdownText = $state('');
	gameMounted = $state(false);
	private timers: number[] = [];

	private sched(ms: number, fn: () => void) {
		const id = window.setTimeout(fn, ms);
		this.timers.push(id);
	}

	private clearTimers() {
		for (const id of this.timers) clearTimeout(id);
		this.timers = [];
	}

	start() {
		this.clearTimers();
		this.active = true;
		this.countdownText = '';
		this.gameMounted = false;

		let t = LETTER_ANIM_MS;
		this.sched(t, () => (this.countdownText = '3'));
		t += COUNT_STEP_MS;
		this.sched(t, () => (this.countdownText = '2'));
		t += COUNT_STEP_MS;
		this.sched(t, () => (this.countdownText = '1'));
		t += COUNT_STEP_MS;
		this.sched(t, () => (this.countdownText = 'slither!'));
		t += SLITHER_MS;
		this.sched(t, () => {
			this.countdownText = '';
			this.gameMounted = true;
		});
	}

	stop() {
		this.clearTimers();
		this.countdownText = '';
		this.gameMounted = false;
		this.sched(CLOSE_DELAY_MS, () => (this.active = false));
	}
}

export const gameMode = new GameMode();
