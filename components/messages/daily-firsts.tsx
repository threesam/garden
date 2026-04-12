"use client";

import { useState } from "react";
import modulesData from "@/data/messages/dianchik/modules-data.json";

interface DailyFirst {
  date: string;
  sender: string;
  text: string;
  hour: number;
  minute?: number;
}

const firsts = modulesData.daily_firsts_sample as DailyFirst[];

export function DailyFirsts() {
  const [page, setPage] = useState(0);
  const perPage = 12;
  const totalPages = Math.ceil(firsts.length / perPage);
  const slice = firsts.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          first message of the day
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          {firsts.length} days
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {slice.map((f) => (
          <div
            key={f.date}
            className="rounded-lg border border-zinc-200 p-3"
          >
            <p className="text-sm leading-relaxed text-black line-clamp-2">
              &quot;{f.text}&quot;
            </p>
            <p className="mt-2 font-mono text-[9px] text-zinc-500">
              {f.sender.split(" ")[0].toLowerCase()} — {f.date}, {f.hour}:{String(f.minute ?? 0).padStart(2, "0")}
            </p>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-mono text-[10px] text-zinc-500 hover:text-black disabled:opacity-30"
          >
            prev
          </button>
          <span className="font-mono text-[10px] text-zinc-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="font-mono text-[10px] text-zinc-500 hover:text-black disabled:opacity-30"
          >
            next
          </button>
        </div>
      )}
    </div>
  );
}
