"use client";

import dynamic from "next/dynamic";

import { MicrophoneInput } from "@/components/audio/microphone-input";
import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

const HeroCanvas = dynamic(() => import("@/components/hero/hero-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
      loading generative system...
    </div>
  ),
});

export function GenerativeHero() {
  const { energy, isPlaying, isMicActive, sensitivity, smoothing } =
    useAudioReactive();

  return (
    <section className="relative h-screen w-full overflow-hidden border-b border-white/10">
      <HeroCanvas />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,153,87,0.22),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(196,58,34,0.22),transparent_45%)]" />
      <MicrophoneInput />
      <div className="absolute bottom-8 left-6 right-6 font-mono text-xs tracking-[0.22em] text-zinc-300 md:left-10 md:right-10">
        <div className="title-up">threesam // personal laboratory</div>
        <div className="mt-2 text-[10px] tracking-[0.18em] text-zinc-400">
          audio-link: {isPlaying || isMicActive ? "active" : "idle"} · reactive-energy:{" "}
          {energy.toFixed(2)} · sens: {sensitivity.toFixed(2)}x · smooth:{" "}
          {smoothing.toFixed(2)}
        </div>
      </div>
    </section>
  );
}
