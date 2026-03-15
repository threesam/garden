"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import { AudioVisualizer } from "@/components/audio/audio-visualizer";
import type { CountersState } from "@/types/counters";

const TRACKS = [
  { src: "/audio/silent.mp3", title: "silent" },
  { src: "/audio/natural_causes.mp3", title: "natural causes" },
  { src: "/audio/identity_theft_is_not_a_joke.mp3", title: "identity theft is not a joke" },
] as const;

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

  const [trackIndex, setTrackIndex] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counters, setCounters] = useState<CountersState>(initialCounters);
  const { setMusicEnergy, setIsPlaying, isPlaying } = useAudioReactive();
  const track = TRACKS[trackIndex];

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

  const switchTrack = (index: number) => {
    if (index === trackIndex) return;
    const audio = audioRef.current;
    const wasPlaying = audio && !audio.paused;
    if (wasPlaying) {
      audio.pause();
    }
    setTrackIndex(index);
    setError(null);
    // let React update src, then play if it was playing
    if (wasPlaying) {
      requestAnimationFrame(() => {
        void audio?.play();
      });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
            music interface
          </h3>
        </div>
        <div className="text-right text-sm text-zinc-300">
          <p>plays: {counters.musicPlays}</p>
          <p>visitors who experienced this: {counters.generativeArtViews}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRACKS.map((t, i) => (
          <button
            key={t.src}
            type="button"
            onClick={() => switchTrack(i)}
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] transition ${
              i === trackIndex
                ? "bg-amber-200/20 text-amber-100"
                : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={track.src}
        className="w-full"
        onPlay={() => void onPlay()}
        onPause={onPause}
        onEnded={onPause}
        onError={() => {
          setError(
            `audio file missing — drop ${track.title}.mp3 in public/audio/`,
          );
        }}
      />

      <AudioVisualizer
        analyser={analyser}
        isActive={isPlaying}
        onEnergySample={setMusicEnergy}
        energyBoost={1.6}
      />

      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
