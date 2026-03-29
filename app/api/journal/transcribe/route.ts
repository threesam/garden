import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEV_ONLY = NextResponse.json({ error: 'not available' }, { status: 404 });

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') return DEV_ONLY;

  const whisperUrl = process.env.WHISPER_URL ?? 'http://localhost:8000';
  const model = process.env.WHISPER_MODEL ?? 'Systran/faster-whisper-small';

  const incoming = await req.formData();
  const file = incoming.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 });

  const upstream = new FormData();
  upstream.append('file', file, 'chunk.webm');
  upstream.append('model', model);
  upstream.append('language', 'en');

  const res = await fetch(`${whisperUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    body: upstream,
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
