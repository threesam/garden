// Module-level reactive state for the homepage arcade easter eggs: the
// "click the s" snake game, and the "click the alien" space-invaders game.
// Both share one lifecycle (this FSM) and one stage — the bottom-left
// wordmark slot, which hosts everything non-canvas:
//
//   snake:    "snake" → "3" → "2" → "1" → (game) → "game over" → "again?" → …
//   invaders: (no title sequence) "3" → "2" → "1" → (game) → "game over" → …
//
// Anchoring every beat to the same corner makes the camera follow the action.
//
// Flags driving the UI:
//
//   active          — arcade mode is on; gallery + tagline fade out. For
//                     snake the wordmark also runs its "threesam → snake"
//                     letter animation (gated on game === 'snake').
//   game            — which game owns the session ('snake' | 'invaders'),
//                     so the homepage mounts the right canvas component.
//   countdownText   — "" | "3" | "2" | "1"; when non-empty, the wordmark
//                     hides and this text takes its bottom-left slot.
//   gameMounted     — the game component is in the DOM (ticking + drawing).
//   gameOver        — "game over" message is showing (a 2 s hold, then
//                     fades out). The game calls handleGameOver() on death.
//   replayReady     — "again?" prompt is showing. Click → restart().

export type ArcadeGame = 'snake' | 'invaders';

const LETTER_ANIM_MS = 1200;
const COUNT_STEP_MS = 500;
const CLOSE_DELAY_MS = 500;
const GAME_OVER_HOLD_MS = 2000;
const GAME_OVER_FADE_MS = 400;

class GameMode {
	active = $state(false);
	game = $state<ArcadeGame | null>(null);
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

	// Schedule the shared "2 → 1 → burst-up" tail. `base` is the offset of
	// the already-shown "3" — snake offsets by its letter animation, invaders
	// and replay start at 0 (they claim "3" synchronously, no flicker).
	private scheduleCountdownTail(base: number) {
		let t = base + COUNT_STEP_MS;
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

	start(game: ArcadeGame = 'snake') {
		this.clearTimers();
		this.game = game;
		this.active = true;
		this.gameMounted = false;
		this.gameOver = false;
		this.replayReady = false;

		if (game === 'snake') {
			// "threesam → snake" wordmark animation plays first, then "3".
			this.countdownText = '';
			this.sched(LETTER_ANIM_MS, () => (this.countdownText = '3'));
			this.scheduleCountdownTail(LETTER_ANIM_MS);
		} else {
			// Invaders has no title sequence — claim the slot with "3" now so
			// the wordmark hides immediately (no one-frame "threesam" flash).
			this.countdownText = '3';
			this.scheduleCountdownTail(0);
		}
	}

	// The game calls this once at the edge where its local gameOver flips
	// true. Hold "game over" in the wordmark slot for the dwell, fade it out,
	// then surface "again?" — never overlapping (replayReady flips only after
	// the fade-out window completes).
	//
	// `gameMounted` guard handles the Esc-during-death race: stop() sets
	// gameMounted=false synchronously, but the game's outro keeps ticking for
	// ~400 ms. A late step() during that window could call here over an
	// already-closing game; we'd surface "again?" on the idle homepage later.
	handleGameOver() {
		if (!this.gameMounted) return;
		this.gameOver = true;
		this.sched(GAME_OVER_HOLD_MS, () => (this.gameOver = false));
		this.sched(GAME_OVER_HOLD_MS + GAME_OVER_FADE_MS, () => (this.replayReady = true));
	}

	// True whenever something other than the idle wordmark owns the
	// bottom-left slot (countdown digit, live/dead game canvas, "game over"
	// message, or "again?" prompt). BrandSignoff reads this to hide the
	// wordmark during those beats.
	get wordmarkSlotOccupied() {
		return (
			this.countdownText !== '' ||
			this.gameMounted ||
			this.gameOver ||
			this.replayReady
		);
	}

	// Replay after game-over. Skip any title sequence (we're already in arcade
	// mode) and run a fresh 3 → 2 → 1 → burst-up with the same game. Setting
	// countdownText synchronously *before* tearing down the dead canvas keeps
	// the slot continuously owned by countdown text — no flicker between
	// "again?" and "3".
	restart() {
		this.clearTimers();
		this.countdownText = '3';
		this.gameOver = false;
		this.replayReady = false;
		this.gameMounted = false;
		this.scheduleCountdownTail(0);
	}

	stop() {
		this.clearTimers();
		this.countdownText = '';
		this.gameMounted = false;
		this.gameOver = false;
		this.replayReady = false;
		this.sched(CLOSE_DELAY_MS, () => {
			this.active = false;
			this.game = null;
		});
	}
}

export const gameMode = new GameMode();
