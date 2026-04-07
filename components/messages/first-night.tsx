"use client";

import modulesData from "@/data/messages/dianchik/modules-data.json";

interface ExchangeMsg {
  sender: string;
  text: string;
}

interface FirstNightData {
  date: string;
  album: string;
  exchange: ExchangeMsg[];
}

const firstNight = (modulesData as Record<string, unknown>).first_night as FirstNightData | null;

export function FirstNight() {
  if (!firstNight) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          first night
        </span>
        <span className="font-mono text-[10px] text-zinc-600">
          {firstNight.album}
        </span>
      </div>
      <p className="mb-3 font-mono text-[10px] text-zinc-500">{firstNight.date}</p>
      <div className="space-y-2">
        {firstNight.exchange.map((msg, i) =>
          msg.sender === "ellipsis" ? (
            <div key={i} className="py-1 text-center font-mono text-[10px] text-zinc-600">
              ...
            </div>
          ) : (
            <div
              key={i}
              className={`flex ${msg.sender === "sam" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.sender === "sam"
                    ? "bg-white/10 text-zinc-200"
                    : "bg-amber-900/20 text-zinc-300"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
