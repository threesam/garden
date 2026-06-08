// POST /api/message — the "message me?" easter-egg endpoint. Receives
// { email, body, website } from the homepage letter form; sends via
// Resend to sam@threesam.com.
//
// Bot mitigation:
//   - `website` is a hidden honeypot. Real users can't see it, so any
//     non-empty value means a bot filled the form; we silently 200 so
//     the bot thinks it succeeded.
//   - Best-effort per-IP rate limit (in-memory; resets per cold start
//     on Vercel, so it's a speed-bump not a fortress).
//   - Strict size + format validation. The limits live in
//     $lib/message-schema so the client form gates on the exact same
//     rules and the two can't drift apart.
//
// Env (set in Vercel):
//   RESEND_API_KEY     — required. Resend dashboard → API Keys.
//   MESSAGE_FROM_EMAIL — optional. From-address; defaults to the safe
//                        Resend sandbox `onboarding@resend.dev` so the
//                        endpoint works before a custom domain is
//                        verified. Set this once threesam.com (or
//                        another owned domain) is verified in Resend.
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { createTtlCache } from '$lib/server/ttl-cache';
import { EMAIL_RX, MAX_EMAIL_LEN, MAX_NAME_LEN, MAX_BODY_LEN } from '$lib/message-schema';
import type { RequestHandler } from './$types';

const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 256;
const TO_EMAIL = 'sam@threesam.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

// Per-IP last-send timestamps. Entries self-expire after RATE_LIMIT_MS and the
// cache evicts the oldest once past the cap, so the map stays bounded on a warm
// serverless instance without a manual sweep.
const rateLimit = createTtlCache<number>({
	ttlMs: RATE_LIMIT_MS,
	maxEntries: RATE_LIMIT_MAX_ENTRIES,
});

// Structured, greppable server log — one JSON line per request outcome so
// Vercel log search can filter by `event`. Deliberately omits message bodies
// and full sender addresses (logs an email *domain* + lengths only) so the
// logs stay diagnostic without hoarding PII.
type LogEvent =
	| 'sent'
	| 'honeypot'
	| 'rate_limited'
	| 'invalid_payload'
	| 'invalid_name'
	| 'invalid_email'
	| 'invalid_message'
	| 'resend_error'
	| 'config_error';
function log(event: LogEvent, fields: Record<string, unknown> = {}) {
	const line = JSON.stringify({ scope: 'api/message', event, ...fields });
	if (event === 'resend_error' || event === 'config_error') console.error(line);
	else if (event === 'rate_limited' || event === 'honeypot') console.warn(line);
	else console.log(line);
}

const emailDomain = (email: string) => email.slice(email.lastIndexOf('@') + 1) || 'unknown';

// Lazy module-scope client. Resend is a thin HTTP wrapper that has no
// connection state worth reusing, but constructing it per request still
// parses the key + sets up the fetch wrapper — skip that on the hot path.
let _resend: Resend | null = null;
function resendClient(): Resend {
	if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
	return _resend;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();

	const payload = (await request.json().catch(() => null)) as
		| { name?: unknown; email?: unknown; body?: unknown; website?: unknown }
		| null;
	if (!payload) {
		log('invalid_payload', { ip });
		error(400, 'invalid payload');
	}

	// Honeypot — bots fill every visible field. Any non-empty `website`
	// means a bot; pretend success so they don't retry.
	if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
		log('honeypot', { ip });
		return json({ ok: true });
	}

	const name = typeof payload.name === 'string' ? payload.name.trim() : '';
	const email = typeof payload.email === 'string' ? payload.email.trim() : '';
	const body = typeof payload.body === 'string' ? payload.body.trim() : '';
	if (!name || name.length > MAX_NAME_LEN) {
		log('invalid_name', { ip, nameLen: name.length });
		error(400, 'invalid name');
	}
	if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RX.test(email)) {
		log('invalid_email', { ip, emailLen: email.length });
		error(400, 'invalid email');
	}
	if (!body || body.length > MAX_BODY_LEN) {
		log('invalid_message', { ip, bodyLen: body.length });
		error(400, 'invalid message');
	}

	// Config check before the rate-limit mark so a misconfigured deploy
	// returns 500 without burning the caller's one-per-minute window.
	if (!env.RESEND_API_KEY) {
		log('config_error', { ip, reason: 'RESEND_API_KEY missing' });
		error(500, 'service unavailable');
	}

	// Mark the IP *before* the send so two near-simultaneous requests from one
	// address can't both fire. A failed send releases the mark (below) so a
	// transient Resend error doesn't lock a real sender out for a minute.
	const last = rateLimit.get(ip);
	if (last !== undefined) {
		log('rate_limited', { ip, sinceMs: Date.now() - last });
		error(429, 'slow down');
	}
	rateLimit.set(ip, Date.now());

	const from = env.MESSAGE_FROM_EMAIL || DEFAULT_FROM;
	const started = Date.now();
	const result = await resendClient()
		.emails.send({
			from,
			to: TO_EMAIL,
			replyTo: email,
			subject: `message me — ${name}`,
			text: `${body}\n\n— ${name}\n${email}`,
		})
		.catch((err: unknown) => {
			// Network/SDK throw (vs the structured { error } below).
			rateLimit.delete(ip);
			log('resend_error', {
				ip,
				from,
				thrown: true,
				message: err instanceof Error ? err.message : String(err),
			});
			error(502, 'failed to send');
		});
	if (result.error) {
		rateLimit.delete(ip);
		log('resend_error', { ip, from, name: result.error.name, message: result.error.message });
		error(502, 'failed to send');
	}

	log('sent', {
		ip,
		id: result.data?.id,
		emailDomain: emailDomain(email),
		bodyLen: body.length,
		ms: Date.now() - started,
	});
	return json({ ok: true });
};
