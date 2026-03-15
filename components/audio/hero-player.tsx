"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import { AudioVisualizer } from "@/components/audio/audio-visualizer";

const TRACKS = [
  { src: "/audio/silent.mp3", title: "silent" },
  { src: "/audio/natural_causes.mp3", title: "natural causes" },
  { src: "/audio/identity_theft_is_not_a_joke.mp3", title: "identity theft is not a joke" },
] as const;

export function HeroPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  const [trackIndex, setTrackIndex] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { setMusicEnergy, setBands, setIsPlaying, isPlaying } = useAudioReactive();
  const track = TRACKS[trackIndex];

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
    return () => {
      setMusicEnergy(0);
      setIsPlaying(false);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [setMusicEnergy, setIsPlaying]);

  // progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let rafId = 0;
    const tick = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await setupAudioGraph();
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      // silent fail
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => {
    setIsPlaying(false);
    setMusicEnergy(0);
  };

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = scrubRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const switchTrack = (index: number) => {
    if (index === trackIndex) return;
    const audio = audioRef.current;
    const wasPlaying = audio && !audio.paused;
    if (wasPlaying) audio.pause();
    setTrackIndex(index);
    setProgress(0);
    if (wasPlaying) {
      requestAnimationFrame(() => {
        void audio?.play();
      });
    }
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        src={track.src}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onPause}
      />

      {/* hidden visualizer for energy extraction */}
      <AudioVisualizer
        analyser={analyser}
        isActive={isPlaying}
        onEnergySample={setMusicEnergy}
        onBandsSample={setBands}
        energyBoost={1.6}
        className="hidden"
      />

      {/* track selector — top of player area */}
      <div className="pointer-events-auto mb-2 flex flex-wrap gap-1">
        {TRACKS.map((t, i) => (
          <button
            key={t.src}
            type="button"
            onClick={() => switchTrack(i)}
            className={`rounded-full px-2 py-1 font-mono text-[9px] tracking-[0.12em] transition ${
              i === trackIndex
                ? "bg-amber-200/20 text-amber-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* play/pause + scrub bar */}
      <div className="pointer-events-auto flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-zinc-300 backdrop-blur-sm transition hover:border-white/30 hover:text-zinc-100"
          aria-label={isPlaying ? "pause" : "play"}
        >
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <rect x="1" y="0" width="3.5" height="14" rx="1" />
              <rect x="7.5" y="0" width="3.5" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <path d="M1 0.5L11 7L1 13.5V0.5Z" />
            </svg>
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] text-zinc-500">
            {formatTime(progress)}
          </span>
          <div
            ref={scrubRef}
            className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/10"
            onPointerDown={scrub}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400/60"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[9px] text-zinc-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </>
  );
}
