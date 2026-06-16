# Contributing

## Getting set up

See [README.md](README.md) for prerequisites, env vars, and the quick start.
After `pnpm install`, husky git hooks are installed automatically (via the root
`prepare` script).

## Branching & PRs

- `main` — the active trunk; deploys to Netlify. Branch from it and open PRs back
  into it.
- `feature/<kebab-case>` — one branch per task, branched off `main`.

> Note: `dev` and the legacy `*-static` branches are stale (far behind `main`).
> `main` is the de-facto trunk — don't branch off `dev`.

Keep PRs small and focused. Before opening a PR:

```bash
pnpm lint        # biome check . — must be clean (0 errors)
pnpm typecheck   # advisory today; see "Type safety" below
pnpm web:build   # must succeed
```

Then run the manual smoke check (there are no automated tests yet): load the
home page, one show, one set, one pool profile, one article, the schedule, and
search; confirm content renders and the audio player works.

## Commits

[Conventional Commits](https://www.conventionalcommits.org): `feat`, `fix`,
`chore`, `perf`, `refactor`, `docs`, etc., with an optional scope, e.g.
`feat(schedule): …`, `perf: trim GROQ payloads`.

## Linting & formatting (Biome)

This repo uses [Biome](https://biomejs.dev) for both linting and formatting
(JS/TS/Vue `<script>`/JSON) — it replaces ESLint, Prettier and stylelint.

```bash
pnpm lint     # biome check .        (check only)
pnpm format   # biome check --write . (apply safe fixes + format + organize imports)
```

- Config: root `biome.json` — tabs, double quotes, organize-imports on; `studio/`
  is formatted with 2-space indent.
- A husky `pre-commit` hook runs `pnpm run format`.
- **CSS/PostCSS is not linted** by Biome (its PostCSS support is limited). Keep
  styles consistent by hand; prefer the existing design tokens and custom-media
  breakpoints in `web/layers/base/assets/styles/`.

## Code conventions

- **Where things live:** shared UI/logic/styles → `web/layers/base/`
  (components and composables there auto-import by name); pages →
  `web/app/pages/`; GROQ → `web/queries/`; server handlers → `web/server/`;
  shared types → `web/types/sanity.ts`.
- **Component naming:** keep the existing prefixes — `Module*`, `Site*`,
  `Elements*`, `Media*`.
- **Type safety:** new `<script setup>` blocks should use `lang="ts"`; add it to
  existing files opportunistically when you touch them. Prefer importing shared
  types from `web/types/sanity.ts` over redeclaring `Image` / `Tag` / content
  shapes locally.
- **No copy-paste logic:** if a helper would live in ≥2 components, put it in a
  composable under `web/layers/base/composables/` instead.

## Known follow-ups (good first issues)

- **De-duplicate helpers into composables** — `getItemImage`, `getItemRoute`,
  `getSoundcloudArtwork`/`playTrack` are copy-pasted across many components;
  the orphaned `useTagNavigation.ts` should be adopted in place of inlined
  `navigateToTagSearch`.
- **Fix the shared-types alias (type-safety blocker)** — shared types are imported
  as `~/types/sanity`, but Nuxt maps `~/*` → `web/app/*`, so the path doesn't
  resolve and every shared-type import silently falls back to `any` (type imports
  are erased at runtime, so the app still works). The real fix is `~~/types/sanity`
  (project root) repo-wide — but expect it to surface many genuine type errors,
  i.e. it's a dedicated typed-cleanup effort, not a quick change.
- **Centralize types** — continue removing local `Image`/`Tag`/content interfaces
  in the intro/hero components in favour of `web/types/sanity.ts` (most valuable
  once the alias above is fixed). A few were left local where a type-only `Image`
  import would shadow the DOM `Image` constructor, or where local `Tag` shapes
  differ from the shared one.
- **Biome warnings** — `pnpm lint` currently reports warnings (unused
  vars/imports, `any`, a few softened correctness/a11y rules). Chip away at them;
  do not let the error count regress above 0.
- **Two detail pages render empty instead of 404** on missing content
  (`web/app/pages/words/[slug].vue`, `web/app/pages/shows/[slug]/[set]/index.vue`)
  — they log but don't `throw createError(404)` like the show/pool pages do.
