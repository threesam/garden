"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import { AudioVisualizer } from "@/components/audio/audio-visualizer";
import type { CountersState } from "@/types/counters";

const AUDIO_SRC = "/audio/placeholder-track.mp3";

const initialCounters: CountersState = {
  totalVisitors: 0,
  generativeArtViews: 0,
  musicPlays: 0,
  updatedAt: "",
};

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counters, setCounters] = useState<CountersState>(initialCounters);
  const { setMusicEnergy, setIsPlaying, isPlaying } = useAudioReactive();

  const fetchCounters = useCallback(async () => {
    const response = await fetch("/api/counters", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as CountersState;
    setCounters(payload);
  }, []);

  const incrementPlayCounter = useCallback(async () => {
    await fetch("/api/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "musicPlay" }),
    });
    await fetchCounters();
  }, [fetchCounters]);

  const setupAudioGraph = useCallback(async () => {
    if (!audioRef.current) return;
    if (analyserRef.current) return;

    const context = new window.AudioContext();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.84;

    const sourceNode = context.createMediaElementSource(audioRef.current);
    sourceNode.connect(analyserNode);
    analyserNode.connect(context.destination);

    audioContextRef.current = context;
    analyserRef.current = analyserNode;
    sourceRef.current = sourceNode;
    setAnalyser(analyserNode);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCounters();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchCounters]);

  useEffect(() => {
    return () => {
      setMusicEnergy(0);
      setIsPlaying(false);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [setMusicEnergy, setIsPlaying]);

  const onPlay = async () => {
    setError(null);
    try {
      await setupAudioGraph();
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      setIsPlaying(true);
      await incrementPlayCounter();
    } catch {
      setError("Audio pipeline failed to initialize.");
    }
  };

  const onPause = () => {
    setIsPlaying(false);
    setMusicEnergy(0);
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
            music interface
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Local source: <span className="font-mono">{AUDIO_SRC}</span>
          </p>
        </div>
        <div className="text-right text-sm text-zinc-300">
          <p>plays: {counters.musicPlays}</p>
          <p>visitors who experienced this: {counters.generativeArtViews}</p>
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={AUDIO_SRC}
        className="w-full"
        onPlay={() => void onPlay()}
        onPause={onPause}
        onEnded={onPause}
        onError={() => {
          setError(
            "Audio file missing. Drop a local track at /public/audio/placeholder-track.mp3",
          );
        }}
      />

      <AudioVisualizer
        analyser={analyser}
        isActive={isPlaying}
        onEnergySample={setMusicEnergy}
      />

      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
