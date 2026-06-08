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

import { EMAIL_RX, MAX_EMAIL_LEN, MAX_BODY_LEN } from '$lib/message-schema';

const CLOSE_DELAY_MS = 500;
const SENT_HOLD_MS = 1500;

class MessageMode {
	active = $state(false);
	email = $state('');
	body = $state('');
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
		const email = this.email.trim();
		const body = this.body.trim();
		return (
			body.length > 0 &&
			body.length <= MAX_BODY_LEN &&
			email.length <= MAX_EMAIL_LEN &&
			EMAIL_RX.test(email)
		);
	}

	start() {
		this.clearTimers();
		this.active = true;
		this.sending = false;
		this.sent = false;
		this.error = null;
	}

	stop() {
		this.clearTimers();
		this.active = false;
		// Reset the form only after the close animation completes so the
		// fields don't visibly clear while the card is still fading out.
		this.sched(CLOSE_DELAY_MS, () => {
			this.email = '';
			this.body = '';
			this.website = '';
			this.sending = false;
			this.sent = false;
			this.error = null;
		});
	}

	async send() {
		if (this.sending || !this.formValid) return;
		this.sending = true;
		this.error = null;
		try {
			const res = await fetch('/api/message', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: this.email.trim(),
					body: this.body.trim(),
					website: this.website,
				}),
			});
			if (!res.ok) {
				// SvelteKit's error() returns { message }, not { error }.
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				this.error = data?.message || 'failed to send';
				return;
			}
			this.sent = true;
			this.sched(SENT_HOLD_MS, () => this.stop());
		} catch {
			this.error = 'failed to send';
		} finally {
			this.sending = false;
		}
	}
}

export const messageMode = new MessageMode();
