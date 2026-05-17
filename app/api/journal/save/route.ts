import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DEV_ONLY = NextResponse.json({ error: 'not available' }, { status: 404 });

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') return DEV_ONLY;

  const { content, filename } = await req.json() as { content: string; filename: string };

  if (!filename || filename.includes('..') || /[/\\]/.test(filename)) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }

  const folder = path.join(process.cwd(), 'content', 'journal');
  await mkdir(folder, { recursive: true });

  let filePath = path.join(folder, `${filename}.md`);
  if (existsSync(filePath)) {
    let n = 2;
    while (existsSync(path.join(folder, `${filename} - ${n}.md`))) n++;
    filePath = path.join(folder, `${filename} - ${n}.md`);
  }

  await writeFile(filePath, content, 'utf-8');
  return NextResponse.json({ filePath: path.relative(process.cwd(), filePath) });
}
