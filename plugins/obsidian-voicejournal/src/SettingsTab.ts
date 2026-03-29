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

    // 1. OpenAI API Key (not needed for local Whisper server)
    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Required for openai.com Whisper. Leave empty when using a local Whisper server.')
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

    // 2. Whisper Base URL
    new Setting(containerEl)
      .setName('Whisper Base URL')
      .setDesc('OpenAI-compatible transcription endpoint. Use http://localhost:8000 for faster-whisper-server.')
      .addText((text) =>
        text
          .setPlaceholder('http://localhost:8000')
          .setValue(this.plugin.settings.whisperBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.whisperBaseUrl = value.replace(/\/$/, '');
            await this.plugin.saveSettings();
          })
      );

    // 3. Claude path
    new Setting(containerEl)
      .setName('Claude CLI path')
      .setDesc('Full path to the claude executable. Run `which claude` in terminal to find it.')
      .addText((text) =>
        text
          .setPlaceholder('claude')
          .setValue(this.plugin.settings.claudePath)
          .onChange(async (value) => {
            this.plugin.settings.claudePath = value.trim() || 'claude';
            await this.plugin.saveSettings();
          })
      );

    // 4. Journal Folder
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

    // 5. Weekly Digest Folder
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

    // 6. Silence Threshold (slider)
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

    // 7. Silence Duration (number input)
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

    // 8. Auto Weekly Digest (toggle)
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
