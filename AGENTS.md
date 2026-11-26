# AGENTS.md — callshopradio.com

## Deploy

- **Live is `origin/develop`.** `callshopradio.live` is built by Netlify from
  that branch. `origin/main` is not the live branch.
- Deploy = commit on the local `main` (which tracks develop) and push
  `main:develop`. There is no separate deploy step.
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
- **Design system: `DESIGN.md` is binding.** Colours, type sizes, radii,
  spacing and component states come from it; a new value is a system change,
  not a local decision. Check it before styling a component.
