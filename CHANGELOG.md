# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Local clone / development-environment fixes. Nothing here has been committed or
deployed yet.

### Transition: LibreTime outage

> **Temporary workaround.** The LibreTime server is offline. Stream 1 uses
> `https://icecast.callshopradio.com/callshopradio` directly and displays the
> Icecast `title` as now-playing. Stream 2 remains offline. Remove the fallback
> in `MusicController.vue` and `status.get.ts` once AzuraCast is live.

### Added

#### Privacy-friendly analytics (Umami) and a shared event layer

- **Umami:** Self-hosted at `https://stats.bitmancer.net` (website
  `861da160-7d80-4231-adb3-32bd406dd31b`). The tracker script is injected
  client-side **only after** the visitor accepts the existing "analytics" cookie
  category, and removed again when consent is withdrawn. A `data-before-send`
  handler double-checks consent before every request.
- **Consent:** `useAnalyticsConsent()` is the single source of truth. The cookie
  plugin writes it; GA4 is not even loaded before consent and Umami is only
  injected afterwards, so both providers always agree. The `cc_cookie` value is
  also read directly, so an existing choice survives a hard reload of
  client-rendered routes such as `/search` (which do not load the Sanity banner
  settings).
- **Shared wrapper:** `useAnalytics().track(name, params)` sends an event to GA4
  and Umami in one call. It is a no-op during SSR and without consent.
- **Events:**
  - `play_stream` — live Icecast stream started (`stream`, `now_playing`).
  - `play_set` — SoundCloud set started (`set_id`, `set_title`, `show_id`,
    `show_title`).
  - `audio_progress` — 25/50/75/100 % of a set (`set_id`, `percent`).
  - `audio_error` — Icecast/SoundCloud playback error (`source`, `error_code`).
  - `search` — settled search query (`search_term`, `results_count`,
    `content_type`, `source`).
  - `select_content` — content card/teaser click (`content_type`, `content_id`,
    `content_title`, `link_path`).
  - `filter_apply` — tag/genre/content-type filter (`filter_type`,
    `filter_value`, `filter_label`, `action`, `page`).
- **Umami script options:** `data-performance="true"` (Core Web Vitals),
  `data-exclude-search="true"` (no search terms in page-view URLs),
  `data-do-not-track="true"`, and `data-domains` restricted to
  `callshopradio.com,www.callshopradio.com` so localhost does not pollute the
  stats.
- **Privacy page:** consent-based Google Analytics 4 and Umami sections are
  rendered on `/privacy` (`/de/privacy`) as Portable Text blocks until the CMS
  content is updated.

### Changed

#### Performance: initial JS cut in half, LCP image prioritised

- **Symptom:** The production build shipped a single **1,391.49 kB** client
  chunk (**485.24 kB gzip**) because `manualChunks` returned `"vendor"` for
  every `node_modules` module. Article-only libraries (`hls.js`, Plyr, `embla`)
  were part of the entry.
- **Bundle:** Removed the blanket `manualChunks`; `RichText` now loads
  `ModuleMedia` and `ModuleCarousel` through `defineAsyncComponent`, so
  `MediaVideo`/hls and embla only load when a media/carousel block is on the
  page. Final entry: **626.9 kB / 243.4 kB gzip** (~50 % smaller). Async chunks:
  `MediaVideo` 512.7/158.9, Plyr 110.5/32.8, `ModuleRenderer` 64.4/16.5, embla
  19.2. The client manifest confirms hls/Plyr/embla are no longer in the entry.
- **LCP:** The centred cover-flow artwork is now `loading="eager"` and
  `fetchpriority="high"`, with `decoding="async"` and `width/height=500`; side
  cards stay lazy. This removes the delay caused by every card being lazy.
- **Network:** Added `preconnect` for `cdn.sanity.io` and `i1.sndcdn.com` and
  `dns-prefetch` for `w.soundcloud.com`.
- **Navigation:** Page transition shortened from 150 ms to 100 ms per phase
  (~200 ms total).
- **Fix along the way:** `ModuleIntroSet` used an undefined `index` in its tag
  `v-for`; now uses `tagIndex` and a stable `tag._id || tagIndex` key.
- **Verified:** Final production build succeeds; the client manifest shows the
  split; Biome is clean. Typecheck has only pre-existing project errors. After
  the dev-server restart `/shows` returns 200: the centered card image has
  `loading="eager"`, `fetchpriority="high"`, `decoding="async"` and
  `width/height=500`; the adjacent card stays `loading="lazy"`. Both preconnect
  links are present.

#### Navigation: first-row prefetch and responsive card sizes

- **Route chunks:** `NuxtLink` already prefetches component chunks when a link
  becomes visible (Nuxt 4 default). No eager all-page prefetch was added.
- **Intent prefetch:** Detail payloads are fetched on `mouseenter`, `focus`,
  `touchstart` and now `pointerdown`; the per-app `inFlight` set still dedupes
  requests and the payload cache is checked first.
- **Proximity prefetch:** Only the first three related cards use
  `prefetchOnProximity`. Each observes the anchor with a `400px` root margin,
  schedules through `requestIdleCallback` (`1500ms` timeout, `200ms` fallback)
  and calls the same payload prefetch. A global queue allows at most **two**
  concurrent proximity requests; intent prefetches bypass the queue.
- **Guards:** No prefetch on the server, while the document is hidden, when
  `navigator.connection.saveData` is set, or on `slow-2g`/`2g`/`3g`.
- **Images:** Related cards now emit Sanity `srcset` at `400/750/1200w` with
  `sizes="(min-width: 1101px) 30vw, (min-width: 721px) 45vw, 90vw"`, and
  `loading="lazy"`/`decoding="async"`. `MediaImage` accepts a `sizes` prop; the
  teaser passes the same three-column sizes instead of claiming `100vw`.
- **Verified:** On `/shows/beat-the-rich`, related images render the expected
  `srcset`/`sizes`; a direct `mouseenter` on a related card added
  `set-detail-…` to `nuxtApp.payload.data` (the request itself did not show in
  Resource Timing). Calling the proximity scheduler on the first three cards
  added the three matching set-detail payloads; a fourth call was deduped by the
  payload cache. The headless tab reports `visibilityState=hidden`, which pauses
  IntersectionObserver, so the observer path is verified by the scheduler test
  rather than by real scrolling.
- **Known limitations:** The first-row limit is deliberate; all nine payloads
  are not prefetched. `MediaImage` call sites beyond the teaser still use the
  `100vw` default, and the infinite feed’s set images still use the single
  `w=750` URL.

#### Branded play button across the site

- **Fix:** Replaced every custom inline 9×12 play triangle with the supplied
  `public/icons/play-button.svg` (65×65 light-grey circle + black triangle) in
  the four card components, the four hero/intro components, and both header
  stream buttons.
- **Styling:** `.play-button` is now transparent with zero padding; its image
  fills the button, uses `object-fit: contain`, and scales to `1.05` on hover.
  `prefers-reduced-motion` disables that scale. The Plyr video overlay uses the
  same asset at `4rem` (`3rem` ≤900px), with its inner SVG hidden.
- **Accessibility:** The four card buttons gained `type="button"`; both header
  stream buttons have dynamic `aria-label` / `aria-pressed`; the existing
  `sr-only` play labels remain. Pause icons and offline styling are unchanged
  (stream 2 stays greyed out).
- **Verified:** `/shows` has 19 play buttons, all pointing at
  `/icons/play-button.svg`, with **0** inline play SVGs; hero buttons measure
  `64/55/47/44px`, grid cards `17px`, all with transparent background and
  `padding: 0`. `/shows/beat-the-rich` has 9/9 related buttons on the asset.
  Header stream images are `13×13` (stream 2 scales to `8×8` while offline) and
  expose `Play stream 1/2`. A synthetic `.plyr__control--overlaid` resolves to
  `64×64`, the asset background, radius `100px`, inner SVG `display:none`.
- **Known limitation:** The SoundCloud iframe keeps its native play button; it
  cannot be replaced from the host page.

#### Archive heroes: full-width cover flow

- **Symptom:** The cover flow on `/shows`, `/pool` and `/words` was capped at
  `--page-max-width` (`1112px` on a `1395px` viewport), so it sat in a narrow
  column with large empty side margins while the filter bar below it stayed
  narrow as well.
- **Fix:** The archive `.intro-section` now allows `max-width: 100%`, and
  `ModuleIntroCoverFlow` uses the full content width with only the site gutter
  plus a small inner padding. The cover-flow arrows and stage now span the
  available width.
- **Verified:** At `1395px` viewport the hero is `1267px` wide (was `1112px`);
  the filter bar remains `1112px`. No horizontal overflow at `1395px` or
  `1000px`.

#### Grid density: 3/4/5/6 column switch

- Added a four-position pill switch ("Cols") to `ModuleContentGrid` for sets,
  shows and pool grids. It now sits **centered in the fixed bottom filter bar**,
  between City on the left and Sort on the right.
- The four numbers are equal-width and centered; the active position is shown
  with an inverted thumb and `aria-pressed`.
- Pressing the control widens the thumb by 18 % (animated `width`/`left`, so the
  `100px` pill corners keep their shape); releasing slides it to the selected
  position with a `0.38s` ease-out curve. Keyboard activation gets the same
  stretch cue, and `prefers-reduced-motion` disables the transition.
- The grid switches from the flex-based 3-column calculation to CSS Grid
  (`repeat(var(--grid-columns), minmax(0, 1fr))`) on desktop, with column-aware
  gaps so 4–6 columns do not inherit the very wide 3-column gutter. The choice
  is shared through `useState` across client-side navigation.
- `filter_apply` is emitted with `filter_type: "grid_columns"` when the density
  changes, so the choice is visible in Umami/GA4.
- The control is hidden for Words and below `1101px`, where the existing
  2/1-column layout remains.
- **Verified:** At a `1395px` window (CSS viewport `1373px`) the control is
  `138px` wide and centered (`x=617`, bar center `687`) inside the `1112px`
  bottom bar. 3/4/5/6 columns render without horizontal overflow; at
  6 columns the cards are `151px` wide and six fit per row. Pressing the control
  widened the thumb from `24.8px` to `27.8px` mid-press while its
  `border-radius: 100px` stayed in place; after release the active position
  changed and the thumb returned to `24.8px`. At `1000px` the control is
  `display:none` and the grid falls back to 2 columns.

#### Genre tags: smaller in 5/6-column cards

- **Symptom:** In the 5-column archive view the genre pills wrapped onto several
  lines and dominated the card; at 6 columns they were even denser.
- **Fix:** The per-card tags toggle was removed again. Genre tags are always
  visible; at 5/6 columns their font size, padding and gap are reduced (5
  columns: 86 % font size, 0.4× padding; 6 columns: 78 % font size, 0.32×
  padding, 1 px border). There is no plus button and no filter-bar control.
- City tags on the artwork stay visible at every density; only the genre/tag
  pills inside the card content are affected.
- At 3/4 columns and at ≤`1100px` the tags remain visible with the previous
  sizing.
- **Verified:** At 5 columns the tags are `8.63px` with `2.8px 4.5px` padding and
  a `3.15px` gap; at 6 columns `7.83px` / `2.24px 3.6px` / `2.52px` (two rows at
  `151px` card width). At 3/4 columns they use `10.04px` / `7px 10px`. No
  horizontal overflow; the plus button count is `0`.

#### Genre cloud: same-size subgenres inline in one flowing list

- **Symptom:** Expanding a genre showed its subgenres in a separate, smaller
  rail next to/below the genre. The hierarchy was hard to read, and the rest of
  the genres did not continue directly behind the expanded group.
- **Fix:** The filter is now one flat, ordered cloud (`genreCloud`): each genre
  is followed immediately by its subgenres when expanded; all following genres
  continue in the same flex-wrap flow. There is no nested rail and no separate
  group column.
- **Same size:** Genres and subgenres use the same font size, padding and pill
  height. Genres keep the white outline; subgenres get a pink
  outline, a pink fill when active, and a `7px` pink string segment in the gap
  to their left. The string sits at the vertical centre of the pills
  (`top: 50%`, `1px` high, `opacity: .6`), so it appears behind the pills in the
  gaps like a pearl necklace.
- **Animation:** `TransitionGroup` name `pearl`. Each subgenre enters with a
  `0.42s` scale/slide and a `28ms` stagger (`--pearl-index`); the already
  visible genres shift smoothly with `pearl-move` (`0.38s`), so the cloud
  rearranges instead of jumping. The chevron rotates when the genre is open;
  `prefers-reduced-motion` disables the stagger and move transitions.
- **Filter semantics:** Multiple selected subgenres are ANDed. The parent genre
  is an OR bucket only while no subgenre is selected. Verified with the live
  data: `Jazz + Library` returns exactly the two sets that carry both tags
  (`Avontuur`, `Catching Worms`); `Blues + Library` returns none.
- **Collapse / override:** `expandedGenres` is now separate from
  `activeGenres`. Selecting a subgenre adds the parent to `activeGenres` but
  marks it as overridden (dark pill); the parent can be collapsed while the
  selected subgenres stay in the cloud. Further subgenres are ANDed. Deselecting
  the last subgenre removes the parent from `activeGenres` while collapsed.
- **Verified:** At a `1395px` window the first Jazz subgenre starts `7px` after
  the Jazz pill on the same row; both pills are `28px` high with
  `10.04px` font and `7px 10px` padding. The expanded cloud has 28 children
  (13 genres + 15 Jazz subgenres); the next genre after the subgenres is
  `Latin I Caribbean`. The string is `1px × 7px`, pink
  (`rgb(247, 148, 179)`), centred at `~12.8px` inside the `28px` pill. At `60ms`
  the subgenres report the `pearl-in` animation and the cloud is already
  shifting. Selecting `Library` makes the Jazz parent dark/overridden and keeps
  Library as the selected subgenre; collapsing Jazz leaves exactly that subgenre
  in the cloud.
- **Mobile:** The same flat cloud is used in the mobile filter panel; the
  desktop dock and density control remain desktop-only.

#### Filter dock: fixed bottom genre cloud and transparent pill bar

- **Symptom:** The genre cloud and filter controls occupied a panel at the top
  of the grid; on tall grids the filters scrolled away, and the bar had a solid
  black fill.
- **Fix:** On desktop (`>=1101px`) the filter section is fixed to the bottom of
  the viewport: the genre cloud scrolls above a transparent pill bar. The cloud
  is no longer a separate panel with its own background, border or top offset.
- **Bar:** `City` sits on the left, the 3/4/5/6 `Cols` control is centered, and
  `Sort` is on the right. The bar has only a `1px solid var(--color-text)`
  border, a `100px` radius and a blurred transparent background; the solid black
  fill is gone. The old `Tags ↑/↓` toggle and the active-filter chip row are
  removed from the bar; selected subgenres remain visible in the genre cloud
  (pink pill, dark parent), and city/tag pills show their own active state.
- **Layout safety:** A `ResizeObserver` measures the fixed dock and exposes
  `--filter-dock-height`; `.content-grid` reserves that height at the bottom so
  the last row stays clickable. The cloud wrapper is capped at `40vh` and scrolls
  independently.
- **Blur gradient:** A single fixed, `pointer-events: none` layer sits behind the
  dock (`z-index: 9998`, below the `9999` dock). It uses
  `backdrop-filter: blur(32px)` plus a `mask-image` linear gradient over the
  bottom `30vh`; the mask fades the filtered backdrop to transparent instead of
  stacking a blur div per level. It is hidden below `1101px`.
- **Mobile:** `<=1100px` keeps the existing mobile filter trigger and overlay
  unchanged.
- **Verified:** At a `1395px` window (CSS viewport `1373px`) the dock is
  `1373px` wide, `140px` tall collapsed and `174px` tall with Jazz expanded; the
  bar is `1112px × 49px` with `background: rgba(0,0,0,0)`, a white `1px` border
  and `100px` radius. City starts at `x=146`, the density control is centered at
  `x=617`, Sort occupies the right cell. Expanding Jazz inserts 15 subgenres;
  selecting Library darkens the Jazz parent and leaves Library as the only
  visible subgenre in the cloud; the bar stays City/Cols/Sort without a chip.
  Collapsing Jazz keeps that selected subgenre. The grid bottom padding follows
  `160 → 174px`; at the page bottom the last card ends at `522px`, above the dock
  top at `662px`. No horizontal overflow. The blur layer is `30vh` tall
  (`241px` at an 802px viewport, starting at `y=561`), `z-index: 9998`,
  `pointer-events: none`; its mask fades the `32px` backdrop blur from full at
  the bottom to transparent at the top, and it is hidden below `1101px`.
- **Known limitations:** The fixed dock overlays the bottom of the cover-flow
  hero (including its dots) at the top of the page; it is desktop-only; the
  cloud is capped at `40vh`; the dock also overlays the footer. The blur gradient
  fades the effect's intensity via a mask, not the blur radius itself; browsers
  without `mask-image` + `backdrop-filter` lose the smooth fade.

#### Custom scrollbar: themed page and filter panels

- The page previously hid all scrollbars. `html`/`body` now show a thin
  `var(--color-dark-grey)` thumb on a transparent track, turning
  `var(--color-pink)` on hover; `scrollbar-gutter: stable` avoids layout shift.
- The filter cloud and the mobile filter panel use a thinner pink thumb
  (`8px`, transparent track, hover white). Other elements keep the hidden
  scrollbar treatment.
- **Verified:** computed `scrollbar-width: thin`; page color
  `rgb(135,135,135) transparent`; cloud `rgb(247,148,179) transparent`;
  desktop and mobile render without horizontal overflow.

#### Endless feed: preloaded infinite scroll

- **Symptom:** The archive grid ended with a right-aligned plus button; reaching
  the next page required a click and interrupted scrolling.
- **Fix:** The plus button is gone. A sentinel after the grid is watched by an
  `IntersectionObserver` with a `1200px` bottom root margin, and a throttled
  scroll listener acts as a fallback when the sentinel stays in view. Each
  trigger fills up to **eight** nine-item pages (72 cards), then shows a small
  three-dot loader while a request is in flight. A `visible / total` status line
  above the sentinel shows progress. Existing `UnLazyImage` lazy loading is
  unchanged; only the data arrives early.
- **Verified:** At a `1373px` CSS viewport the grid starts with 9 cards and the
  sentinel at `y=2445`. Scrolling to ~800px above the sentinel preloaded the next
  page (18 cards) before reaching the bottom. Repeated bottom scrolls grew the
  grid through 153, 729, 1197, 1737 to the final **1953 / 1953** cards (the
  Sanity count); the plus button count stayed `0`, the loader appeared during
  fetches, and there was no horizontal overflow. The feed is exhausted when the
  count matches.
- **Known limitations:** Browsers without `IntersectionObserver` have no
  fallback button; the feed arrives in 72-card batches, so the status line shows
  intermediate counts while scrolling; images remain lazy, so a fast scroll can
  still show artwork loading after the text cards.

#### Mobile filter: swipeable bottom sheet and persistent tab

- **Symptom:** On mobile the filter was opened by a small top-right icon and
  appeared as a dropdown from the top; it was hard to reach with one hand.
- **Fix:** The mobile filter is now a bottom sheet. A subtle `^ Filter` tab sits
  at the bottom centre while the sheet is closed; tap it or swipe up to open.
  The sheet follows the pointer, has a sticky header with grabber and close
  chevron, and closes on a downward header drag past 28% / the close button /
  the backdrop. A smaller drag snaps back open (72% threshold for the opening
  swipe).
- **Layout/behaviour:** `openMobileFilters` / `closeMobileFilters`, pointer
  capture, `touch-action:none` on the tab/header, body scroll lock, a `0.42s`
  transform transition, `88dvh` max height, scrollable content, safe-area
  padding, and the active-filter count on the tab. The mobile filter content
  stays mounted during the close animation; desktop `>=1101px` keeps the fixed
  dock and hides the tab/header.
- **Verified:** At a 512px mobile window the closed tab is at the bottom centre
  (`82x30`), the sheet is off-screen (`translateY(389.6px)`) and hidden. A
  pointer swipe up opens it (`active`, tab hidden, body `overflow:hidden`); a
  150px header drag closes it (tab returns, body reset, sheet off-screen); a tap
  reopens (the drag flag no longer swallows the next tap); a 50px drag snaps
  back open. At 1000px the same open/close/reopen works with no horizontal
  overflow; desktop 1305px shows the dock only.
- **Known limitations:** Swipe-to-close is on the sticky header, not the
  scrollable content; the sheet is capped at `88dvh`; the old top-right trigger
  is gone; body scroll is locked while open.

#### Cover flow: wider seven-card fan and layered fade

- **Symptom:** Only five cards were visible even on a wide desktop; the outer
  cards sat close to the centre. Cards also changed stacking layers abruptly
  when their z-index changed during a slide.
- **Fix:** A wide layout (`min-width: 1340px` CSS viewport) now shows seven
  cards. The fan uses wider offsets (`14.75 / 27 / 34rem`) and a wider scale
  falloff (`1 / .84 / .70 / .54`) for centre/±1/±2/±3. Between `901px` and
  `1339px` the previous five-card layout remains.
- **Fade/blur:** Opacity and blur fall off more strongly with distance:
  `0: 1 / 0`, `1: .78 / 2.5px`, `2: .58 / 4.5px`, `3: .45 / 7px` (wide).
  The card transition is `0.72s` for transform, opacity and filter, and the
  element gets `will-change: transform, opacity, filter`.
- **Layered z-index:** Cards moving outwards keep their old z-index while they
  fade and blur, then settle after the transition. The incoming centre is
  always lifted to z6; other inward cards get one temporary layer above
  (`target + 1`), so they fade in front instead of snapping. Layers normalize
  to `5 / 4 / 3 / 2` after `720ms`.
- **Keyboard:** The `.cover-flow` wrapper is a focusable carousel region
  (`role="region"`, `aria-roledescription="carousel"`, `tabindex="0"`);
  ArrowLeft/ArrowRight, Home and End navigate, while the arrow and dot buttons
  remain native. Focus-visible gets a `2px` outline. Verified with focus:
  `0 → 1` (Right), `End → 9`, `Home → 0` across 10 dots.
- **Verified:** At 1395/1366 windows seven cards are visible; no horizontal
  overflow. Outer card edges are `26..259` and `1114..1347` at a 1373px CSS
  viewport. At 1280px five cards are visible, also without overflow. At rest
  the z-index is `5/4/3/2` for
  center/±1/±2/±3. 60ms after a next click the incoming center is z6 with
  computed opacity `~0.86` and blur `~1.6px`; the outgoing center is z5 at
  `~0.92` / `~0.9px`; after 800ms the layers are normalized.
- **Known limitation:** Seven cards require a CSS viewport of at least 1340px;
  the outer two are intentionally narrow, soft slivers. The z-index itself
  remains discrete and is masked by the opacity/blur transition.

### Fixed

#### Cover flow: arrows and dots locked during the 720 ms animation

- **Symptom:** The previous/next arrows and the dots were disabled for the whole
  slide transition. Rapid clicks were dropped, so moving several slides quickly
  required waiting for each 720 ms animation.
- **Root cause:** `navigate()` returned early while `isAnimating` was true, and
  the controls bound `:disabled="isAnimating"`.
- **Fix:**
  - Removed the `isAnimating` guard and the `:disabled` bindings; the controls
    stay enabled during transitions.
  - Every click updates `currentIndex` immediately. A navigation token ensures
    only the latest request applies its target offsets, so quick clicks are not
    queued behind the animation and the cards move straight to the newest slide.
  - Cards that would cross the ring or become the new center are placed directly
    at their new relative position before the target offsets are applied. A
    one-frame `--snap` class disables the CSS transition for those cards, so they
    do not fly across the stage; cards entering on the same side still animate.
- **Verified:** Four rapid next clicks advance four slides (`0 → 4`), the arrow
  remains enabled during the transition (`disabled === false`), and the final
  center card, active dot and offsets are in sync (`centerIndex === 4`, offsets
  `[-4,-3,-2,-1,0,1,2,3,4,5]`). A dot click during an animation jumps to that
  slide immediately; single-step navigation still animates normally.

#### Analytics consent: Google Analytics was loaded before opt-in

- **Symptom (audit finding):** `gtag.js` was requested on page load even before
  the visitor accepted the "analytics" category. The config used
  `initialConsent: false`, which is **not** a `nuxt-gtag` option and therefore
  had no effect.
- **Root cause:** `nuxt-gtag` was running in its default `initMode: "auto"`,
  which injects the script at startup. Because `initialConsent` was ignored, no
  Consent Mode default was queued either.
- **Fix:**
  - `gtag.initMode: "manual"` — no script request until `initialize()` is called
    after consent.
  - The cookie plugin queues a Consent Mode `default` once at startup, before
    `gtag.js` can load, with `analytics_storage`, `ad_storage`, `ad_user_data`
    and `ad_personalization` set to `denied`.
  - `gtag.config.send_page_view: false`; the cookie plugin sends `page_view`
    explicitly after consent and on SPA navigation (`page:finish`), deduped by
    path and waiting briefly for `useHead` to apply the new title.
  - On withdrawal, Consent Mode is updated to `denied`, `disableAnalytics()` is
    called, `_ga*` cookies are expired, and the Umami script is removed.
  - The consent UI now has fallback descriptions for "Strictly necessary" and
    "Analytics" when the CMS sections are empty, plus German labels and texts on
    `/de`.
- **Verified:** Before consent: no `googletagmanager` script, no matching
  resource request, no `_ga` cookie; `window.dataLayer` contains only the denied
  consent default, `js` and the `send_page_view: false` config. After consent:
  script injected, consent update `granted`, exactly one `page_view`; SPA
  navigation to `/pool` sends `page_path: "/pool"` with the correct title. After
  withdrawal: `ga-disable-G-…` is set, consent update `denied`, `_ga*` cookies
  are gone, Umami script and `window.umami` are removed. Re-consent enables both
  again.

#### Privacy policy: Google Analytics wording contradicted the consent setup

- **Symptom:** The Sanity privacy page said Google Analytics ran on "legitimate
  interest" and suggested browser opt-outs, while the implementation now
  requires explicit consent.
- **Fix:** `web/app/pages/[slug].vue` replaces the body of the existing
  "Google Analytics:" section with consent-based wording (Art. 6(1)(a) GDPR,
  § 25(1) TDDDG, Google Ireland Ltd., data processing agreement, retention,
  withdrawal) and appends the Umami section. The CMS document itself was not
  modified (read-only access); the replacement can be removed once the CMS text
  is updated.
- **Verified:** `/privacy` and `/de/privacy` render the new wording; the
  "We use Google Analytics based on legitimate interest" sentence is gone from
  the GA section.
- **Note:** This is a technical implementation, not legal advice. The final
  wording should be reviewed by the operator/legal counsel.

#### Transition: player 1 blocked while LibreTime is offline

- **Symptom:** Stream 1 showed "Offline" and could not be started, although
  `https://icecast.callshopradio.com/callshopradio` was live.
- **Root cause:** `MusicController.vue` already used the Icecast URL for
  `streamUrl1`, but the `offline` class was derived only from LibreTime's
  `/api/live-info-v2`. With the LibreTime server shut down, that endpoint
  returns `403` with an HTML error page, so `liveData` was empty. The `.offline`
  class sets `pointer-events: none` on the whole player.
- **Fix:**
  - `web/server/api/stream/status.get.ts` now normalizes non-object (HTML)
    responses to `null` and uses a 3 s timeout, so an offline LibreTime cannot
    leak an HTML string into `liveData`.
  - `MusicController.vue` treats stream 1 as live when the Icecast mount
    `/callshopradio` has a source and LibreTime has no current show/track. The
    player stays clickable and is labelled "Live"; the track name comes from the
    Icecast `title` when available (bare "Offline"/empty titles fall back to
    "Stream 1").
  - The client status fetch uses `cache: "no-store"` so a browser revalidation
    cannot keep an old now-playing title.
- **Verified:** Icecast returns `200 audio/mpeg` at 128 kbps; a 5 s sample is
  non-silent (mean −18 dB). Player 1 has no `.offline` class,
  `pointer-events: auto`, label "Live", now-playing
  "DJ Fehlt - Lucky Show w/ DJ Fehlt", and playback reaches
  `paused: false`, `readyState: 4`, `error: null`. MediaSession reports artist
  "DJ Fehlt" / title "Lucky Show w/ DJ Fehlt".
- **Temporary:** remove the Icecast fallback once AzuraCast is live. Stream 2
  (Wien) remains offline.

#### Landing page: hero SVG animation painted behind the image

- **Symptom:** The pink `AnimatedLogo` outline on the right stopped at the
  artwork's edge instead of running across the image.
- **Root cause:** The active slide is a CSS-grid item with `z-index: 2`, which
  creates a stacking context above `.graphics-front` (`z-index: 0`).
- **Fix:** Raised `.graphics-front` to `z-index: 3` in
  `web/layers/base/components/modules/ModuleHeroSlider.vue`. The slider nav
  (`z-index: 10`/`20`) stays above it.
- **Verified:** Computed styles: `.graphics-front` `3`, `.slide.active` `2`;
  the screenshot shows the pink path running over the artwork.

#### Local dev: empty content after client-side navigation ("No matching content.")

- **Symptom:** `WORDS → POOL` (or any client-side navigation) rendered the page
  shell but no grid, filters or list items. `/words` occasionally showed
  "No matching content.".
- **Root cause:** The Sanity project's CORS allowlist contains
  `http://localhost:3000` and `http://localhost:3333`, but not
  `http://localhost:3100`. Server-side rendering works (no `Origin` header);
  browser-side GROQ requests from `:3100` are rejected with `403` and no
  `Access-Control-Allow-Origin`.
- **Fix:** Run the local dev server on the already-allowlisted
  `http://localhost:3333`; the Sanity Studio moves to `:3334`.
- **Local env change** (not tracked, `web/.env`):
  `NUXT_SANITY_STUDIO_URL=http://localhost:3334`
- **Verified:** `/words → /pool` via client-side navigation renders
  `10` pool teasers, the filter bar and `0` console errors.

#### Dev server: rxjs module waterfall

- **Symptom:** ~10 s page loads in dev; 300+ individual module requests.
- **Root cause:** `build.transpile: ["rxjs"]` in `web/nuxt.config.ts` also adds
  rxjs to Vite's `optimizeDeps.exclude`, so the library was served as **177
  individual ESM files** instead of one pre-bundled chunk.
- **Fix:** Only transpile rxjs for production builds:
  `transpile: process.env.NODE_ENV === "production" ? ["rxjs"] : []`.
- **Verified:** `0` rxjs requests in dev (was `177`); production behaviour is
  unchanged.

#### Dev server: full page reload on first visit

- **Symptom:** The first visit triggered an automatic full reload.
- **Root cause:** Vite discovered `@portabletext/vue` and `groq` at runtime and
  re-optimised dependencies.
- **Fix:** Added both packages to `vite.optimizeDeps.include`.

#### Dev server: stale SSR payload rendered pages without their modules

- **Symptom:** After an HMR update, `/pool` rendered the cover-flow but not the
  module section below it; a reload fixed it.
- **Root cause:** `useCachedSanityQuery()` read `nuxtApp.payload.data[key]` on
  the **server** as well as the client. In dev the Nuxt app instance is reused
  across HMR updates, so a previous render's payload could leak into the next
  one.
- **Fix:** `getCachedData` now returns `undefined` on the server and only uses
  the payload cache on the client (which is what the composable was documented
  to do).
- **Verified:** 8 consecutive SSR requests and an HMR update all render the
  module section.

#### Page `load` event blocked for ~10 s by live audio preloading

- **Symptom:** The browser tab kept loading for ~10 s although the content was
  painted after ~0.6 s.
- **Root cause:** Both `<audio>` elements pointed at live Icecast streams with
  `preload="metadata"`. A fresh `loadedmetadata` for
  `https://icecast.callshopradio.com/callshopradio` took **~9.4 s**, and the
  document `load` event waits for media elements.
- **Fix:** `preload="none"` on both audio elements (template and
  `setupAudioElement`). Playback still loads the stream on demand via the
  existing `src` + `load()` + `play()` path.
- **Verified:** `loadEvent` now fires ~6 ms after `DOMContentLoaded`; both audio
  elements report `preload="none"`, `readyState=0` before the user presses play.

#### Images: multi-MB originals and JS-deferred loading

- **Symptom:** Images on the live site loaded slowly and in an apparently
  arbitrary order.
- **Root causes:**
  1. Several components rendered `image.asset.url` directly, i.e. the untouched
     Sanity original with no resize parameters and no `srcset`.
  2. `MediaImage` / `UnLazyImage` keeps the real URL in `data-srcset` and only
     promotes it to `srcset` after hydration, so no image request starts while
     the HTML is parsed. With every image lazy and at equal priority, the
     browser loads them in DOM order rather than by visibility.
- **Fix:** Added a shared `sanityImageUrl()` helper in
  `web/layers/base/composables/useContentImage.ts`. It rewrites Sanity CDN URLs
  to `?w=750&fit=max&auto=format` (Sanity negotiates WebP/AVIF via
  `auto=format`) and leaves non-Sanity URLs untouched. Applied in:
  - `modules/ModuleContentTeaser.vue`
  - `modules/ModuleContentGrid.vue`
  - `modules/ModuleRelatedContent.vue`
  - `modules/search/ModuleSearchResultBlock.vue`
  - `modules/intro/article/ModuleIntroArticle.vue`
  - `modules/intro/article/ModuleIntroArticleDetailPage.vue`
  - `composables/useSoundcloudArtwork.ts`
- **Measured impact** (same asset, `1254×1254` PNG):

  | Variant | Transfer |
  | --- | --- |
  | Original | 2,937 KB |
  | `?w=750&fit=max&auto=format`, WebP | 27 KB |

- **Verified:** no unresized Sanity images remain in the SSR HTML of `/`,
  `/pool`, `/words`, `/shows` or `/schedule`. The remaining raw URLs on
  `/shows` are SoundCloud artworks at `500×500`, which are already correctly
  sized.

### Changed files

```
web/.env.example
web/nuxt.config.ts
web/app/pages/[slug].vue
web/app/pages/pool/index.vue
web/app/pages/search/index.vue
web/app/pages/shows/index.vue
web/app/pages/words/index.vue
web/app/stores/mainStore.ts
web/layers/base/assets/styles/base/layout.postcss
web/layers/base/assets/styles/modules/main.postcss
web/public/icons/play-button.svg (new)
web/layers/base/components/elements/ElementsContentLink.vue
web/layers/base/components/media/MediaImage.vue
web/layers/base/components/media/MusicController.vue
web/layers/base/components/media/SoundCloudPlayer.vue
web/layers/base/components/modules/GridDensityControl.vue (new)
web/layers/base/components/modules/ModuleContentGrid.vue
web/layers/base/components/modules/intro/ModuleIntroCoverFlow.vue
web/layers/base/components/modules/intro/set/ModuleIntroSet.vue
web/layers/base/components/modules/intro/set/ModuleIntroSetDetailPage.vue
web/layers/base/components/modules/ModuleContentTeaser.vue
web/layers/base/components/modules/ModuleHeroEntry.vue
web/layers/base/components/modules/ModuleHeroEntrySolo.vue
web/layers/base/components/modules/ModuleHeroSlider.vue
web/layers/base/components/modules/ModuleRelatedContent.vue
web/layers/base/components/modules/intro/article/ModuleIntroArticle.vue
web/layers/base/components/modules/intro/article/ModuleIntroArticleDetailPage.vue
web/layers/base/components/modules/search/ModuleSearchResultBlock.vue
web/layers/base/components/text/RichText.vue
web/layers/base/composables/useAnalytics.ts (new)
web/layers/base/composables/useAnalyticsConsent.ts (new)
web/layers/base/composables/useCachedSanityQuery.ts
web/layers/base/composables/useContentImage.ts
web/layers/base/composables/useIntroCoverFlow.ts
web/layers/base/composables/usePrefetchRoute.ts
web/layers/base/composables/useSoundcloudArtwork.ts
web/layers/base/assets/styles/base/transitions.postcss
web/layers/base/plugins/cookieconsent.client.ts
web/layers/base/plugins/umami.client.ts (new)
web/server/api/stream/status.get.ts
```

Local-only (gitignored): `web/.env`, `studio/.env`.

### Verification

- `GET /`, `/pool`, `/words`, `/shows`, `/schedule`, `/search`, `/privacy` →
  `200`.
- Archive layout: at `1395px` the cover-flow hero is `1267px` wide (the filter
  bar stays `1112px`). The column switch is `138px` wide and centered inside the
  filter panel (`x=617`, panel center `687`); the collapsed panel ends `10px`
  above the grid. 3/4/5/6 columns render without horizontal overflow; at 6
  columns the cards are `151px` wide. At `1000px` the switch is `display:none`
  and the grid uses the existing 2-column layout.
- 5/6-column genre tags: `8.63px` / `7.83px` font, no plus button; the tags stay
  visible and no horizontal overflow occurs.
- Genre cloud: the first Jazz subgenre starts `7px` after the Jazz pill on the
  same row; both pills are `28px` high with `10.04px` font and `7px 10px`
  padding. The expanded cloud has `28` children (`13` genres + `15` Jazz
  subgenres); the next genre after the subgenres is `Latin I Caribbean`. The
  string is `1px × 7px`, pink (`rgb(247, 148, 179)`), centred at `12.8px`
  inside the `28px` pill and `opacity: .6`. Opening Jazz grows the panel from
  `148px` to `182px` and moves the grid from `1052px` to `1086px`; collapsing
  restores both. `Jazz + Library` returns exactly the two sets carrying both
  tags; `Blues + Library` returns none.
- Stream 1: `/api/stream/status` returns `liveData: {}` (no HTML) and the
  Icecast source for `/callshopradio`; player 1 has no `.offline` class,
  `pointer-events: auto`, label "Live", and playback reaches `paused: false`,
  `readyState: 3`, `error: null`.
- Icecast audio: `200 audio/mpeg` at 128 kbps, 44.1 kHz stereo; a 5 s sample is
  non-silent (mean −18 dB).
- Landing page: computed `z-index` is `.graphics-front` `3` and
  `.slide.active` `2`; the pink hero path is painted over the artwork.
- `/privacy` renders the new "Analytics with Google Analytics 4" and
  "Analytics with Umami" sections; `/de/privacy` renders the German versions.
- Neither the Umami script nor `gtag.js` is present in the SSR HTML or requested
  before consent. `window.dataLayer` starts with the denied Consent Mode default
  and a `send_page_view: false` config.
- After accepting "Analytics": `gtag.js` is injected once, the consent update is
  `granted`, exactly one `page_view` is sent, and `window.umami` exists.
  Withdrawal removes the Umami script, sets `ga-disable-G-…`, clears `_ga*` and
  queues a `denied` consent update.
- Event spy (`window.umami.track` replaced with a logger): `select_content`,
  `search`, `filter_apply` and `play_stream` fire with the documented
  parameters; no event fires before consent.
- `play_set` / `audio_progress` are bound to the existing SoundCloud Widget
  `PLAY` / `PLAY_PROGRESS` events; the Sanity context (`set_id`, `show_id`,
  titles) was confirmed in the store. The cross-origin SoundCloud iframe cannot
  be clicked by the automation, so those two were not triggered end-to-end.
- `pnpm lint` (Biome, formatter disabled) → clean for all changed files.
- `pnpm typecheck` → 264 errors in this run, all pre-existing (the type check is
  documented as advisory in `CONTRIBUTING.md`); no error in any of the new
  analytics files (`useAnalytics.ts`, `useAnalyticsConsent.ts`,
  `umami.client.ts`). The two `nuxt.config.ts` errors (Sanity visual editing and
  the i18n `optimizeTranslationDirective` option) are pre-existing; the new
  `gtag` block type-checks.

### Known limitations / follow-ups

- The image fixes only affect the live site after these changes are committed
  and deployed.
- `UnLazyImage` still promotes `srcset` after hydration. For the first
  above-the-fold image, passing `:eager="true"` and/or `:preload="true"` would
  improve LCP further.
- `NUXT_LIBRETIME_API_KEY` is empty locally, so the LibreTime-derived metadata
  is unavailable. Stream 1 falls back to Icecast and plays; stream 2 remains
  offline.
- Player 1 shows the Icecast `title` (a single ICY string, e.g.
  "DJ Fehlt - Lucky Show w/ DJ Fehlt"). It depends on the source publishing
  metadata; there is no structured artist/show/cover. The title refreshes with
  the 45 s status poll (server cache 15 s). Schedule and other LibreTime API
  calls remain broken until AzuraCast is live.
- The Icecast fallback is temporary; remove it when AzuraCast supplies metadata
  again.
- Umami is intentionally consent-gated, so visitors who decline the analytics
  category are not measured (same behaviour as GA4).
- The Google Analytics 4 and Umami sections on `/privacy` are rendered from code
  until they are added to the `privacy` page in Sanity; the CMS document itself
  was not modified. The code also replaces the outdated GA paragraph at render
  time.
- In the GA4 property, disable "Page changes based on browser history events"
  (the app now sends `page_view` explicitly) to avoid double counting. Set the
  data-retention period and exclude internal/localhost traffic there as well.
- The general "Legal Basis" paragraph on the privacy page still comes from
  Sanity and refers to legitimate interests. The GA section now explicitly
  relies on consent; the general passage should be reviewed and updated in the
  CMS.
- SoundCloud embeds are a separate third-party service and were not part of this
  change; their cookie/consent behaviour should be reviewed separately.
- `/search` is client-rendered (`ssr: false`) and therefore does not include the
  Sanity banner settings in its payload. An existing consent choice is restored
  from `cc_cookie`, but a first-time visitor does not see the consent banner on
  that route. This is pre-existing behaviour; analytics remains off without an
  explicit stored opt-in.
- The grid density switch is desktop-only and resets to 3 on a hard reload
  (`useState` only); it persists across client-side navigation. Words keeps its
  two-column article layout, and the switch is hidden there by design.
- In 5/6-column grids the genre tags are always visible and deliberately very
  small (`8.63px` / `7.83px`); at 6 columns they may wrap to two rows. City tags
  stay visible at every density.
- The genre string is rendered as `7px` pink segments in the gaps between the
  equal-size pills, not as one SVG path. On a wrapped row the first pill keeps a
  short incoming segment. Subgenre order follows the CMS `subGenres` order.
- The cloud can become tall (Jazz alone has 15 subgenres). On desktop the
  `ResizeObserver` pushes the grid down; on mobile the cloud lives inside the
  filter overlay and the grid offset is disabled.
- The archive hero uses the full content width but still respects the site's
  `64px` page gutter; it is not edge-to-edge.
- Production needs `NUXT_GTAG_ID` (the live property is `G-4HK2R9H2PT`) plus
  `NUXT_PUBLIC_UMAMI_HOST`, `NUXT_PUBLIC_UMAMI_ID` and
  `NUXT_PUBLIC_UMAMI_DOMAINS` in the Netlify environment. `web/.env` is local
  only and gitignored.

[Unreleased]: https://github.com/Callshop-Radio/callshopradio.com/compare/main...main
