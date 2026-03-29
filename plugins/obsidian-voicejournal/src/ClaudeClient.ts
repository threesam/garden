import { spawn } from 'child_process';
import { ClassificationResult, JournalEntry } from './types';

interface ClassificationJson {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  one_line_summary: string;
}

/**
 * Calls the local `claude` CLI in non-interactive print mode.
 * Uses --no-session-persistence so journal content is never saved to session history.
 * Uses --tools "" to disable all tools (pure text generation, faster).
 */
async function callClaude(system: string, userContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '--print',
        '--system-prompt', system,
        '--tools', '',
        '--no-session-persistence',
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    child.stdin.write(userContent);
    child.stdin.end();

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`claude CLI error (exit ${code ?? '?'}): ${stderr.slice(0, 300)}`));
      }
    });

    child.on('error', (err: Error) => {
      reject(new Error(`Could not spawn claude: ${err.message}. Ensure Claude Code is installed and in PATH.`));
    });
  });
}

export class ClaudeClient {
  async askFollowUp(
    fullTranscript: string,
    previousQuestions: string[],
  ): Promise<string> {
    const system =
      'You are a depth-focused journaling coach. Your only job is to ask \n' +
      'one short follow-up question that helps the person go deeper — not \n' +
      'broader. Prioritize emotion over event, pattern over incident. \n' +
      'Never ask yes/no questions. Never repeat a question already asked. \n' +
      'Max 12 words. No preamble. No explanation. Just the question.';

    const userMessage =
      `Full transcript so far:\n${fullTranscript}\n\n` +
      `Questions already asked this session:\n${previousQuestions.length > 0 ? previousQuestions.join('\n') : 'None'}\n\n` +
      `Ask the next question.`;

    return callClaude(system, userMessage);
  }

  async classifyEntry(transcript: string): Promise<ClassificationResult> {
    const system =
      'Analyze this journal entry and return ONLY valid JSON. No markdown fences. \n' +
      'No explanation. JSON only. Use this exact shape:\n' +
      '{\n' +
      '  "title": "specific non-generic title, max 8 words",\n' +
      '  "tags": ["3-6 lowercase tags based on themes and emotions, no # symbol"],\n' +
      '  "mood": "mood arc from start to end e.g. anxious → reflective",\n' +
      '  "themes": ["2-4 short theme phrases"],\n' +
      '  "one_line_summary": "one honest plain-language sentence"\n' +
      '}';

    const rawText = await callClaude(system, transcript);

    // Extract JSON object even if the model wraps it in surrounding text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Claude classification returned no JSON object: ${rawText.slice(0, 200)}`);
    }

    let parsed: ClassificationJson;
    try {
      parsed = JSON.parse(jsonMatch[0]) as ClassificationJson;
    } catch {
      throw new Error(`Claude classification returned invalid JSON: ${rawText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.tags) || !Array.isArray(parsed.themes)) {
      throw new Error('Claude classification returned malformed JSON: tags and themes must be arrays');
    }

    return {
      title: parsed.title ?? '',
      tags: parsed.tags,
      mood: parsed.mood ?? '',
      themes: parsed.themes,
      oneLineSummary: parsed.one_line_summary ?? '',
    };
  }

  async generateDigest(entries: JournalEntry[]): Promise<string> {
    const system =
      'You are analyzing a week of private journal entries. \n' +
      'Be specific — reference actual content, not generic summaries. \n' +
      'Plain language. No therapy-speak. Honest, even if uncomfortable.\n' +
      'Return the weekly review using exactly these markdown sections:\n\n' +
      '## Recurring Themes\n' +
      '## Mood Arc\n' +
      '## Patterns Worth Watching\n' +
      '## One Question to Sit With\n' +
      '## Entries This Week\n\n' +
      'Rules:\n' +
      '- Recurring Themes: list with (appeared Nx) counts\n' +
      '- Mood Arc: describe the emotional trajectory across the week\n' +
      '- Patterns Worth Watching: 2-3 honest observations, specific to content\n' +
      '- One Question to Sit With: single most useful question, direct\n' +
      '- Entries This Week: list as Obsidian [[wikilinks]] using exact entry titles';

    const entrySections = entries.map((entry) =>
      `---\n` +
      `Title: ${entry.title}\n` +
      `Date: ${entry.date}\n` +
      `Tags: ${entry.tags.join(', ')}\n` +
      `Mood: ${entry.mood}\n` +
      `Themes: ${entry.themes.join(', ')}\n\n` +
      `${entry.fullContent}\n` +
      `---`,
    );

    const userMessage = `Here are this week's journal entries:\n\n${entrySections.join('\n\n')}`;

    return callClaude(system, userMessage);
  }
}
