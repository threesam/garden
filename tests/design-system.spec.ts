import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

// Design-system guard rails. The brand surface is small (--white,
// --black, --coin + a few tracking values), and they're registered as
// Tailwind utilities in app.css's @theme inline block — `text-coin`,
// `bg-black`, `tracking-pill`, etc. all work out of the box.
//
// New code that reaches for the arbitrary-value escape hatch
// (`text-[var(--coin)]`, `tracking-[0.3em]`) or inline `style="color:
// var(--coin)"` ought to be using the registered utility instead. These
// tests fail loud when that happens so the design system doesn't drift
// back into a million one-off values.

// Patterns are constants in this file (no user input); execFileSync
// with an argument array still avoids any shell so the pattern can
// contain whatever regex chars it needs without escaping.
function grep(pattern: string): string[] {
  try {
    const out = execFileSync(
      'grep',
      [
        '-rnE',
        pattern,
        'src/',
        '--include=*.svelte',
        '--include=*.ts',
      ],
      { encoding: 'utf8' }
    );
    return out.split('\n').filter(Boolean);
  } catch (err) {
    // grep exits 1 when there are no matches — that's a pass for us.
    const e = err as { status?: number; stdout?: string };
    if (e.status === 1) return [];
    if (e.stdout) return e.stdout.split('\n').filter(Boolean);
    throw err;
  }
}

test.describe('design system', () => {
  test('no arbitrary tracking values for the registered scale', () => {
    // tracking-base / -meta / -label / -hero / -section / -pill cover
    // 0.1, 0.15, 0.16, 0.2, 0.22, 0.3 em — any arbitrary literal at
    // those values means the registered token wasn't used.
    const hits = grep(
      String.raw`tracking-\[(0\.1|0\.15|0\.16|0\.2|0\.22|0\.3)em\]`
    );
    expect(hits, hits.join('\n')).toEqual([]);
  });

  test('no arbitrary brand color/bg/border utilities', () => {
    // bg-white / bg-black / bg-coin / text-* / border-* are all
    // registered via @theme inline → use those instead of the
    // arbitrary `bg-[var(--coin)]` escape hatch.
    const hits = grep(
      String.raw`(text|bg|border)-\[var\(--(white|black|coin)\)\]`
    );
    expect(hits, hits.join('\n')).toEqual([]);
  });

  test('no inline style="color/background: var(--brand)" for plain swaps', () => {
    // Inline color/bg styles that just set a single brand var should be
    // a className utility. Compound styles (text-shadow, gradients,
    // mix-blend-mode) can stay inline because they don't have clean
    // utility equivalents — those aren't matched here.
    const colorHits = grep(
      String.raw`style="color: var\(--(white|black|coin)\)"`
    );
    const bgHits = grep(
      String.raw`style="background(-color)?: var\(--(white|black|coin)\);?"`
    );
    const hits = [...colorHits, ...bgHits];
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
