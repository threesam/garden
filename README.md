# threesam.com — digital garden scaffold

Minimal, experimental scaffold for a personal laboratory site:
art, music, engineering, and discipline.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Three.js (WebGL hero rendering with swipeable sketch carousel)
- Web Audio API (player + analyser + visualizer + live microphone input)
- Live reaction tuning controls (sensitivity + smoothing)
- Rust -> WASM support (lazy-loaded with fallback)
- Serverless API routes for counters

## Quick start

```bash
npm install
npm run dev
```

## WASM example

Rust source lives in `rust/garden_math`.

Build WASM and copy output:

```bash
npm run wasm:build
```

Expected runtime file:

- `public/wasm/garden_math.wasm`

If missing, the hero falls back to JS math automatically.

## Audio placeholder

Default player source:

- `/public/audio/placeholder-track.mp3`

Replace with a real local WAV/MP3.

## Scaffold structure

```txt
app/
  api/counters/route.ts
  case-studies/
  page.tsx
components/
  audio/
  counters/
  fitness/
  hero/
  portfolio/
  sections/
data/
  counters.json
  steps.mock.json
lib/
  server/counter-store.ts
  steps.ts
  wasm/garden-math.ts
rust/
  garden_math/
public/
  audio/
  wasm/
types/
```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
