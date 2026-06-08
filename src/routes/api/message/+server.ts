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
//   - Strict size + format validation; nothing about the schema is
//     forgiving.
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
import type { RequestHandler } from './$types';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_LEN = 5000;
const MAX_EMAIL_LEN = 200;
const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 256;
const TO_EMAIL = 'sam@threesam.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

const lastSent = new Map<string, number>();

// Structured, greppable server log — one JSON line per request outcome so
// Vercel log search can filter by `event`. Deliberately omits message bodies
// and full sender addresses (logs an email *domain* + lengths only) so the
// logs stay diagnostic without hoarding PII.
type LogEvent =
	| 'sent'
	| 'honeypot'
	| 'rate_limited'
	| 'invalid_payload'
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

// Evict stale rate-limit entries inline; without this `lastSent` grows
// unboundedly across a warm serverless instance. Costs O(n) but only
// runs once the map is past its soft cap.
function sweepRateLimit(now: number) {
	if (lastSent.size < RATE_LIMIT_MAX_ENTRIES) return;
	for (const [ip, ts] of lastSent) {
		if (now - ts > RATE_LIMIT_MS) lastSent.delete(ip);
	}
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();

	const payload = (await request.json().catch(() => null)) as
		| { email?: unknown; body?: unknown; website?: unknown }
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

	const email = typeof payload.email === 'string' ? payload.email.trim() : '';
	const body = typeof payload.body === 'string' ? payload.body.trim() : '';
	if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RX.test(email)) {
		log('invalid_email', { ip, emailLen: email.length });
		error(400, 'invalid email');
	}
	if (!body || body.length > MAX_BODY_LEN) {
		log('invalid_message', { ip, bodyLen: body.length });
		error(400, 'invalid message');
	}

	const now = Date.now();
	const last = lastSent.get(ip);
	if (last && now - last < RATE_LIMIT_MS) {
		log('rate_limited', { ip, sinceMs: now - last });
		error(429, 'slow down');
	}
	// Mark the IP *before* the await so two near-simultaneous requests
	// from the same address don't both read undefined and both send.
	lastSent.set(ip, now);
	sweepRateLimit(now);

	if (!env.RESEND_API_KEY) {
		log('config_error', { ip, reason: 'RESEND_API_KEY missing' });
		error(500, 'service unavailable');
	}

	const from = env.MESSAGE_FROM_EMAIL || DEFAULT_FROM;
	const result = await resendClient().emails.send({
		from,
		to: TO_EMAIL,
		replyTo: email,
		subject: `message me — ${email}`,
		text: body,
	});
	if (result.error) {
		log('resend_error', { ip, from, name: result.error.name, message: result.error.message });
		error(502, 'failed to send');
	}

	log('sent', {
		ip,
		id: result.data?.id,
		emailDomain: emailDomain(email),
		bodyLen: body.length,
		ms: Date.now() - now,
	});
	return json({ ok: true });
};
