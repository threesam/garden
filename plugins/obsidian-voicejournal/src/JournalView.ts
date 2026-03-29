import { ItemView, WorkspaceLeaf } from 'obsidian';
import type VoiceJournalPlugin from './main';

export const VIEW_TYPE_JOURNAL = 'voice-journal-view';

export class JournalView extends ItemView {
  plugin: VoiceJournalPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: VoiceJournalPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_JOURNAL;
  }

  getDisplayText(): string {
    return 'VoiceJournal';
  }

  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}

  // Will be fully implemented in Task 7
  generateWeeklyDigest(): void {}
}
