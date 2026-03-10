"use client";

import { useEffect, useState } from "react";

import type { CountersState } from "@/types/counters";

const POLL_MS = 15000;

const defaultCounters: CountersState = {
  totalVisitors: 0,
  generativeArtViews: 0,
  musicPlays: 0,
  updatedAt: "",
};

export function CounterOverview() {
  const [counters, setCounters] = useState<CountersState>(defaultCounters);

  useEffect(() => {
    let mounted = true;

    const read = async () => {
      const response = await fetch("/api/counters", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as CountersState;
      if (mounted) setCounters(payload);
    };

    void read();
    const interval = window.setInterval(read, POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="section-shell mx-auto mt-12 max-w-6xl rounded-2xl p-6 md:p-8">
      <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        network counters
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <CounterTile label="total visitors" value={counters.totalVisitors} />
        <CounterTile
          label="generative art viewers"
          value={counters.generativeArtViews}
        />
        <CounterTile label="music plays" value={counters.musicPlays} />
      </div>
    </section>
  );
}

function CounterTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
