// Shape of src/lib/sounds/manifest.json produced by scripts/sounds/ingest.mjs.

export type AudioSource = "local" | "soundcloud";

export interface Version {
  date: string; // "2025-12-01"
  variant: string; // "main" | "mixed" | "limited" | "instrumental" | …
  src: string; // "/audio/sounds/demos/404/silent/2025-03-23__mixed.mp3"
  source: AudioSource;
  lossy: boolean; // true for soundcloud 128k rips
}

export interface Song {
  slug: string;
  title: string;
  versions: Version[]; // newest first
  latest: string; // newest version date — sort key
  cover: string | null; // cover art path, or null → "?" placeholder
  untitled: boolean;
}

export interface Project {
  id: string; // "404" | "fa11faster"
  label: string;
  songs: Song[];
}

export interface Cue {
  timecode: string; // "00:10:04–00:11:00"
  start: number; // seconds, for ordering
  src: string;
  date: string;
}

export interface SoundsManifest {
  demos: { eps: Project[]; singles: Song[] };
  scores: { hmbm: Cue[]; skw: Song[] };
}
