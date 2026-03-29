import { App, PluginSettingTab, Setting } from 'obsidian';
import type VoiceJournalPlugin from './main';

export class VoiceJournalSettingsTab extends PluginSettingTab {
  plugin: VoiceJournalPlugin;

  constructor(app: App, plugin: VoiceJournalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 1. OpenAI API Key
    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Used for Whisper transcription')
      .addText((text) => {
        text.inputEl.type = 'password';
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          });
      });

    // 2. Anthropic API Key
    new Setting(containerEl)
      .setName('Anthropic API Key')
      .setDesc('Used for Claude follow-up questions and classification')
      .addText((text) => {
        text.inputEl.type = 'password';
        text
          .setPlaceholder('sk-ant-...')
          .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (value) => {
            this.plugin.settings.anthropicApiKey = value;
            await this.plugin.saveSettings();
          });
      });

    // 3. Journal Folder
    new Setting(containerEl)
      .setName('Journal Folder')
      .setDesc('Vault path for journal entries (default: journal/)')
      .addText((text) =>
        text
          .setPlaceholder('journal/')
          .setValue(this.plugin.settings.journalFolder)
          .onChange(async (value) => {
            this.plugin.settings.journalFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // 4. Weekly Digest Folder
    new Setting(containerEl)
      .setName('Weekly Digest Folder')
      .setDesc('Vault path for weekly digests (default: journal/weekly/)')
      .addText((text) =>
        text
          .setPlaceholder('journal/weekly/')
          .setValue(this.plugin.settings.weeklyFolder)
          .onChange(async (value) => {
            this.plugin.settings.weeklyFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // 5. Silence Threshold (slider)
    new Setting(containerEl)
      .setName('Silence Threshold (dB)')
      .setDesc('dB level to detect silence')
      .addSlider((slider) =>
        slider
          .setLimits(-80, 0, 1)
          .setValue(this.plugin.settings.silenceThreshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.silenceThreshold = value;
            await this.plugin.saveSettings();
          })
      );

    // 6. Silence Duration (number input)
    new Setting(containerEl)
      .setName('Silence Duration (ms)')
      .setDesc('Milliseconds of silence before triggering transcription')
      .addText((text) => {
        text.inputEl.type = 'number';
        text
          .setPlaceholder('1500')
          .setValue(String(this.plugin.settings.silenceDuration))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed) && parsed >= 100) {
              this.plugin.settings.silenceDuration = parsed;
              await this.plugin.saveSettings();
            }
          });
      });

    // 7. Auto Weekly Digest (toggle)
    new Setting(containerEl)
      .setName('Auto Weekly Digest')
      .setDesc(
        'Automatically generate a weekly digest every Sunday when Obsidian starts'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoWeeklyDigest)
          .onChange(async (value) => {
            this.plugin.settings.autoWeeklyDigest = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
