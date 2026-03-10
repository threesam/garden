"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AudioReactiveContextValue {
  energy: number;
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
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PRODUCTION_SENSITIVITY = 2;
const PRODUCTION_SMOOTHING = 1;
const DEFAULT_SENSITIVITY = 2;
const DEFAULT_SMOOTHING = 0.94;

export function AudioReactiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [micEnergy, setMicEnergy] = useState(0);
  const [sensitivityState, setSensitivityState] = useState(
    IS_PRODUCTION ? PRODUCTION_SENSITIVITY : DEFAULT_SENSITIVITY,
  );
  const [smoothingState, setSmoothingState] = useState(
    IS_PRODUCTION ? PRODUCTION_SMOOTHING : DEFAULT_SMOOTHING,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const energy = Math.max(musicEnergy, micEnergy);

  const setSensitivity = useCallback((value: number) => {
    setSensitivityState(IS_PRODUCTION ? PRODUCTION_SENSITIVITY : value);
  }, []);
  const setSmoothing = useCallback((value: number) => {
    setSmoothingState(IS_PRODUCTION ? PRODUCTION_SMOOTHING : value);
  }, []);

  const value = useMemo(
    () => ({
      energy,
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
    [energy, isPlaying, isMicActive, sensitivityState, smoothingState, setSensitivity, setSmoothing],
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
