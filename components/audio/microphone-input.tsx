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
        title={error ?? "toggle live microphone"}
        aria-label={isMicActive ? "stop live microphone" : "start live microphone"}
        className={`absolute right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full border backdrop-blur-md transition md:right-6 md:top-6 ${
          isMicActive
            ? "border-[#7f0f1b] bg-[#2a0408]/90 shadow-[0_0_24px_rgba(90,0,10,0.45)]"
            : "border-amber-200/40 bg-[#24120c]/70 hover:border-amber-200/70"
        } ${error ? "border-amber-400/70" : ""}`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full transition ${
            isMicActive
              ? "bg-[#b10016] shadow-[0_0_12px_rgba(177,0,22,0.9)]"
              : "bg-amber-200/80"
          }`}
        />
      </button>

      {isMicActive ? (
        <div className="pointer-events-none absolute top-4 left-4 z-30 w-64 md:top-6 md:left-6 md:w-72">
          <div className="bg-gradient-to-t from-black/80 via-black/30 to-transparent">
            <AudioVisualizer
              analyser={analyser}
              isActive={isMicActive}
              onEnergySample={setMicEnergy}
              drawBackground={false}
              className="h-36 w-full bg-transparent"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
