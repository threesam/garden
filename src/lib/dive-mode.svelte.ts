// Send-off state for the pyredivers hand-off (the diver in the tagline).
// Promoted out of BrandSignoff so the WHOLE homepage can fade with the
// words — gallery, wordmark, guide coin — game-screen style, leaving only
// the diver standing on the bare coin field before navigation.
//
// LEAVE_MS matches the 1s word-fade already shipped in #263.

const DIVE_URL = 'https://pyredivers.com/?dive';
const LEAVE_MS = 1000;

class DiveMode {
	leaving = $state(false);

	start() {
		if (this.leaving) return;
		this.leaving = true;
		window.setTimeout(() => {
			window.location.href = DIVE_URL;
		}, LEAVE_MS);
	}
}

export const diveMode = new DiveMode();
