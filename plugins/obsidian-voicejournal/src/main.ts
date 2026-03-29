import { Plugin } from 'obsidian';
import { VoiceJournalSettings, DEFAULT_SETTINGS } from './types';
import { VoiceJournalSettingsTab } from './SettingsTab';
import { JournalView, VIEW_TYPE_JOURNAL } from './JournalView';

export default class VoiceJournalPlugin extends Plugin {
  settings: VoiceJournalSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    // Register the side panel view
    this.registerView(VIEW_TYPE_JOURNAL, (leaf) => new JournalView(leaf, this));

    // Ribbon icon — opens the journal panel
    this.addRibbonIcon('mic', 'VoiceJournal', () => {
      this.activateView();
    });

    // Commands
    this.addCommand({
      id: 'voicejournal-start',
      name: 'Start Voice Journal',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'voicejournal-weekly',
      name: 'Generate Weekly Digest',
      callback: () => {
        // Dispatch to the open view if available, otherwise show notice
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_JOURNAL);
        if (leaves.length > 0) {
          const view = leaves[0].view as JournalView;
          view.generateWeeklyDigest();
        } else {
          this.activateView().then(() => {
            const newLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_JOURNAL);
            if (newLeaves.length > 0) {
              const view = newLeaves[0].view as JournalView;
              view.generateWeeklyDigest();
            }
          });
        }
      },
    });

    // Settings tab
    this.addSettingTab(new VoiceJournalSettingsTab(this.app, this));

    // Auto weekly digest on Sunday
    if (this.settings.autoWeeklyDigest && new Date().getDay() === 0) {
      // Day 0 = Sunday — open panel and trigger digest after layout is ready
      this.app.workspace.onLayoutReady(() => {
        this.activateView().then(() => {
          const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_JOURNAL);
          if (leaves.length > 0) {
            (leaves[0].view as JournalView).generateWeeklyDigest();
          }
        });
      });
    }
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_JOURNAL);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_JOURNAL)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_JOURNAL, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
