# Project rules

## Code style

- **No nested ternaries.** Split into named variables, an `if` statement, or a helper function. A single ternary is fine.

## Strictness gates (CI-enforced — keep them green)

Every change must pass all four before commit; CI re-runs them on every PR:

```bash
pnpm check   # svelte-check, strict tsconfig, --fail-on-warnings (0 warnings allowed)
pnpm lint    # eslint strictTypeChecked flat config
pnpm test    # vitest unit suite
pnpm build   # vite production build
```

- The tsconfig carries the full hardening set (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`, …). Don't loosen
  a flag to make an error go away — fix the code site.
- `!` (non-null assertion) is allowed **only** where the invariant is locally
  provable (bounded loop index, RGBA stride, regex group after a match). If
  flow can't prove it, guard instead.
- Rule disables need an inline `--` reason, same line. No file-wide disables.
- Optional props/params under `exactOptionalPropertyTypes` are declared
  `prop?: T | undefined` — that's the contract, not a typo.

## Red–green TDD

New behavior in pure logic (`src/lib/*.ts` — markdown rendering, seo builders,
goodreads parsing, game math) follows red–green:

1. **Red** — write the failing unit test first (`src/lib/<module>.test.ts`,
   colocated, vitest). Run `pnpm test` and see it fail for the right reason.
2. **Green** — minimal change to pass.
3. **Refactor** — with the test holding the behavior.

Bug fixes start with the reproducing test (the alt-quote escape in
`markdown.test.ts` is the house example). Canvas/visual feel work is exempt —
that's playtested, not unit-tested — but any pure helper extracted from it
isn't.

Harness layout: vitest for pure logic (`pnpm test`, milliseconds, no browser);
Playwright for browser behavior (`pnpm test:e2e`, `test:smoke`, `test:visual`).
Don't put pure-function assertions in Playwright specs.

## Visual parity

Site work ends with a visual pass against prod (threesam.com) — `pnpm
test:visual` baselines. Don't update baselines to mask a delta; a config-only
PR must render pixel-identical.
