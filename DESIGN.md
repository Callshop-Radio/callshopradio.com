# DESIGN.md — callshopradio.live

The design system for the public website. It describes what the site already is, not a
wish. Every value below comes from `web/layers/base/assets/styles/` and the components;
if code and this file disagree, the file is wrong and should be fixed in the same change.

**Authority:** new components and edits follow these rules. Deviations need a reason in
the commit message and a line in *Open points* below.

---

## 1. Scope and exceptions

| Area | In scope |
| --- | --- |
| `web/layers`, `web/app` | yes |
| Sanity Studio (`studio/`) | no — Sanity's own UI |
| `web/app/pages/design-lab.vue` | no — prototype playground, never a reference |
| Instagram Story/Feed images, promo canvas | no — separate artwork rules |
| Transactional e-mail | no — separate template |

The site is a Nuxt 4 app with `@unocss/nuxt` and PostCSS. Text content lives in Sanity;
this document covers markup, styles and the few strings baked into components.

---

## 2. Principles

1. **Editorial, not app-like.** White (or near-black) page, one typeface, thin rules,
   coloured pills. No shadows except on fixed layers (player, chat, dialogs).
2. **Small type, generous space.** The page is set at 13 px and the rhythm comes from
   margins, not from size. Big type is reserved for page titles and display headlines.
3. **Colour is an accent, never a surface.** Pink, blue, green, purple and coral mark
   sections and tags; the page itself stays neutral.
4. **One value per role.** Radii, sizes and colours are chosen by role, not per
   component. A new value is a system change, not a local decision.
5. **Light and dark are equal.** Every token has both values; nothing is designed for
   one theme and patched for the other.

---

## 3. Colour

All colours are tokens in `abstracts/variables.postcss`. Every colour token is one
`light-dark()` pair — light value first, dark value second:

```css
--color-bg: light-dark(#fff, #090909);
```

`:root` declares `color-scheme: light dark`, so the OS decides by default. The theme
toggle only sets `data-theme="light"` or `"dark"` on `<html>`; it never writes a colour.
That makes this file the single source for both themes. Accents are identical in both
and stay plain values.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#fff` | `#090909` | page surface |
| `--color-bg-transparent` | `rgba(255,255,255,.5)` | `rgba(9,9,9,.33)` | frosted bar over media |
| `--color-text` | `#000` | `#fff` | body text, icons |
| `--color-black` | `#090909` | `#090909` | filled buttons, play controls |
| `--color-ink` | `#1a1013` | `#1a1013` | poster / title-card surface |
| `--color-white` | `#f6f6f8` | `#f6f6f8` | footer and teaser surface |
| `--color-grey` | `rgb(232,232,232)` | same | panel fill, skeleton, dividers |
| `--color-grey-transparent` | `rgba(232,232,232,.66)` | same | muted chip fill |
| `--color-dark-grey` | `#525252` | `#878787` | secondary text, rules |
| `--color-darker-grey` | `#2c2c2c` | same | hover fill on black |
| `--color-text-light` | `#888` | `#888` | hints, counts, placeholders |
| `--color-lines` | `currentcolor` | same | link underline |
| `--color-code-bg` | `var(--color-grey)` | same | inline code chip |
| `--color-fg-muted` | `var(--color-grey)` | same | loading skeleton |

### Section accents

| Token | Value | Section |
| --- | --- | --- |
| `--color-pink` | `#f794b3` | Shows |
| `--color-blue` | `#557fb9` | Pool |
| `--color-green` | `#78ce82` | Words |
| `--color-purple` | `#b178ce` | Index |
| `--color-merch` | `#ff8f77` | Merch |
| `--color-yellow` | `#f9ab0f` | highlight only |

Accents are used for the nav pill border and label, tag outlines, play affordances and
the pool-link dot. They are never used as a text colour on the page surface.

**One accent variable.** A scope sets `--accent`, everything inside reads it:

```css
.section--shows { --accent: var(--color-pink); }   /* who sets it     */
.play { color: var(--accent, var(--color-text)); } /* who reads it    */
```

There is no `--pill-accent`, `--row-accent` or per-page accent name. If an element needs
the section colour, it reads `--accent` with `--color-text` as the fallback.

`--color-merch-ink` is `color-mix(in srgb, var(--color-merch) 62%, var(--color-text))`
and exists so merch text keeps contrast in both themes.

### Raw black and white

`#000` and `#fff` may appear **only** in shadows, gradient stops and overlays that sit
on top of imagery. They are not theme colours; use a token for anything that must flip.

### Tints

There are no `--color-*-rgb` channel triplets. A tinted border or glow is
`color-mix(in srgb, var(--color-x) 10%, transparent)`, which needs no second token per
colour and follows the theme automatically.

---

## 4. Typography

One family, Icona Sans, in three weights. Everything else is size, tracking and case.

### Families

| Token | Face | Notes |
| --- | --- | --- |
| `--font-text` | Icona-Sans-Regular | body, most UI |
| `--font-text-medium` | Icona-Sans-Medium | emphasis, rich-text headings |
| `--font-text-semibold` | Icona-Sans-Semibold | card titles, labels, buttons |
| `--font-text-italic` / `-medium-italic` | italic cuts | rich text only |

There is no display family: display titles are told apart by size and tracking, not by a
second face. The semibold italic cut exists as a file but no CSS reaches it, so it is
not declared.

Each face is declared with a weight descriptor (300 / 400 / 550) so the browser never
synthesises a bold. **Pick the weight with the family token, not with `font-weight`.**
`font-weight: 700` and `600` still appear in a few legacy rules and produce synthetic
bold (see *Open points*).

### Scale

Desktop is the base from 600 px up; the `--phone-only` block (≤ 599 px) is the only
override. There is no separate tablet or desktop block — they were identical.

| Token | Desktop | ≤ 599 px | Role |
| --- | --- | --- | --- |
| `--mini-font-size` | 8 px | 10 px | city flags, counters, index numbers |
| `--small-font-size` | 10 px | 10 px | tags, meta, artist lines, nav labels |
| `--base-font-size` | 13 px | 12 px | body copy, links, form labels |
| `--body-large-font-size` | 14 px | 14 px | form fields, secondary body |
| `--h4-size` | 16 px | 14 px | card subheads, long-form body |
| `--h3-size` | 18 px | 16 px | rich-text headings, dialog titles |
| `--h2-size` | 20 px | 18 px | card titles, section heads |
| `--h1-size` | 25 px | 22 px | page titles |

**No other size exists.** Eight steps is the whole scale. If a component needs a ninth,
the layout is wrong. There is no `--huge-font-size`: the largest type on the site is the
fluid display tier below, not a token.

Line height is `1.25 ×` the size (`--base-line-height`, `--h2-line-height`, …).
Navigation uses `--menu-line-height: 1.2`. Display headlines set their own tight
leading (`1.02`–`1.1`) in the component.

### Display tier

Page and hero headlines may use `clamp()` and exceed the scale: `.set-title`,
`.show-project__title`, `.pool-profile__name`, `.archive-masthead__title`,
`.merch-intro__title`, `.index-intro__title`, `.mixed-caption__title`, `.set-marquee__text`
and the `design-lab` prototypes. Rules for this tier:

- only for a single headline per section, never for UI or body;
- the value is fluid and component-owned — it is not a token;
- it does not change what any other element may use.

### Case and tracking

| Token | Value | Use |
| --- | --- | --- |
| `--label-letter-spacing` | `0.06em` | uppercase labels and tags |
| `--kicker-letter-spacing` | `0.08em` | editorial kickers |
| `--menu-letter-spacing` | `0.0625rem` | navigation |
| `--button-letter-spacing` | `0.0425rem` | button labels |

Uppercase is used for tags, nav, artist lines and small labels — never for body copy.
Negative tracking (`-0.01em` … `-0.045em`) belongs to the display tier only.

`letter-spacing` takes a length, never a percentage.

---

## 5. Radius

One value per role, defined in `abstracts/variables.postcss`.

| Token | Value | Applies to |
| --- | --- | --- |
| `--radius-xs` | 4 px | kbd, thumbnails, focus rings |
| `--radius-media` | 5 px | every image, card, media frame, skeleton |
| `--radius-surface` | 12 px | dialogs, dropdowns, popovers, menus, panels |
| `--radius-pill` | 12 px | every text-bearing pill: nav, buttons, filters, inputs |
| `--radius-pill-sm` | 6.4 px | compact content tags inside cards (20 px tall) |
| `--radius-circle` | 999 px | square icon buttons, play buttons, dots, avatars in a box |
| `--radius-flag` | `4px 4px 0 0` | city flags sitting on a card's top edge |

Rules:

- Image + card + panel share `--radius-media`; a card with a city flag loses its
  **top-left** corner only.
- Pills are chosen by role, not by height: a 20 px tag uses `--radius-pill-sm`, a 28 px
  nav pill uses `--radius-pill`.
- Round avatars use `50%`; icon buttons use `--radius-circle`. Both are a circle for a
  square box.
- Split detail cards (pool, show, set, cover-flow) own the outer radius; the inner seam
  and inner media stay square.
- `50%` is the only other accepted value, and only for square boxes.

The rules that remain in `assets/styles/main.postcss` are not a guard layer. They are
the split-card seams that no single component can express: a card with a city flag
loses its top-left corner, a detail card clips its inner media to a square, a cover-flow
card carries the radius while its panels stay square. Every card sets
`--radius-media` itself; nothing is forced onto components with `!important` any more.

---

## 6. Space, layout, breakpoints

| Token | Desktop | ≤ 599 px |
| --- | --- | --- |
| `--base-padding` | 0.75 rem | 0.625 rem |
| `--big-padding` | 1.25 rem | 1.125 rem |
| `--mid-padding` | 1 rem | 0.8125 rem |
| `--small-padding` | 0.5 rem | 0.4375 rem |
| `--small-margin` | 0.875 rem | 0.4375 rem |
| `--mid-margin` | 2 rem | 0.575 rem |
| `--base-margin` | 2.75 rem | 2 rem |
| `--big-margin` | 4.25 rem | 3 rem |
| `--huge-margin` | 11 rem | 11 rem |
| `--content-gap` | 7.5 rem | 7.5 rem |

- Page width: `--page-max-width: clamp(0, 78rem, 100%)` (1248 px); from 1800 px it grows
  to `96rem` (1536 px).
- Page gutter: `--page-gutter = var(--big-margin)` above 900 px, `var(--mid-padding)`
  below.
- First content distance below the fixed bars: `--first-content-distance`.
- Fixed furniture: `--nav-bar-height: 67.2px`, `--player-bar-height: 58px`,
  `--side-panel-width: 24rem`.

Breakpoints (`global/customMedia.pcss`): 321, 599, 600, 900, 1024, 1200, 1280, 1440,
1800 px. Design at 390 and 1440; the 900 px line is the layout switch (filter dock
collapses, gutters shrink).

Use `@media (--phone-only)`, `@media (--tablet-portrait-up)`, `@media (--desktop-up)`
and the other custom media names. Never write a bare `@media (desktop-up: 1024px)` —
that is not valid CSS and the block is silently dropped.

---

## 7. Components

### Navigation pill
`.menu-main .tag` — 28 px tall, `--radius-pill`, 1 px accent border, `--small-font-size`
uppercase, `--menu-letter-spacing`. One pill per section, accent = section colour.
Active pill is filled with the accent.

### Content tag
`.tag:not(.city)`, `.filter-tag`, `.genre` — 20 px tall, `--radius-pill-sm`,
`--small-font-size`, uppercase, `padding: 0 var(--base-padding)`, no rule unless the
variant is outlined. Filled = black surface, white text.

### City flag
`.tag.city` — 15–16 px tall (`--city-tag-height`), `--radius-flag`, `--mini-font-size`,
uppercase, sits flush on the card's top-left corner. The card loses that corner.

### Artist line
`.show-artists` — `--small-font-size`, uppercase, `--label-letter-spacing`, 0.4 rem dot
before each name. Dot is `--color-dark-grey` without a linked profile and `--color-blue`
with one.

### Cards
`.grid-item`, `.teaser-item`, `.related-item` — `--radius-media` on the card and image,
image on top, date + play affordance, title at `--h2-size` in the semibold face, artist
line, then tags. No shadow, no border.

### Buttons
`.action-btn`, `.type-filter-btn`, `.sort-options`, `.account-action`, `.login__primary`,
`.save-to-list__button` — `--radius-pill`, `--small-font-size`, uppercase for filters,
`--button-letter-spacing`. Primary = black fill, secondary = outline, both 1 px.

### Play button
`.play-button` — circle (`--radius-circle`), black fill, white glyph. Sits at the image
corner or under the title; it never carries a label.

### Player bar
58 px, fixed, `--color-bg-transparent` over the page, cover thumb at `--radius-xs`, time
and status in `--small-font-size`, controls as icon buttons at `--radius-circle`.

### Search
Input 35 px tall, `--radius-pill`, `--base-font-size`; type filter pills at
`--radius-pill`; suggestion rows at `--radius-pill-sm` on hover; hints in
`--color-text-light`.

### Surfaces
Dialogs, dropdowns and popovers: `--radius-surface`, page background, 1 px
`--color-grey` rule, no shadow except the fixed chat panel and the player.

### Lists and tables
Timetable rows: title `--base-font-size`, meta `--small-font-size`, sub-meta
`--mini-font-size`, 1 px rule between rows, alternating `--color-grey` fill for the
current row only.

### Forms
Labels `--base-font-size` in the medium face; fields `--body-large-font-size`,
`--radius-surface` or `--radius-pill` when the field is a single line; error text
`--body-large-font-size` in the section accent; helper text in `--color-text-light`.

---

## 8. States

| State | Rule |
| --- | --- |
| Hover | colour shift only: text → `--color-text`, muted → `--color-text`, link underline → `var(--color-text)`. No size or position change. |
| Focus visible | 2 px outline in the element's accent (`--index-accent`, `--lab-accent`, `--color-text`), offset 2 px, `--radius-xs` follow. Never remove an outline without a replacement. |
| Active / selected | filled with accent or `--color-black`, text `--color-text` inverted. |
| Disabled | 45 % opacity, `cursor: not-allowed`, no hover change. |
| Loading | `--color-fg-muted` skeleton blocks at `--radius-xs`; no spinner in content areas. |

Hover styles are gated behind `@media (min-width: 1024px)` where the target is a link
inside running text, so touch devices do not keep a hover state.

---

## 9. Responsive

| What | ≥ 900 px | < 900 px | ≤ 599 px |
| --- | --- | --- | --- |
| Page gutter | `--big-margin` | `--mid-padding` | `--mid-padding` |
| Content gap | 7.5 rem | 7.5 rem | 7.5 rem |
| Nav | text pills | icon pills | icon pills |
| Filter dock | fixed bottom bar, genre + city rows | collapsed sheet with one row | same, full width |
| Grid | 3–5 columns | 2 columns | 1 column |
| Card title | `--h2-size` | `--h2-size` | `--h2-size` (18 px) |
| Type scale | desktop column | desktop column | phone column (§ 4) |
| Display headlines | `clamp()` max | `clamp()` mid | `clamp()` min |

---

## 10. Do / Don't

```css
/* DO — a card is a media surface */
.card {
  border-radius: var(--radius-media);
  background: var(--color-bg);
}

/* DON'T — a local radius, a local grey, a local size */
.card {
  border-radius: 12px;
  background: #fafafa;
  font-size: 0.85rem;
}
```

```css
/* DO — role decides the pill */
.filter-tag { border-radius: var(--radius-pill); }      /* control */
.card .tag  { border-radius: var(--radius-pill-sm); }   /* content label */

/* DON'T — height decides the pill, or both values live in one list */
.tag { border-radius: 100px; }
```

```css
/* DO — the family carries the weight */
.card__title { font-family: var(--font-text-semibold); }

/* DON'T — synthesise bold on a single-face family */
.card__title { font-weight: 700; }
```

```css
/* DO — theme colours are tokens */
.hint { color: var(--color-text-light); }

/* DON'T — hardcode a token value */
.hint { color: #888; }
```

---

## 11. Audit result

Measured over every `<style>` block in `web/layers` + `web/app` (excluding the
`design-lab` prototype), and over the rendered pages at 1440 × 900 in both themes.

| Metric | Before | After |
| --- | --- | --- |
| distinct `font-size` values | 92 in 486 declarations | 50, of which 8 tokens cover the scale; the rest is the display tier |
| distinct `border-radius` values | 39 in 348 declarations | 24, of which 7 tokens + `50%` + `0`; the rest is the design-lab |
| hardcoded hex colours | 10 distinct outside tokens, 48 occurrences | 4 (`#000`, `#fff` in shadows/gradients, plus two lab values) |
| undefined tokens in use | 33 (82 uses of `--color-text-light` alone) | 6, each either set by JS (`--grid-index`, `--filter-dock-global`) or read with a fallback (`--lab-motion`, `--mid-gap`, `--max-width`, `--lab-media-radius-mobile`) |
| defined but unused tokens | 9 | 0 |
| accent variables | 9 names for one idea | 1 (`--accent`) |
| cross-component `!important` guard | 20 declarations over 60+ selectors | 0 - the card radius lives in the cards |
| theme value sources | CSS tokens + 8 inline `setProperty` calls | CSS only (`light-dark()` + one attribute) |
| rendered font sizes on the home page | 14 | 7 |
| rendered radii on the home page | 11 | 6 |
| `letter-spacing: 1.5%` (invalid) | 2 | 0 |
| `@media (desktop-up: 1024px)` (invalid) | 1 | 0 |
| `--h3-size` defined twice | 1 | 0 |

Fixed in the same pass: `--h4-size` was never defined at base level, `--small-font-size`
was 10.04 px instead of 10 px, `--mini-font-size` was 7.8 px instead of 8 px, and
`--huge-margin` only existed inside media queries.

An invalid `@media (desktop-up: 1024px)` block was dropped by the browser. Its paddings
and margins were identical to the tablet block; the only difference was `--content-gap`,
which would have grown from 7.5 rem to 10.5 rem above 1024 px. That is a layout change,
so the block was removed and `--content-gap` is one value at every width. If the wider
rhythm was intended, set it deliberately in a media query and update this file.

---

## 12. Open points

1. **`font-weight: 700`** on `.search-hero__title`, `.site-player__cover--fallback` and
   `.tt-day__live`, and `600` in ten rules. On a single-face declaration these produce
   synthetic bold. Replace with the semibold family.
2. **Body copy is 13 px** (12 px on phones). It is deliberate and unchanged, but it is
   below common accessibility guidance for long text; long-form articles sit at 16 px.
3. **`--color-text-light` is the same `#888` in both themes.** It reads well on black,
   but it is the one token that does not flip. Consider `--color-dark-grey` in dark.
4. **`--color-lines` is `currentcolor`**, so rich-text link underlines inherit the text
   colour rather than a rule colour. Changing it is a visual decision, not a fix.
5. **`50%` vs `--radius-circle`** are both circles. Unify once the non-square cases are
   known.
6. **`design-lab.vue`** contains its own scale, its own accent and two raw values. It is a
   prototype and out of scope; do not copy from it.
7. **40 `!important` remain inside component styles** (`ModuleContentTeaser` 8,
   `modules/main.postcss` 14, …). They are local overrides, not the old global guard, but
   each one is a rule that lost a specificity argument. Worth a pass of its own.
8. **Component-local tokens** (`--lab-*`, `--cover-flow-*`, `--chat-line`, `--as-surface`)
   are real configuration but they live next to design tokens without a marker. A prefix
   convention (`--cfg-*`) would separate the two vocabularies.

---

## 13. Checklist for a new component

- [ ] Every colour is a token; nothing hardcoded except raw black/white in overlays.
- [ ] Every size is one of the eight scale tokens.
- [ ] Radius comes from § 5 by role, not by eye.
- [ ] Weight comes from the family token.
- [ ] Spacing uses `--base/big/mid/small-padding` and `-margin`.
- [ ] Uppercase only for labels, tags and nav.
- [ ] Light and dark checked at 1440 px and 390 px.
- [ ] Hover changes colour only; focus-visible keeps a visible outline.
- [ ] No new `!important`; the only ones left are the split-card seams in `main.postcss`.
- [ ] A new colour is a `light-dark()` pair, not two blocks.
- [ ] A new accent scope sets `--accent`, it does not invent a variable.
- [ ] Text comes from Sanity, not from the component.
