"use client";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

export function ReactiveControls() {
  const { sensitivity, setSensitivity, smoothing, setSmoothing } =
    useAudioReactive();

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-6">
      <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
        reaction controls
      </h3>

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-zinc-400">
          <span>sensitivity</span>
          <span className="font-mono">{sensitivity.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.05}
          value={sensitivity}
          onChange={(event) => setSensitivity(Number(event.target.value))}
          className="w-full accent-amber-400"
        />
      </label>

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-zinc-400">
          <span>smoothing</span>
          <span className="font-mono">{smoothing.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={0.995}
          step={0.005}
          value={smoothing}
          onChange={(event) => setSmoothing(Number(event.target.value))}
          className="w-full accent-red-500"
        />
      </label>

      <button
        type="button"
        onClick={() => {
          setSensitivity(2);
          setSmoothing(0.94);
        }}
        className="rounded-md border border-white/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-zinc-300 hover:border-white/40"
      >
        reset response
      </button>
    </div>
  );
}
