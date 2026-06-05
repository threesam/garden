// Module-level reactive state for the "click the s" snake easter egg on
// the homepage. BrandSignoff sets active=true when the wordmark's "s" is
// clicked; Gallery, Guide, and the SnakeGame component all react.
class GameMode {
	active = $state(false);
	start() {
		this.active = true;
	}
	stop() {
		this.active = false;
	}
	toggle() {
		this.active = !this.active;
	}
}

export const gameMode = new GameMode();
