// Module-level reactive state for the "click the s" snake easter egg on
// the homepage.
//
// The bottom-left wordmark slot is the countdown vehicle — "snake" → "3"
// → "2" → "1" → game burst. Centered countdown felt scattered; anchoring
// it to the wordmark spot makes the camera follow the action.
//
// Flags driving the UI:
//
//   active          — wordmark "threesam → snake" letter animation runs;
//                     gallery + tagline fade out
//   countdownText   — empty | "3" | "2" | "1"; when non-empty, the
//                     wordmark hides and this text takes its bottom-left
//                     slot
//   gameMounted     — SnakeGame is in the DOM (ticking + drawing). The
//                     game snake itself enters from below the canvas, so
//                     the "burst" is the creature rising, not a CSS
//                     animation on the wrapper.
//   gameOver        — written by SnakeGame when its snake dies. The page
//                     reads this to swap the top-left score for a "game
//                     over" label and to show the bottom-left "again?"
//                     replay prompt.
const LETTER_ANIM_MS = 1200;
const COUNT_STEP_MS = 500;
const CLOSE_DELAY_MS = 500;

class GameMode {
	active = $state(false);
	countdownText = $state('');
	gameMounted = $state(false);
	gameOver = $state(false);
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
		this.gameOver = false;

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

	// Replay after game-over. Skip the letter animation (we're already in
	// game mode) and run the same 3 → 2 → 1 → burst-up sequence with a
	// fresh snake. Setting countdownText synchronously *before* tearing
	// down the dead canvas keeps the bottom-left slot continuously owned
	// by countdown text — no wordmark flicker between "again?" and "3".
	restart() {
		this.clearTimers();
		this.countdownText = '3';
		this.gameOver = false;
		this.gameMounted = false;

		let t = COUNT_STEP_MS;
		this.sched(t, () => (this.countdownText = '2'));
		t += COUNT_STEP_MS;
		this.sched(t, () => (this.countdownText = '1'));
		t += COUNT_STEP_MS;
		this.sched(t, () => {
			this.countdownText = '';
			this.gameMounted = true;
		});
	}

	stop() {
		this.clearTimers();
		this.countdownText = '';
		this.gameMounted = false;
		this.gameOver = false;
		this.sched(CLOSE_DELAY_MS, () => (this.active = false));
	}
}

export const gameMode = new GameMode();
