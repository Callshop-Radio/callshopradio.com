# AGENTS.md — callshopradio.com

## Deploy

- **Live is `origin/develop`.** `callshopradio.live` is built by Netlify from
  that branch. `origin/main` is not the live branch.
- Deploy = branch, PR into `develop`, merge. The `develop` ruleset rejects
  direct pushes (PR + required checks), so a local commit alone is not live.
- After the push, verify the live page by a DOM marker or computed style;
  Netlify needs a minute or two.
- Stage only the files that belong to the change. Other sessions keep
  unrelated work in the tree; never commit it along.

## Working rules

- Dev server: `pnpm web:dev` (port 3333).
- Format/lint: `pnpm exec biome check --write <files>`; the pre-commit hook
  formats the whole repo.
- Website copy lives in Sanity; code changes only touch markup, styles and
  queries.
