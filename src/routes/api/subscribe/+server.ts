// POST /api/subscribe — the quiet list ("guestbook") endpoint. Receives
// { email, website, placement } from the end-of-content form on /thoughts
// essays and /sounds; forwards to the self-hosted listmonk's PUBLIC
// subscription endpoint (garden list, double opt-in).
//
// This is deliberately NOT growth machinery: the form only exists at the
// bottom of finished content, and this proxy exists so the page never names
// the listmonk host (the dead end keeps its seams hidden) and so the same
// honeypot + rate-limit stance as /api/message guards the box.
//
// No credentials involved — the listmonk endpoint is public and the list
// UUID is the same value any public subscribe form would carry.
import { json, error } from '@sveltejs/kit';
import { createTtlCache } from '$lib/server/ttl-cache';
import { EMAIL_RX, MAX_EMAIL_LEN } from '$lib/message-schema';
import type { RequestHandler } from './$types';

const LISTMONK_URL = 'https://mail.sixtom.com';
// `garden` list — essays + first listens. Double opt-in: the confirmation
// click is itself a digger filter. Never receives sixtom/commercial mail.
const GARDEN_LIST_UUID = '7d4b7c09-3619-404c-b0bb-1dae0654829b';

const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 256;
const UPSTREAM_TIMEOUT_MS = 5000;
const MAX_PLACEMENT_LEN = 64;

// Per-IP last-attempt timestamps; same bounded TTL cache as /api/message.
const rateLimit = createTtlCache<number>({
	ttlMs: RATE_LIMIT_MS,
	maxEntries: RATE_LIMIT_MAX_ENTRIES,
});

// Structured one-line logs, same shape as api/message: email *domain* only.
type LogEvent = 'subscribed' | 'honeypot' | 'rate_limited' | 'invalid_payload' | 'invalid_email' | 'upstream_error';
function log(event: LogEvent, fields: Record<string, unknown> = {}) {
	const line = JSON.stringify({ scope: 'api/subscribe', event, ...fields });
	if (event === 'upstream_error') console.error(line);
	else if (event === 'rate_limited' || event === 'honeypot') console.warn(line);
	else console.log(line);
}

const emailDomain = (email: string) => email.slice(email.lastIndexOf('@') + 1) || 'unknown';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();

	const payload = (await request.json().catch(() => null)) as
		| { email?: unknown; website?: unknown; placement?: unknown }
		| null;
	if (!payload) {
		log('invalid_payload', { ip });
		error(400, 'invalid payload');
	}

	// Honeypot — any non-empty `website` means a bot; pretend success so it
	// doesn't retry, and nothing reaches the list.
	if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
		log('honeypot', { ip });
		return json({ ok: true });
	}

	const email = typeof payload.email === 'string' ? payload.email.trim() : '';
	if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RX.test(email)) {
		log('invalid_email', { ip, emailLen: email.length });
		error(400, 'invalid email');
	}
	const placement =
		typeof payload.placement === 'string' ? payload.placement.slice(0, MAX_PLACEMENT_LEN) : '';

	const last = rateLimit.get(ip);
	if (last !== undefined) {
		log('rate_limited', { ip, sinceMs: Date.now() - last });
		error(429, 'slow down');
	}
	rateLimit.set(ip, Date.now());

	const started = Date.now();
	const res = await fetch(`${LISTMONK_URL}/api/public/subscription`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email, list_uuids: [GARDEN_LIST_UUID] }),
		signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
	}).catch((err: unknown) => {
		// Release the mark so a transient outage doesn't lock a real digger out.
		rateLimit.delete(ip);
		log('upstream_error', {
			ip,
			thrown: true,
			message: err instanceof Error ? err.message : String(err),
		});
		error(502, 'failed to subscribe');
	});
	if (!res.ok) {
		rateLimit.delete(ip);
		log('upstream_error', { ip, status: res.status });
		error(502, 'failed to subscribe');
	}

	log('subscribed', { ip, emailDomain: emailDomain(email), placement, ms: Date.now() - started });
	return json({ ok: true });
};
