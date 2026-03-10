import { NextResponse } from "next/server";

import { incrementCounter, readCounters } from "@/lib/server/counter-store";
import type { CounterType } from "@/types/counters";

export const runtime = "nodejs";

export async function GET() {
  const counters = await readCounters();
  return NextResponse.json(counters, { status: 200 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { type?: CounterType }
    | null;

  if (!body?.type) {
    return NextResponse.json(
      { error: "Missing counter type. Use visitor | artView | musicPlay." },
      { status: 400 },
    );
  }

  const validTypes: CounterType[] = ["visitor", "artView", "musicPlay"];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid counter type." }, { status: 400 });
  }

  const counters = await incrementCounter(body.type);
  return NextResponse.json(counters, { status: 200 });
}
