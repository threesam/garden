import { promises as fs } from "node:fs";
import path from "node:path";

import type { CounterType, CountersState } from '$lib/types/counters';
import { EMPTY_COUNTERS } from '$lib/types/counters';

const COUNTER_FILE = path.join(process.cwd(), "data", "counters.json");

export async function readCounters(): Promise<CountersState> {
  try {
    const raw = await fs.readFile(COUNTER_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CountersState>;
    return {
      totalVisitors: Number(parsed.totalVisitors ?? 0),
      generativeArtViews: Number(parsed.generativeArtViews ?? 0),
      musicPlays: Number(parsed.musicPlays ?? 0),
      updatedAt: parsed.updatedAt ?? EMPTY_COUNTERS.updatedAt,
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return { ...EMPTY_COUNTERS };
    throw err;
  }
}

export async function incrementCounter(type: CounterType) {
  const counters = await readCounters();

  if (type === "visitor") counters.totalVisitors += 1;
  if (type === "artView") counters.generativeArtViews += 1;
  if (type === "musicPlay") counters.musicPlays += 1;

  counters.updatedAt = new Date().toISOString();

  await fs.mkdir(path.dirname(COUNTER_FILE), { recursive: true });
  await fs.writeFile(COUNTER_FILE, JSON.stringify(counters, null, 2), "utf-8");
  return counters;
}
