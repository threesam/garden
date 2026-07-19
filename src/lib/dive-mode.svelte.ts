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

// The one hand-off URL, carrying ?test through to pyre so a test session
// ejects analytics on both sides (pyre reads has('test') independent of
// ?dive). Used by both start() and the tagline anchor's href, so every
// path — auto, click, open-in-new-tab, no-JS — is consistent.
export function diveUrl(test: string | null): string {
	return test === null ? DIVE_URL : `${DIVE_URL}&test=${encodeURIComponent(test)}`;
}

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
		const test = browser ? new URLSearchParams(location.search).get('test') : null;
		const go = () => {
			window.location.href = diveUrl(test);
		};
		// reduced motion: skip the fade, hand off immediately. Single home
		// for this decision so the click and auto-test paths both honor it.
		if (browser && matchMedia('(prefers-reduced-motion: reduce)').matches) {
			go();
			return;
		}
		window.setTimeout(go, LEAVE_MS);
	}
}

export const diveMode = new DiveMode();
