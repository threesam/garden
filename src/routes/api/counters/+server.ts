import { json, error } from '@sveltejs/kit';
import { readCounters, incrementCounter } from '$lib/server/counter-store';
import type { CounterType } from '$lib/types/counters';

const VALID_TYPES: CounterType[] = ['visitor', 'artView', 'musicPlay'];

export async function GET() {
  const counters = await readCounters();
  return json(counters);
}

export async function POST({ request }) {
  const body = (await request.json().catch(() => null)) as { type?: CounterType } | null;

  if (!body?.type) {
    error(400, 'Missing counter type. Use visitor | artView | musicPlay.');
  }

  if (!VALID_TYPES.includes(body.type)) {
    error(400, 'Invalid counter type.');
  }

  const counters = await incrementCounter(body.type);
  return json(counters);
}
