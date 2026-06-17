# Callshop Radio

> Community internet radio from Düsseldorf, Leipzig and Vienna — airing live Mon–Sun.
> **Listen at [callshopradio.com](https://callshopradio.com).**

This repository holds the website and CMS that run the station. We're publishing
the source as inspiration for other small radio projects — read it, learn from
it, let your AI tools chew on it. We just ask that you build something of your
own with it rather than redistributing it.

Licensed under the **[PolyForm Noncommercial License 1.0.0](LICENSE)** —
non-commercial use is permitted; commercial use requires a separate agreement.
Reach out via [web@callshopradio.com](mailto:web@callshopradio.com) for
licensing questions.

## The stack

- **Web** — [Nuxt](https://nuxt.com) 4 + Vue 3, UnoCSS + PostCSS,
  English + German via `@nuxtjs/i18n`, deployed on Netlify (ISR at the edge,
  Functions as SSR fallback).
- **Studio** — [Sanity](https://www.sanity.io) Studio v6.
- **Live audio** — LibreTime as the scheduling backend (proxied server-side).

## Repository layout

```
callshopradio.com/
├── web/        # Nuxt frontend (app/, layers/base/, queries/, server/)
├── studio/     # Sanity Studio (schemas, config)
├── biome.json  # Lint + format config (whole monorepo)
└── netlify.toml
```

The frontend uses a **Nuxt layer** at `web/layers/base/` for shared components,
composables, plugins and styles. Components and composables there are
auto-imported (no explicit import needed). Page routes live in `web/app/pages/`,
GROQ queries in `web/queries/`, and server routes/handlers in `web/server/`.

## Prerequisites

- **Node** ≥ 22.12.0
- **pnpm** 10.x (this repo is a pnpm workspace)

## Quick start

```bash
pnpm install

# Web env: copy the example and fill in the Sanity + LibreTime values
cp web/.env.example web/.env
cp studio/.env.example studio/.env   # for the studio

pnpm dev          # runs web (:3000) and studio (:3333) together
# or individually:
pnpm web:dev
pnpm studio:dev
```

## Scripts (root)

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run web + studio in parallel |
| `pnpm web:dev` / `pnpm studio:dev` | Run one package |
| `pnpm build` / `pnpm web:build` | Production build |
| `pnpm lint` | `biome check .` (lint + format check, whole repo) |
| `pnpm format` | `biome check --write .` (apply lint/format fixes) |
| `pnpm typecheck` | `nuxt typecheck` over the web app (vue-tsc under the hood) |
| `pnpm studio:deploy` | Deploy the Sanity studio |

Useful web-only scripts (`pnpm --filter web run <script>`): `generate:ssg`,
`generate:validate`, `preview:ssg`, `analyze`, `routes:check`.

## Environment

Web (`web/.env`):

| Variable | Purpose |
| --- | --- |
| `NUXT_SANITY_PROJECT_ID` / `NUXT_SANITY_DATASET` | Sanity project + dataset |
| `NUXT_SANITY_API_READ_TOKEN` | Read token (preview / visual editing) |
| `NUXT_SANITY_STUDIO_URL` | Studio URL for visual editing |
| `NUXT_GTAG_ID` | Google Analytics (consent-gated) |
| `NUXT_LIBRETIME_API_KEY` | LibreTime API key — server-only, never exposed to the client |
| `SANITY_WEBHOOK_SECRET` | Verifies the cache-revalidation webhook |

Studio (`studio/.env`) — Sanity project + Netlify integration values for the
embedded build-status widget. See `studio/.env.example` for the full list
(`SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_PREVIEW_URL`,
plus the `SANITY_STUDIO_NETLIFY_*` trio).

## Rendering & deploy

Content routes (`/`, `/pool/**`, `/shows/**`, `/words/**`, `/schedule`, plus
top-level editorial pages from Sanity) are served as **ISR** at the Netlify
edge — rendered on demand, tagged with `Netlify-Cache-Tag`, and purged by the
Sanity webhook at `web/server/api/revalidate.ts`. The page-slug list is
fetched at build via `web/lib/fetch-page-slugs.ts` and registered as ISR
routes in a `nitro:config` hook. `/sitemap.xml` is prerendered at build;
`/search` runs client-side only.

Netlify builds via `pnpm run build` from `web/` (`NITRO_PRESET=netlify`) and
serves `web/dist`, with Netlify Functions as the SSR fallback. The
Sanity-detail cache persists across deploys via Netlify Blobs (`sanity-cache`
store); locally it falls back to an in-memory LRU.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and workflow. By
contributing, you agree your changes ship under the same PolyForm Noncommercial
license as the rest of the project.

## Credits & contact

Built by the Callshop Radio crew. For collaboration, partnerships or licensing:
[web@callshopradio.com](mailto:web@callshopradio.com) ·
[support@callshopradio.com](mailto:support@callshopradio.com).
