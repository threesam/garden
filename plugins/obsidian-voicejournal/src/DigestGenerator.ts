import { App } from 'obsidian';
import { VoiceJournalSettings, JournalEntry } from './types';
import { ClaudeClient } from './ClaudeClient';

export class DigestGenerator {
  private app: App;
  private settings: VoiceJournalSettings;
  private claudeClient: ClaudeClient;

  constructor(app: App, settings: VoiceJournalSettings, claudeClient: ClaudeClient) {
    this.app = app;
    this.settings = settings;
    this.claudeClient = claudeClient;
  }

  async generate(): Promise<void> {
    // 1. Collect journal entries from the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const files = this.app.vault.getFiles()
      .filter(f => f.path.startsWith(this.settings.journalFolder))
      .filter(f => f.stat.mtime >= sevenDaysAgo);

    // 2. Filter to journal entries only using metadataCache
    const journalFiles = files.filter(f => {
      const cache = this.app.metadataCache.getFileCache(f);
      return cache?.frontmatter?.['type'] === 'journal-entry';
    });

    // 3. Read each file's content
    const entries: JournalEntry[] = await Promise.all(
      journalFiles.map(async (f) => {
        const content = await this.app.vault.read(f);
        const cache = this.app.metadataCache.getFileCache(f)!;
        const fm = cache.frontmatter!;
        return {
          title: String(fm['title'] ?? f.basename),
          date: String(fm['date'] ?? ''),
          tags: Array.isArray(fm['tags']) ? fm['tags'] as string[] : [],
          mood: String(fm['mood'] ?? ''),
          themes: Array.isArray(fm['themes']) ? fm['themes'] as string[] : [],
          fullContent: content,
          filePath: f.path,
        };
      })
    );

    // 4. Bail early if no entries
    if (entries.length === 0) {
      throw new Error('No journal entries found in the last 7 days.');
    }

    // 5. Call Claude for digest
    const digestContent = await this.claudeClient.generateDigest(entries, this.settings.anthropicApiKey);

    // 6. Write the weekly note
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const weekOf = this.getMondayDate(today);

    const frontmatter = `---\ndate: ${dateStr}\ntype: weekly-review\nweek-of: ${weekOf}\nentries-reviewed: ${entries.length}\n---\n\n`;
    const noteContent = frontmatter + digestContent;
    const filename = `${dateStr}-weekly.md`;

    // Ensure weeklyFolder exists
    await this.ensureFolder(this.settings.weeklyFolder);

    const filePath = `${this.settings.weeklyFolder}${filename}`;
    const existing = this.app.vault.getFileByPath(filePath);
    if (existing) {
      await this.app.vault.modify(existing, noteContent);
    } else {
      await this.app.vault.create(filePath, noteContent);
    }
  }

  private getMondayDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Adjust so Monday = 0: (day + 6) % 7 gives days since Monday
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    try {
      await this.app.vault.createFolder(folderPath);
    } catch {
      // Folder already exists — ignore
    }
  }
}
