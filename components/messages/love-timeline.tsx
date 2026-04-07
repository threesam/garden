"use client";

import modulesData from "@/data/messages/dianchik/modules-data.json";

interface LoveFirst {
  date: string;
  sender: string;
  text: string;
}

const firstSam = (modulesData as Record<string, unknown>).love_first_sam as LoveFirst | null;
const firstDia = (modulesData as Record<string, unknown>).love_first_dia as LoveFirst | null;
const count = modulesData.love_count as number;

export function LoveTimeline() {
  if (!firstSam && !firstDia) return null;

  return (
    <div className="my-12 rounded-2xl border border-white/5 bg-black p-5 md:p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          &quot;i love you&quot;
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          {count.toLocaleString()} times
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {firstSam && (
          <div className="rounded-lg border border-white/5 p-4">
            <span className="font-mono text-[10px] text-zinc-500">sam, first</span>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              &quot;{firstSam.text}&quot;
            </p>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              {firstSam.date}
            </p>
          </div>
        )}
        {firstDia && (
          <div className="rounded-lg border border-white/5 p-4">
            <span className="font-mono text-[10px] text-zinc-500">dianchik, first</span>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              &quot;{firstDia.text}&quot;
            </p>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              {firstDia.date}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
