// Plugin settings with defaults
export interface VoiceJournalSettings {
  openaiApiKey: string;
  whisperBaseUrl: string;      // default: 'http://localhost:8000' for faster-whisper-server
  claudePath: string;          // absolute path to claude CLI (needed when Obsidian can't find it via PATH)
  journalFolder: string;       // default: 'journal/'
  weeklyFolder: string;        // default: 'journal/weekly/'
  silenceThreshold: number;    // dB level, default: -45
  silenceDuration: number;     // ms, default: 1500
  autoWeeklyDigest: boolean;   // default: false
}

export const DEFAULT_SETTINGS: VoiceJournalSettings = {
  openaiApiKey: '',
  whisperBaseUrl: 'http://localhost:8000',
  claudePath: 'claude',
  journalFolder: 'journal/',
  weeklyFolder: 'journal/weekly/',
  silenceThreshold: -45,
  silenceDuration: 1500,
  autoWeeklyDigest: false,
};

// Session recording state
export type PluginStatus = 'idle' | 'recording' | 'listening' | 'processing';

export interface SessionState {
  transcriptSegments: string[];
  questionsAsked: string[];
  status: PluginStatus;
}

// Result from Claude entry classification
export interface ClassificationResult {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  oneLineSummary: string;
}

// Journal entry metadata for digest queries
export interface JournalEntry {
  title: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
  tags: string[];
  mood: string;
  themes: string[];
  fullContent: string;
  filePath: string;
}
