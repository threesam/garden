import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

// Files outside the tsconfig's include glob (root configs) that still need
// type-aware lint. Keep under 8 entries; tseslint warns above that.
const ALLOW_DEFAULT_PROJECT = ['eslint.config.js', 'svelte.config.js'];

export default defineConfig(
  {
    ignores: [
      'build/**',
      '.svelte-kit/**',
      '.vercel/**',
      'node_modules/**',
      'static/**',
      'playwright-report/**',
      'test-results/**',
      // One-off bake/dev tooling (ascii baking, sounds ingest, lighthouse).
      // Not part of the production build; skipped from type-aware lint.
      'scripts/**',
      // Rust → wasm toolchain output and sources.
      'rust/**',
      // Vendored/baked data blobs (minified chart.js vendor copy etc).
      'data/**',
      'next-env.d.ts',
      // Agent-session artifacts + Next-era leftovers (gitignored, but eslint
      // crawls the working tree, not the index).
      '.claude/**',
      '.worktrees/**',
      '.superset/**',
      '.playwright-mcp/**',
      '.next/**',
      'package/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: { allowDefaultProject: ALLOW_DEFAULT_PROJECT },
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Includes rune modules (.svelte.ts/.svelte.js) — without an explicit
    // files match they fall through to espree and fail on TS syntax.
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        projectService: { allowDefaultProject: ALLOW_DEFAULT_PROJECT },
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // tsconfig's noUncheckedIndexedAccess forces guard-or-assert on every
      // indexed read. In 60fps canvas loops with locally-provable bounds
      // (RGBA stride, masked Perlin tables, length-bounded for loops) the
      // assertion IS the reviewed, deliberate escape hatch — banning it here
      // would push the code toward dead guards or `?? 0` lies. The compiler
      // still type-checks the base expression of every `!`.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Canvas/art code interpolates numbers into rgba()/translate() strings
      // constantly; that's the idiom, not a bug. Objects/arrays/null in
      // templates stay banned.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // External-link href values (SoundCloud, Substack, LinkedIn, …) don't go
      // through SvelteKit's resolve().
      'svelte/no-navigation-without-resolve': 'off',
      // `_` is the conventional discard name (chart callbacks, destructuring).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // `||` on strings is the intentional ''-falls-back idiom here (env vars,
      // markdown segment defaults). `??` stays enforced for everything else.
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: { string: true } }],
    },
  },
  {
    // {@render snippet()} compiles to a void call inside an expression — the
    // TS rule can't see Svelte template semantics and misfires on every
    // render tag. Scoped off for Svelte files only.
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
)
