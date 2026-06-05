// Module-level reactive state for the "click the s" snake easter egg on
// the homepage.
//
// The bottom-left wordmark is the countdown vehicle — "snake" → "3" → "2"
// → "1" → game burst. Centered countdown felt scattered; anchoring it to
// the wordmark spot makes the camera follow the action.
//
// Flags driving the UI:
//
//   active          — wordmark "threesam → snake" letter animation runs;
//                     gallery + tagline fade out
//   countdownText   — empty | "3" | "2" | "1"; when non-empty, the
//                     wordmark hides and this text takes its bottom-left
//                     slot
//   gameMounted     — SnakeGame fades up from below as the final "1"
//                     scales out — reads as the snake bursting up
//                     through the letter
const LETTER_ANIM_MS = 1200;
const COUNT_STEP_MS = 500;
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
		this.sched(t, () => {
			// "1" exits + game enters in the same beat — burst feel.
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
