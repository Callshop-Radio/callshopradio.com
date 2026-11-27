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

## Local ports and Sanity CORS

The browser may only talk to Sanity from an origin the project allows. In
`0smxd0yv` these are allowed:

```
http://localhost:3000
http://localhost:3333
```

Everything else — `3334`, `3335`, any worktree port — is not. The page still
renders on first load, because the **server** fetches the data (SSR, no CORS),
so the problem hides. What breaks is everything the **browser** fetches:

- infinite scroll / "load more" stops at the first block ("9 / 2002")
- clicking a route (Shows, Pool, …) shows an empty page until a hard reload
- the console shows `blocked by CORS policy` for `*.apicdn.sanity.io`

That is not a code bug and not a payload problem — the request is rejected
before it leaves the browser. Fix it by using 3000 or 3333, or add the port:

```bash
npx sanity cors add http://localhost:3335
```

Preview a production build on an allowed port:
`pnpm exec nuxt preview --port 3000`.
