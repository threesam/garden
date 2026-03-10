"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import { AudioVisualizer } from "@/components/audio/audio-visualizer";

export function MicrophoneInput() {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const { isMicActive, setIsMicActive, setMicEnergy } = useAudioReactive();

  const stopMicrophone = useCallback(async () => {
    setIsMicActive(false);
    setMicEnergy(0);
    setAnalyser(null);

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (contextRef.current) {
      await contextRef.current.close().catch(() => undefined);
      contextRef.current = null;
    }
  }, [setIsMicActive, setMicEnergy]);

  const startMicrophone = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone API unavailable in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const context = new window.AudioContext();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 1024;
      analyserNode.smoothingTimeConstant = 0.88;

      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyserNode);

      streamRef.current = stream;
      contextRef.current = context;
      sourceRef.current = sourceNode;
      setAnalyser(analyserNode);
      setIsMicActive(true);
    } catch {
      setError("Microphone permission denied or unavailable.");
    }
  }, [setIsMicActive]);

  useEffect(() => {
    return () => {
      void stopMicrophone();
    };
  }, [stopMicrophone]);

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
            live microphone
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Route ambient sound to the generative particle field.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void (isMicActive ? stopMicrophone() : startMicrophone())}
          className="rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-200 hover:border-white/40"
        >
          {isMicActive ? "stop mic" : "start mic"}
        </button>
      </div>

      <AudioVisualizer
        analyser={analyser}
        isActive={isMicActive}
        onEnergySample={setMicEnergy}
      />

      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
