# Navigation, Footer & Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the burger subnav, consolidate all public navigation and tools in the footer, bake the label index into a static app page, and add a compact index feature section to the landing page.

**Architecture:** Header loses the menu button and menu panel; mobile gets four section icon links. Footer becomes the single navigation surface (Explore, Pages, Follow, Apply for, theme switch). The label index is a static Nuxt page fed by a normalized JSON file and locally optimized WebP logos; no CMS, no Sanity writes. A small teaser section on the landing page links to it.

**Tech Stack:** Nuxt 4, Vue 3, PostCSS, Pinia, i18n, Playwright for QA, ImageMagick for one-time logo conversion.

**Spec:** `docs/superpowers/specs/2026-11-16-navigation-footer-index-design.md`

## Global Constraints

- No writes to the live Sanity dataset; no schema deploy; no import script.
- Work locally only: no commit, push, PR, or deploy unless explicitly requested.
- Keep the existing English/German copy pattern (`copy` computed in the footer, `localePath`).
- No new runtime dependencies.
- All 226 labels and logos must resolve locally.

## Review Focus

1. **Mobile 390 px:** logo + three section icons + search/chat/schedule/account must fit one row without clipping.
2. **Dark mode:** label cards keep a white logo surface; footer icons and theme switch stay readable.
3. **Sticky index filter bar:** must sit below the sticky header and never hide under the fixed player.
4. **Route `/index` with i18n:** `/index` and `/de/index` both resolve; no conflict with `pages/index.vue`.
5. **226 lazy images:** no layout shift; every logo request returns 200; total logo payload ≤ 2 MB.

---

### Task 1: Bake the index data and logos

**Files:**
- Create: `web/scripts/bake-label-index.mjs`
- Create (generated): `web/app/data/label-index/labels.json`
- Create (generated): `web/app/data/label-index/about.ts`
- Create (generated): `web/public/index/logos/*.webp`

**Interfaces:**
- Produces: normalized label objects `{ slug, name, founded, location, releases, members, discogs, youtube, soundcloud, logo, logoWidth, logoHeight }`, sorted by name.
- Produces: `about: string[]` export with the English paragraphs.

- [ ] **Step 1: Write the bake script**

Read `labels.json` plus `logos/` from the source directory argument. Normalize German keys to English, slugify names (umlauts → ae/oe/ue, `ß` → ss, non-alphanumeric → `-`), dedupe slugs, convert each logo with:

```bash
magick "<src>" -auto-orient -background none -resize "512x512>" -strip -quality 85 "<out>.webp"
```

Read output dimensions with `magick identify -format "%w %h"`. Extract the `.about-text` paragraphs from `index.html`, strip tags, decode `&amp;`, `&quot;`, `&#39;`, write `about.ts`. Print count, total output size, and missing files.

- [ ] **Step 2: Run the script against the source**

Run: `node web/scripts/bake-label-index.mjs "P:/Recent Projects/CallshopRadio/Label_Index/Label_Index_0.0.3"`
Expected: `226 labels`, `226 logos`, total ≈ 2.25 MB, no missing files.

- [ ] **Step 3: Verify the data**

Run a Node check: 226 entries, all `logo` paths exist under `web/public/index/logos`, all years match `/^\d{4}$/`, no empty names.

---

### Task 2: Header without burger, with mobile section icons

**Files:**
- Create: `web/layers/base/components/site/SiteSectionLinks.vue`
- Modify: `web/layers/base/components/site/SiteHead.vue`
- Delete: `web/layers/base/components/site/SiteMenu.vue`
- Delete: `web/layers/base/components/site/SiteMenuButton.vue`
- Modify: `web/app/stores/mainStore.ts` (remove `menuOpen` only if unused)

**Interfaces:**
- `SiteSectionLinks` renders three `NuxtLink`s with `aria-label` "Shows", "Pool", "Words".

- [ ] **Step 1: Build the icon links**

Shows = play triangle, Pool = contact card (rounded rect + circle + two lines), Words = three text lines, Index = 2×2 grid. Circular 24 px SVG in the header icon style; accents `--color-pink`, `--color-blue`, `--color-green`, `--color-purple`; hover fills the circle.

- [ ] **Step 2: Wire the header**

Wrap the logo and `SiteSectionLinks` in a left group. Hide the section links above 900 px. Remove `SiteMenuButton` and `<SiteMenu />`. Add the fourth desktop tag `Index` with `--color-purple`. Utility icons (search, chat, schedule, account) stay right.

- [ ] **Step 3: Remove dead code**

Delete the two menu components. Grep `menuOpen`, remove it from the store and any remaining usage.

- [ ] **Step 4: Verify**

Playwright at 1440 and 390: no burger, three accent icons on mobile, text tags on desktop, no horizontal overflow.

---

### Task 3: Footer consolidation

**Files:**
- Create: `web/layers/base/components/site/SiteSocialIcon.vue`
- Create: `web/layers/base/components/site/SiteApplyIcon.vue`
- Create: `web/layers/base/components/site/SitePageIcon.vue`
- Modify: `web/layers/base/components/site/SiteFoot.vue`
- Modify: `web/layers/base/components/site/SiteDarkMode.vue`

**Interfaces:**
- `SiteSocialIcon` takes `name: "instagram" | "soundcloud" | "bandcamp" | "discord"` and renders a 16 px `currentColor` SVG.

- [ ] **Step 1: Nav columns**

Explore: Shows, Pool, Words, Index (`/index`, no external arrow), Shop.
Pages: Account (`/konto`), Chat (button, only if `chatEnabled`), Schedule (button opening the timetable popup), Legal & Privacy (`/legal`).
Follow: brand icon + text + external arrow for Instagram, SoundCloud, Bandcamp, Discord.
Stations: code, city, address inline, email, map icon. Addresses DUS `Erkrather Straße 6, 40233 Düsseldorf`, LPZ `Crottendorferstraße 10, 04317 Leipzig`, VIE `Praterstern 5, 1020 Wien`. Right footer column `minmax(32rem, 1.1fr)`; footer top stacks ≤1100 px; ≤700 px the address moves to a second line.

- [ ] **Step 2: Apply for**

Under the stations, separated by a rule: two icon chips (Residency `https://tally.so/r/gDRaB1`, Pool-Profile `/konto` until the account tab ships) and a guest row with a mic icon + label + three city chips `DUS`/`LPZ`/`VIE` (`https://tally.so/r/31ap5O`, `https://tally.so/r/wAk9Dy`, `https://tally.so/r/nPor45`). Use `aria-label`/`title` with the full city names. Move `words@callshopradio.com` under `info@` in the brand column. Target height ~107 px.

- [ ] **Step 3: Theme switch**

Bottom row: label "Light / Dark" + `SiteDarkMode` left, Back to top right. Implement `SiteDarkMode` as a 44×24 pill switch with an 18 px thumb, 260 ms transform animation, `role="switch"` and `aria-checked`; respect `prefers-reduced-motion`.

- [ ] **Step 4: Verify**

Playwright light/dark at 1440 and 390: columns, toggle, icons, mail links, no `Contact` link.

---

### Task 4: Contact redirects

**Files:**
- Modify: `web/nuxt.config.ts`

- [ ] **Step 1: Add route rules**

```ts
"/contact": { redirect: { to: "/", statusCode: 301 } },
"/de/contact": { redirect: { to: "/de", statusCode: 301 } },
```

- [ ] **Step 2: Verify**

`GET /contact` → 301 `/`; `GET /de/contact` → 301 `/de`.

---

### Task 5: Index page

**Files:**
- Create: `web/app/pages/label-index.vue` (actual route file; `?` fallback unnecessary — `pages/index/index.vue` conflicts with the home page)
- Create: `web/layers/base/components/index/IndexCard.vue`
- Create: `web/layers/base/components/index/IndexFilterBar.vue`
- Create: `web/layers/base/components/index/IndexDialog.vue`
- Create: `web/layers/base/components/index/IndexLinkIcon.vue`
- Create: `web/layers/base/components/index/IndexAbout.vue`
- Modify: `web/layers/base/assets/styles/abstracts/variables.postcss` (`--color-purple: #b178ce`)

**Interfaces:**
- `IndexCard` props: `label`, emits `open`.
- `IndexFilterBar` props: `query`, `sort`, `total`, `visible`; emits `update:query`, `update:sort`.
- `IndexDialog` props: `label`; emits `close`.
- `IndexAbout` props: `paragraphs`.

- [ ] **Step 1: Verify the route**

Create a minimal page, run the dev server, check `/index` and `/de/index`. If the directory name conflicts with `pages/index.vue`, switch to the fallback file and re-check both locales.

- [ ] **Step 2: Page shell**

H1 "Index", intro sentence, count, About toggle with a 3-line excerpt of the first paragraph, filter bar, grid 4/3/2, dialog. Set `--index-accent: var(--color-purple)` on the page and use it for eyebrow, active sort, count, card hover/focus, dialog links and About. Use `useSeoMeta`.

- [ ] **Step 3: Filtering and sorting**

Client-side name/location search; A–Z via `localeCompare("en", { sensitivity: "base" })`; YEAR ascending with unknown last; SHUFFLE Fisher–Yates on click.

- [ ] **Step 4: Card and dialog**

Card: square, 1 px border, 5 px radius, white inset logo surface, name + year, hover/focus accent. Dialog: native `<dialog>`, logo left, fields right, link chips, Esc/backdrop/button close, focus returns to the card.

- [ ] **Step 5: Verify**

Playwright: 226 cards, search reduces the count, sorts reorder, dialog opens/closes, no 404 images, light/dark, mobile 2 columns.

---

### Task 6: Landing teaser

**Files:**
- Create: `web/layers/base/components/site/SiteIndexTeaser.vue`
- Modify: `web/app/pages/index.vue`

- [ ] **Step 1: Build the band**

Top rule, two columns: eyebrow "Index", H2 "Independent label archive", one sentence, CTA "Browse the Index"; right a 4×2 grid of 8 randomly sampled, unique labels (fresh per visit, deterministic first render for hydration). Each tile links to `/index?label=<slug>` and opens that label's dialog. Use the imported labels for count and logos.

- [ ] **Step 2: Wire the page**

Render after `<ModuleRenderer>` in `pages/index.vue`, before the footer.

- [ ] **Step 3: Verify**

Playwright 1440/390 light/dark: band spacing, 8 logos, CTA to `/index`, no overflow.

---

### Task 7: Final QA

**Files:** none

- [ ] **Step 1: Static checks**

Run `pnpm exec biome check` on changed files and `pnpm --filter web run typecheck`; only pre-existing errors allowed.

- [ ] **Step 2: Browser QA**

Desktop 1440, tablet 900, mobile 390; light/dark; check header, footer, `/index`, landing teaser, `/contact` redirect, console errors, broken links.

- [ ] **Step 3: Report**

Summarize changed files, verification output, and open items (Pool-Profile target, VPS redirect, contact doc unpublish). No commit.
