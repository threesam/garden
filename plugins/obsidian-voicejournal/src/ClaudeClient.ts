import { ClassificationResult, JournalEntry } from './types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeContentBlock {
  type: string;
  text: string;
}

interface ClaudeResponse {
  content: ClaudeContentBlock[];
}

interface ClassificationJson {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  one_line_summary: string;
}

async function callClaude(
  system: string,
  messages: ClaudeMessage[],
  apiKey: string,
  maxTokens: number,
): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as ClaudeResponse;
  return data.content[0].text;
}

export class ClaudeClient {
  async askFollowUp(
    fullTranscript: string,
    previousQuestions: string[],
    apiKey: string,
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

    return callClaude(system, [{ role: 'user', content: userMessage }], apiKey, 1024);
  }

  async classifyEntry(
    transcript: string,
    apiKey: string,
  ): Promise<ClassificationResult> {
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

    const rawText = await callClaude(
      system,
      [{ role: 'user', content: transcript }],
      apiKey,
      512,
    );

    const parsed = JSON.parse(rawText) as ClassificationJson;

    return {
      title: parsed.title,
      tags: parsed.tags,
      mood: parsed.mood,
      themes: parsed.themes,
      oneLineSummary: parsed.one_line_summary,
    };
  }

  async generateDigest(
    entries: JournalEntry[],
    apiKey: string,
  ): Promise<string> {
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

    const userMessage = `Here are this week's journal entries:\n\n${entrySections.join('\n')}`;

    return callClaude(
      system,
      [{ role: 'user', content: userMessage }],
      apiKey,
      2048,
    );
  }
}
