// Send-off state for the pyredivers hand-off (the diver in the tagline).
// Promoted out of BrandSignoff so the WHOLE homepage can fade with the
// words — gallery, wordmark, guide coin — game-screen style, leaving only
// the diver standing on the bare coin field before navigation.
//
// LEAVE_MS matches the 1s word-fade already shipped in #263. Same
// class-singleton shape as gameMode / messageMode.
import { browser } from '$app/environment';

const DIVE_URL = 'https://pyredivers.com/?dive';
const LEAVE_MS = 1000;

class DiveMode {
	leaving = $state(false);

	constructor() {
		// bfcache: hitting Back after the send-off restores THIS page from
		// memory with `leaving` frozen true — which would leave the whole
		// homepage faded out and pointer-disabled. Reset on restore.
		if (browser) {
			window.addEventListener('pageshow', (e) => {
				if (e.persisted) this.leaving = false;
			});
		}
	}

	start() {
		if (this.leaving) return;
		this.leaving = true;
		window.setTimeout(() => {
			window.location.href = DIVE_URL;
		}, LEAVE_MS);
	}
}

export const diveMode = new DiveMode();
