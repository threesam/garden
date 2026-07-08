// "message me?" easter egg state. Clicking the revealed message tail in
// the bottom-left wordmark enters a letter-writing mode: gallery + tagline
// + wordmark fade out, a cream letter card appears (centered on desktop,
// fullscreen on mobile), and the bottom-right action morphs from
// "message me?" to "send it?" once both fields are filled. Click sends
// via /api/message (Resend → sam@threesam.com).
//
// Flags driving the UI:
//
//   active  — fade gallery + wordmark + tagline; reveal the letter card
//             and the bottom-right action; coin top-right becomes "x"
//   sending — post in flight; the action shows "sending..."
//   sent    — post succeeded; brief "sent it!" beat before auto-close
//   error   — null when fine; string when the post failed

import { EMAIL_RX, MAX_EMAIL_LEN, MAX_NAME_LEN, MAX_BODY_LEN } from '$lib/message-schema';

const CLOSE_DELAY_MS = 500;
const SENT_HOLD_MS = 1500;

// A thrown umami.track() must never reach send()'s own try/catch — that
// would flip an already-successful send to "failed to send" and skip the
// auto-close timer. Analytics failures are never this form's problem.
function safeTrack(name: string) {
	try {
		window.umami?.track(name);
	} catch {
		/* ignored */
	}
}

class MessageMode {
	active = $state(false);
	// "message me?" revealed in the wordmark (the "m" was clicked) but the
	// letter isn't open yet. Drives the same gallery + tagline fade as the
	// snake game, so the reveal reads as entering a mode — not a label swap.
	revealing = $state(false);
	body = $state('');
	name = $state('');
	email = $state('');
	// Honeypot — bound to a hidden field the user never sees. Bots that fill
	// every input trip it; the server silently 200s without sending.
	website = $state('');
	sending = $state(false);
	sent = $state(false);
	error = $state<string | null>(null);
	private timers: number[] = [];

	private sched(ms: number, fn: () => void) {
		const id = window.setTimeout(fn, ms);
		this.timers.push(id);
	}

	private clearTimers() {
		for (const id of this.timers) clearTimeout(id);
		this.timers = [];
	}

	get formValid() {
		const name = this.name.trim();
		const email = this.email.trim();
		const body = this.body.trim();
		return (
			body.length > 0 &&
			body.length <= MAX_BODY_LEN &&
			name.length > 0 &&
			name.length <= MAX_NAME_LEN &&
			email.length <= MAX_EMAIL_LEN &&
			EMAIL_RX.test(email)
		);
	}

	start() {
		// Funnel entry for the message form — pairs with message-sent /
		// message-error so open → sent conversion is measurable.
		safeTrack('message-open');
		this.clearTimers();
		this.active = true;
		this.sending = false;
		this.sent = false;
		this.error = null;
	}

	stop() {
		this.clearTimers();
		this.active = false;
		this.revealing = false;
		// Reset the form only after the close animation completes so the
		// fields don't visibly clear while the card is still fading out.
		this.sched(CLOSE_DELAY_MS, () => {
			this.body = '';
			this.name = '';
			this.email = '';
			this.website = '';
			this.sending = false;
			this.sent = false;
			this.error = null;
		});
	}

	async send() {
		if (this.sending || this.sent || !this.formValid) return;
		this.sending = true;
		this.error = null;
		try {
			const res = await fetch('/api/message', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: this.name.trim(),
					email: this.email.trim(),
					body: this.body.trim(),
					website: this.website,
				}),
			});
			if (!res.ok) {
				// SvelteKit's error() returns { message }, not { error }.
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				this.error = data?.message || 'failed to send';
				safeTrack('message-error');
				return;
			}
			this.sent = true;
			// Honeypot responses are also silent 200s, so this counts accepted
			// submissions, not guaranteed sends — same ceiling as the repo's own
			// quiet-list event. Not worth server-side emission for one form.
			safeTrack('message-sent');
			this.sched(SENT_HOLD_MS, () => this.stop());
		} catch {
			this.error = 'failed to send';
			safeTrack('message-error');
		} finally {
			this.sending = false;
		}
	}
}

export const messageMode = new MessageMode();
