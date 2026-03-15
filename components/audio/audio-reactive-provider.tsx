"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface AudioBands {
  bass: number;     // ~0-200Hz — kicks, sub
  mid: number;      // ~200-2kHz — vocals, snare body
  high: number;     // ~2k-22kHz — hats, cymbals, air
  onset: number;    // transient spike detection (0 or 1, decays)
}

const EMPTY_BANDS: AudioBands = { bass: 0, mid: 0, high: 0, onset: 0 };

interface AudioReactiveContextValue {
  energy: number;
  bands: AudioBands;
  setBands: (bands: AudioBands) => void;
  setMusicEnergy: (value: number) => void;
  setMicEnergy: (value: number) => void;
  sensitivity: number;
  setSensitivity: (value: number) => void;
  smoothing: number;
  setSmoothing: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  isMicActive: boolean;
  setIsMicActive: (value: boolean) => void;
}

const AudioReactiveContext = createContext<AudioReactiveContextValue | null>(null);
const DEFAULT_SENSITIVITY = 2;
const DEFAULT_SMOOTHING = 0.94;

export function AudioReactiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [micEnergy, setMicEnergy] = useState(0);
  const [sensitivityState, setSensitivityState] = useState(DEFAULT_SENSITIVITY);
  const [smoothingState, setSmoothingState] = useState(DEFAULT_SMOOTHING);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const bandsRef = useRef<AudioBands>(EMPTY_BANDS);
  const [bands, setBandsState] = useState<AudioBands>(EMPTY_BANDS);
  const energy = Math.max(musicEnergy, micEnergy);

  const setSensitivity = useCallback((value: number) => {
    setSensitivityState(value);
  }, []);
  const setSmoothing = useCallback((value: number) => {
    setSmoothingState(value);
  }, []);
  const setBands = useCallback((b: AudioBands) => {
    bandsRef.current = b;
    setBandsState(b);
  }, []);

  const value = useMemo(
    () => ({
      energy,
      bands,
      setBands,
      setMusicEnergy,
      setMicEnergy,
      sensitivity: sensitivityState,
      setSensitivity,
      smoothing: smoothingState,
      setSmoothing,
      isPlaying,
      setIsPlaying,
      isMicActive,
      setIsMicActive,
    }),
    [energy, bands, setBands, isPlaying, isMicActive, sensitivityState, smoothingState, setSensitivity, setSmoothing],
  );

  return (
    <AudioReactiveContext.Provider value={value}>
      {children}
    </AudioReactiveContext.Provider>
  );
}

export function useAudioReactive() {
  const context = useContext(AudioReactiveContext);
  if (!context) {
    throw new Error(
      "useAudioReactive must be used within an AudioReactiveProvider",
    );
  }
  return context;
}
