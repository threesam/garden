import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/journal/claude';

export const runtime = 'nodejs';

const DEV_ONLY = NextResponse.json({ error: 'not available' }, { status: 404 });

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') return DEV_ONLY;

  const { transcript, previousQuestions } = await req.json() as {
    transcript: string;
    previousQuestions: string[];
  };

  const system =
    'You are a depth-focused journaling coach. Your only job is to ask ' +
    'one short follow-up question that helps the person go deeper — not ' +
    'broader. Prioritize emotion over event, pattern over incident. ' +
    'Never ask yes/no questions. Never repeat a question already asked. ' +
    'Max 12 words. No preamble. No explanation. Just the question.';

  const userContent =
    `Full transcript so far:\n${transcript}\n\n` +
    `Questions already asked:\n${previousQuestions.length ? previousQuestions.join('\n') : 'None'}\n\n` +
    `Ask the next question.`;

  const question = await callClaude(system, userContent);
  return NextResponse.json({ question });
}
