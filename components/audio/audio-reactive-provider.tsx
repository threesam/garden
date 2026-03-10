"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface AudioReactiveContextValue {
  energy: number;
  setEnergy: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}

const AudioReactiveContext = createContext<AudioReactiveContextValue | null>(null);

export function AudioReactiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [energy, setEnergy] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const value = useMemo(
    () => ({ energy, setEnergy, isPlaying, setIsPlaying }),
    [energy, isPlaying],
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
