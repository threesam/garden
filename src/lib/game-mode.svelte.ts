// Module-level reactive state for the "click the s" snake easter egg on
// the homepage.
//
// The bottom-left wordmark slot is a single stage that hosts everything
// non-canvas: "snake" → "3" → "2" → "1" → (game) → "game over" → "again?"
// → "3" → … Centered overlays felt scattered — anchoring everything to
// the same corner makes the camera follow the action.
//
// Flags driving the UI:
//
//   active          — wordmark "threesam → snake" letter animation runs;
//                     gallery + tagline fade out
//   countdownText   — "" | "3" | "2" | "1"; when non-empty, the wordmark
//                     hides and this text takes its bottom-left slot
//   gameMounted     — SnakeGame is in the DOM (ticking + drawing). The
//                     game snake itself enters from below the canvas, so
//                     the "burst" is the creature rising, not a CSS
//                     animation on the wrapper.
//   gameOver        — "game over" message is showing (a 2 s hold, then
//                     fades out). Triggered by SnakeGame when its snake
//                     dies via handleGameOver().
//   replayReady     — "again?" prompt is showing. Click → restart().

const LETTER_ANIM_MS = 1200;
const COUNT_STEP_MS = 500;
const CLOSE_DELAY_MS = 500;
const GAME_OVER_HOLD_MS = 2000;
const GAME_OVER_FADE_MS = 400;

class GameMode {
	active = $state(false);
	countdownText = $state('');
	gameMounted = $state(false);
	gameOver = $state(false);
	replayReady = $state(false);
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
		this.replayReady = false;

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

	// SnakeGame calls this once at the edge where its local gameOver flips
	// true. Hold "game over" in the wordmark slot for the dwell, fade it
	// out, then surface "again?" — never overlapping (replayReady flips
	// only after the fade-out window completes).
	handleGameOver() {
		this.gameOver = true;
		this.sched(GAME_OVER_HOLD_MS, () => (this.gameOver = false));
		this.sched(GAME_OVER_HOLD_MS + GAME_OVER_FADE_MS, () => (this.replayReady = true));
	}

	// True whenever something other than the idle wordmark owns the
	// bottom-left slot (countdown digit, live/dead game canvas, "game
	// over" message, or "again?" prompt). BrandSignoff reads this to
	// hide the wordmark during those beats.
	get wordmarkSlotOccupied() {
		return (
			this.countdownText !== '' ||
			this.gameMounted ||
			this.gameOver ||
			this.replayReady
		);
	}

	// Replay after game-over. Skip the letter animation (we're already in
	// game mode) and run the same 3 → 2 → 1 → burst-up sequence with a
	// fresh snake. Setting countdownText synchronously *before* tearing
	// down the dead canvas keeps the bottom-left slot continuously owned
	// by countdown text — no flicker between "again?" and "3".
	restart() {
		this.clearTimers();
		this.countdownText = '3';
		this.gameOver = false;
		this.replayReady = false;
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
		this.replayReady = false;
		this.sched(CLOSE_DELAY_MS, () => (this.active = false));
	}
}

export const gameMode = new GameMode();
