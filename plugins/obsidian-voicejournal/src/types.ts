// Plugin settings with defaults
export interface VoiceJournalSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  journalFolder: string;       // default: 'journal/'
  weeklyFolder: string;        // default: 'journal/weekly/'
  silenceThreshold: number;    // dB level, default: -45
  silenceDuration: number;     // ms, default: 1500
  autoWeeklyDigest: boolean;   // default: false
}

export const DEFAULT_SETTINGS: VoiceJournalSettings = {
  openaiApiKey: '',
  anthropicApiKey: '',
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
  isRecording: boolean;
  status: PluginStatus;
}

// Result from Claude entry classification
export interface ClassificationResult {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  one_line_summary: string;
}

// Journal entry metadata for digest queries
export interface JournalEntry {
  title: string;
  date: string;
  tags: string[];
  mood: string;
  themes: string[];
  fullContent: string;
  filePath: string;
}
