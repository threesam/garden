/**
 * Calls the local `claude` CLI in non-interactive print mode.
 * Dev-only utility — not intended for production use.
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';

function resolvePath(): string {
  if (process.env.CLAUDE_PATH && existsSync(process.env.CLAUDE_PATH)) {
    return process.env.CLAUDE_PATH;
  }
  const candidates = [
    '/Users/salvatoredangelo/.local/bin/claude',
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
  ];
  return candidates.find(existsSync) ?? 'claude';
}

export function callClaude(system: string, userContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const bin = resolvePath();
    const child = spawn(
      bin,
      ['--print', '--system-prompt', system, '--tools', '', '--no-session-persistence'],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.stdin.write(userContent);
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`claude exited ${code ?? '?'}: ${stderr.slice(0, 300)}`));
    });
    child.on('error', (err) => {
      reject(new Error(`cannot spawn claude at "${bin}": ${err.message}`));
    });
  });
}
