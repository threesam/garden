"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface AudioReactiveContextValue {
  energy: number;
  setMusicEnergy: (value: number) => void;
  setMicEnergy: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  isMicActive: boolean;
  setIsMicActive: (value: boolean) => void;
}

const AudioReactiveContext = createContext<AudioReactiveContextValue | null>(null);

export function AudioReactiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [micEnergy, setMicEnergy] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const energy = Math.max(musicEnergy, micEnergy);

  const value = useMemo(
    () => ({
      energy,
      setMusicEnergy,
      setMicEnergy,
      isPlaying,
      setIsPlaying,
      isMicActive,
      setIsMicActive,
    }),
    [energy, isPlaying, isMicActive],
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
