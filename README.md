# Callshop Radio

Website and CMS for Callshop Radio — an internet radio platform (shows, sets, a
people/venue "pool", articles, a live schedule, and a persistent audio player).

- **Web** — [Nuxt](https://nuxt.com) 3.16 (with the v4 compatibility flag) + Vue 3,
  UnoCSS + PostCSS, bilingual (EN default, `/de` prefix). Hybrid SSG/SSR, deployed
  on Netlify.
- **Studio** — [Sanity](https://www.sanity.io) v3 content studio.

Contacts: [web@callshopradio.com](mailto:web@callshopradio.com) ·
[support@callshopradio.com](mailto:support@callshopradio.com)

## Repository layout

```
callshopradio.com/
├── web/        # Nuxt frontend (app/, layers/base/, queries/, server/)
├── studio/     # Sanity Studio (schemas, config)
├── biome.json  # Lint + format config (whole monorepo)
└── netlify.toml
```

The frontend uses a **Nuxt layer** at `web/layers/base/` for shared
components, composables, plugins and styles. Components and composables there are
auto-imported (no explicit import needed). Page routes live in `web/app/pages/`,
GROQ queries in `web/queries/`, and server routes/handlers in `web/server/`.

## Prerequisites

- **Node** ≥ 18.2.0
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
| `pnpm typecheck` | `vue-tsc` over the web app |
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
| `NUXT_LIBRETIME_API_KEY` | LibreTime API key (live schedule) |
| `SANITY_WEBHOOK_SECRET` | Verifies the cache-revalidation webhook |

## Rendering & deploy

Content routes (`/`, `/pool/**`, `/shows/**`, `/words/**`, `/schedule`) are
prerendered at build time (routes discovered from Sanity via
`web/lib/fetch-prerender-routes.ts`); `/search` is client-only. Netlify builds
with `pnpm run build` from `web/` and serves `web/dist`, with Netlify Functions
as the SSR fallback. Content updates trigger cache revalidation via the Sanity
webhook (`web/server/api/revalidate.ts`).

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and workflow.
