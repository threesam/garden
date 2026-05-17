export type CounterType = "visitor" | "artView" | "musicPlay";

export interface CountersState {
  totalVisitors: number;
  generativeArtViews: number;
  musicPlays: number;
  updatedAt: string;
}

export const EMPTY_COUNTERS: CountersState = {
  totalVisitors: 0,
  generativeArtViews: 0,
  musicPlays: 0,
  updatedAt: new Date(0).toISOString(),
};
