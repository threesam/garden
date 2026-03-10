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
    <>
      <button
        type="button"
        onClick={() => void (isMicActive ? stopMicrophone() : startMicrophone())}
        className="fixed right-4 top-1/2 z-40 -translate-y-1/2 rounded-md border border-white/25 bg-black/60 px-4 py-2 text-xs text-zinc-200 shadow-lg backdrop-blur-md transition hover:border-white/50 md:right-6"
      >
        {isMicActive ? "live mic: on" : "live mic: off"}
      </button>

      <div className="fixed top-4 left-4 z-30 w-64 rounded-xl border border-white/10 bg-black/55 p-3 backdrop-blur-md md:top-6 md:left-6 md:w-72">
        <p className="title-up mb-2 font-mono text-[10px] tracking-[0.16em] text-zinc-400">
          mic visualizer
        </p>
        <AudioVisualizer
          analyser={analyser}
          isActive={isMicActive}
          onEnergySample={setMicEnergy}
        />
        {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
      </div>
    </>
  );
}
