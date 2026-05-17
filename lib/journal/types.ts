export type JournalStatus = 'idle' | 'recording' | 'listening' | 'processing';

export interface ClassificationResult {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  oneLineSummary: string;
}
