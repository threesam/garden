import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import type VoiceJournalPlugin from './main';
import { AudioCapture } from './AudioCapture';
import { WhisperClient } from './WhisperClient';
import { ClaudeClient } from './ClaudeClient';
import { DigestGenerator } from './DigestGenerator';
import type { SessionState, PluginStatus } from './types';

export const VIEW_TYPE_JOURNAL = 'voice-journal-view';

export class JournalView extends ItemView {
  private readonly plugin: VoiceJournalPlugin;

  private session: SessionState = {
    transcriptSegments: [],
    questionsAsked: [],
    status: 'idle',
  };

  private audioCapture: AudioCapture;
  private whisperClient: WhisperClient;
  private claudeClient: ClaudeClient;

  // DOM refs
  private elStatus!: HTMLElement;
  private elError!: HTMLElement;
  private elTranscript!: HTMLElement;
  private elQuestion!: HTMLElement;
  private btnRecord!: HTMLButtonElement;
  private btnSave!: HTMLButtonElement;
  private btnDigest!: HTMLButtonElement;

  // Auto-hide timer for error banner
  private errorHideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: VoiceJournalPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.audioCapture = new AudioCapture(this.plugin.settings);
    this.whisperClient = new WhisperClient();
    this.claudeClient = new ClaudeClient();
  }

  getViewType(): string {
    return VIEW_TYPE_JOURNAL;
  }

  getDisplayText(): string {
    return 'VoiceJournal';
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();

    const root = container.createDiv({ cls: 'voice-journal-container' });

    this.elStatus = root.createDiv({ cls: 'vj-status', text: 'Idle' });

    this.elError = root.createDiv({ cls: 'vj-error' });
    this.elError.style.display = 'none';

    this.elTranscript = root.createDiv({ cls: 'vj-transcript' });

    this.elQuestion = root.createDiv({ cls: 'vj-question' });

    const buttonRow = root.createDiv({ cls: 'vj-buttons' });

    this.btnRecord = buttonRow.createEl('button', { cls: 'vj-btn-record', text: '● Record' });
    this.btnSave = buttonRow.createEl('button', { cls: 'vj-btn-save', text: 'Save' });
    this.btnSave.disabled = true;
    this.btnDigest = buttonRow.createEl('button', { cls: 'vj-btn-digest', text: 'Weekly Digest' });

    this.btnRecord.addEventListener('click', () => {
      const isRecording =
        this.session.status === 'recording' || this.session.status === 'listening';
      if (isRecording) {
        void this.stopSession();
      } else if (this.session.status === 'idle') {
        void this.startSession();
      }
    });

    this.btnSave.addEventListener('click', () => {
      void this.saveSession();
    });

    this.btnDigest.addEventListener('click', () => {
      void this.generateWeeklyDigest();
    });
  }

  async onClose(): Promise<void> {
    if (this.errorHideTimer !== null) {
      clearTimeout(this.errorHideTimer);
      this.errorHideTimer = null;
    }
    this.audioCapture.stop();
  }

  // ────────────────────────────────────────────────
  // Core session methods
  // ────────────────────────────────────────────────

  private async startSession(): Promise<void> {
    this.updateStatus('recording');
    this.elTranscript.empty();
    this.elQuestion.textContent = '';
    this.elQuestion.removeClass('has-question');
    this.session.transcriptSegments = [];
    this.session.questionsAsked = [];

    try {
      await this.audioCapture.start(
        async (blob: Blob) => {
          // onSilence — transcribe the chunk
          const apiKey = this.plugin.settings.openaiApiKey;
          let text: string;
          try {
            text = await this.whisperClient.transcribe(blob, apiKey);
          } catch {
            this.showError('Transcription failed for this chunk');
            return;
          }

          if (!text) return; // ambient noise / empty

          this.appendTranscript(text);

          // Ask a follow-up question via Claude
          const fullTranscript = this.session.transcriptSegments.join(' ');
          const anthropicKey = this.plugin.settings.anthropicApiKey;
          try {
            const question = await this.claudeClient.askFollowUp(
              fullTranscript,
              this.session.questionsAsked,
              anthropicKey,
            );
            this.session.questionsAsked.push(question);
            this.showQuestion(question);
          } catch {
            this.showError('Could not generate question');
          }
        },
        (status: 'recording' | 'listening') => {
          // onStatusChange — keep UI badge in sync while session is active
          if (
            this.session.status === 'recording' ||
            this.session.status === 'listening'
          ) {
            this.updateStatus(status);
          }
        },
      );
    } catch (err) {
      this.showError(err instanceof Error ? err.message : 'Could not access microphone');
      this.updateStatus('idle');
    }
  }

  private async stopSession(): Promise<void> {
    this.audioCapture.stop();
    this.updateStatus('listening');
    // Wait for any in-flight chunk (transcription + follow-up) to fully settle
    // before transitioning to idle — prevents Save being enabled prematurely.
    await this.audioCapture.drain();
    this.updateStatus('idle'); // updateStatus handles btnSave.disabled
  }

  private async saveSession(): Promise<void> {
    if (this.session.transcriptSegments.length === 0) {
      this.showError('No transcript to save');
      return;
    }

    this.updateStatus('processing');

    const fullTranscript = this.session.transcriptSegments.join(' ');
    const apiKey = this.plugin.settings.anthropicApiKey;

    let classification;
    try {
      classification = await this.claudeClient.classifyEntry(fullTranscript, apiKey);
    } catch (err) {
      this.showError(err instanceof Error ? err.message : 'Classification failed');
      this.updateStatus('idle');
      return;
    }

    // Build YAML frontmatter
    // Escape embedded double-quotes in LLM-generated string values to prevent malformed YAML
    const escYaml = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const today = new Date().toISOString().slice(0, 10);
    const tagsYaml = classification.tags.map((t) => `  - ${t}`).join('\n');
    const themesYaml = classification.themes.map((t) => `  - ${t}`).join('\n');
    const frontmatter =
      `---\n` +
      `type: journal-entry\n` +
      `date: ${today}\n` +
      `title: "${escYaml(classification.title)}"\n` +
      `mood: "${escYaml(classification.mood)}"\n` +
      `tags:\n${tagsYaml}\n` +
      `themes:\n${themesYaml}\n` +
      `summary: "${escYaml(classification.oneLineSummary)}"\n` +
      `---`;

    const noteContent = frontmatter + '\n\n' + fullTranscript;
    const folder = this.plugin.settings.journalFolder.replace(/\/?$/, '/');
    try {
      await this.app.vault.createFolder(folder);
    } catch {
      // Folder already exists — expected on all non-first saves
    }
    const filePath = await this.buildFilePath(today, classification.title);

    try {
      await this.app.vault.create(filePath, noteContent);
    } catch (err) {
      this.showError(err instanceof Error ? err.message : 'Failed to save note');
      this.updateStatus('idle');
      return;
    }

    new Notice(`Entry saved: ${classification.title}`);

    // Reset session state
    this.session.transcriptSegments = [];
    this.session.questionsAsked = [];
    this.elTranscript.empty();
    this.elQuestion.textContent = '';
    this.elQuestion.removeClass('has-question');
    this.updateStatus('idle');
  }

  public async generateWeeklyDigest(): Promise<void> {
    this.updateStatus('processing');
    try {
      const digestGenerator = new DigestGenerator(
        this.app,
        this.plugin.settings,
        this.claudeClient,
      );
      await digestGenerator.generate();
      new Notice('Weekly digest generated!');
    } catch (err) {
      this.showError(err instanceof Error ? err.message : 'Digest generation failed');
    } finally {
      this.updateStatus('idle');
    }
  }

  // ────────────────────────────────────────────────
  // Helper methods
  // ────────────────────────────────────────────────

  private updateStatus(status: PluginStatus): void {
    this.session.status = status;

    const labels: Record<PluginStatus, string> = {
      idle: 'Idle',
      recording: 'Recording...',
      listening: 'Listening...',
      processing: 'Processing...',
    };
    this.elStatus.textContent = labels[status];

    const isActiveRecording = status === 'recording' || status === 'listening';
    this.btnRecord.textContent = isActiveRecording ? '■ Stop' : '● Record';
    this.btnRecord.disabled = status === 'processing';

    // Save is only enabled when idle with transcript content
    this.btnSave.disabled = !(
      status === 'idle' && this.session.transcriptSegments.length > 0
    );
  }

  private appendTranscript(text: string): void {
    this.session.transcriptSegments.push(text);
    this.elTranscript.createEl('p', { text });
    this.elTranscript.scrollTop = this.elTranscript.scrollHeight;
  }

  private showQuestion(text: string): void {
    this.elQuestion.textContent = text;
    if (text) {
      this.elQuestion.addClass('has-question');
    } else {
      this.elQuestion.removeClass('has-question');
    }
  }

  private showError(message: string): void {
    this.elError.textContent = message;
    this.elError.style.display = 'block';

    if (this.errorHideTimer !== null) {
      clearTimeout(this.errorHideTimer);
    }
    this.errorHideTimer = setTimeout(() => {
      this.elError.style.display = 'none';
      this.errorHideTimer = null;
    }, 5000);
  }

  private async buildFilePath(date: string, title: string): Promise<string> {
    const folder = this.plugin.settings.journalFolder.replace(/\/?$/, '/');
    const safeName = title.replace(/[/\\?%*:|"<>]/g, '-');
    const base = `${date} - ${safeName}`;

    const primary = `${folder}${base}.md`;
    if (!this.app.vault.getFileByPath(primary)) {
      return primary;
    }

    let counter = 2;
    while (true) {
      const candidate = `${folder}${base} - ${counter}.md`;
      if (!this.app.vault.getFileByPath(candidate)) {
        return candidate;
      }
      counter++;
    }
  }
}
