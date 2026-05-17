import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/journal/claude';
import type { ClassificationResult } from '@/lib/journal/types';

export const runtime = 'nodejs';

const DEV_ONLY = NextResponse.json({ error: 'not available' }, { status: 404 });

interface ClassificationJson {
  title: string;
  tags: string[];
  mood: string;
  themes: string[];
  one_line_summary: string;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') return DEV_ONLY;

  const { transcript } = await req.json() as { transcript: string };

  const system =
    'Analyze this journal entry and return ONLY valid JSON. No markdown fences. ' +
    'No explanation. JSON only. Use this exact shape:\n' +
    '{\n' +
    '  "title": "specific non-generic title, max 8 words",\n' +
    '  "tags": ["3-6 lowercase tags based on themes and emotions, no # symbol"],\n' +
    '  "mood": "mood arc from start to end e.g. anxious → reflective",\n' +
    '  "themes": ["2-4 short theme phrases"],\n' +
    '  "one_line_summary": "one honest plain-language sentence"\n' +
    '}';

  const raw = await callClaude(system, transcript);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`no JSON in response: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(match[0]) as ClassificationJson;
  const result: ClassificationResult = {
    title: parsed.title ?? '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    mood: parsed.mood ?? '',
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    oneLineSummary: parsed.one_line_summary ?? '',
  };

  return NextResponse.json(result);
}
