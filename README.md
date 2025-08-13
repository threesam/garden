# SvelteKit Vercel Draft Mode + Auth Modal

- Set `APP_PASSWORD` and `BYPASS_TOKEN` in `.env`.
- Start dev: `npm i && npm run dev`
- Log in via header button to enable Vercel Draft Mode (sets `__prerender_bypass`).

The route `+page.server.ts` enables ISR using `bypassToken` and a 60s expiration.
