// Module-level reactive state for the "click the s" snake easter egg on
// the homepage.
//
// Two flags, intentionally split so the open/close UI sequences read in
// the right order:
//
//   active        — wordmark "threesam → snake" letter animation runs
//   gameMounted   — SnakeGame component is in the DOM (fades in/out
//                   via Svelte's transition:fade on the wrapper)
//
// Opening:  active=true at click → 1200 ms later → gameMounted=true.
//           So the letters finish their transition first, THEN the game
//           fades up on top.
//
// Closing:  gameMounted=false at click → 500 ms later → active=false.
//           Game fades out first, THEN the letters reverse back to
//           "threesam".
const OPEN_DELAY_MS = 1200;
const CLOSE_DELAY_MS = 500;

class GameMode {
	active = $state(false);
	gameMounted = $state(false);
	private openTimer: number | null = null;
	private closeTimer: number | null = null;

	start() {
		if (this.closeTimer !== null) {
			clearTimeout(this.closeTimer);
			this.closeTimer = null;
		}
		this.active = true;
		if (this.openTimer !== null) clearTimeout(this.openTimer);
		this.openTimer = window.setTimeout(() => {
			this.gameMounted = true;
			this.openTimer = null;
		}, OPEN_DELAY_MS);
	}

	stop() {
		if (this.openTimer !== null) {
			clearTimeout(this.openTimer);
			this.openTimer = null;
		}
		this.gameMounted = false;
		if (this.closeTimer !== null) clearTimeout(this.closeTimer);
		this.closeTimer = window.setTimeout(() => {
			this.active = false;
			this.closeTimer = null;
		}, CLOSE_DELAY_MS);
	}
}

export const gameMode = new GameMode();
