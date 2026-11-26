# Navigation, Footer & Index — Design

- **Datum:** 2026-11-16
- **Status:** Entwurf zur Review
- **Repo:** `C:\GitHub\callshopradio.com` (nur lokal, kein Commit/Push/Deploy in diesem Schritt)

## 1. Ziel

Die zweite Navigation (Burger → Subnav) entfällt. Alle öffentlichen Ziele und Werkzeuge wandern in den Footer. Der Label-Index wird eine echte App-Unterseite mit statisch eingebackenen Daten und Logos. Die Landingpage bekommt ganz unten eine kompakte Index-Feature-Section.

## 2. Nicht-Ziele

- **Keine Writes in die Live-Sanity-Dataset.** Kein Schema-Deploy, kein Import, kein `--apply`.
- Keine Sanity-Verwaltung für den Index. Die Daten liegen statisch im Repo.
- Kein VPS-Deployment und kein Redirect von `index.callshopradio.com` in diesem Schritt (ops, später).
- Keine inhaltlichen Änderungen an Sanity-Dokumenten (auch nicht am Contact-Dokument).

## 3. Entscheidungen

| Thema | Entscheidung |
|---|---|
| Burger / Subnav | Beides entfällt komplett. |
| Mobile Sections | Drei Kreis-Icons für Shows, Pool, Words (nur ≤900 px). |
| Pool-Icon | Kontaktkarte / ID-Badge (nicht Person, nicht Pin). |
| Footer-Nav | Explore = Shows, Pool, Words, Index, Shop. Pages = Account, Chat, Legal & Privacy. |
| Contact | Link entfällt; `/contact` und `/de/contact` → 301 auf die Startseite. |
| Theme-Toggle | Kommt in die untere Footer-Zeile. |
| Apply for | Unter den Stations im Footer, mit Tally-Links. |
| Follow | Brand-Icons + Text + externer Pfeil. |
| Index | Statisch eingebacken: normalisiertes JSON + optimierte WebP-Logos im Repo. |
| Index-Akzent | Neue globale Farbe `--color-purple: #b178ce`; genutzt in Top-Nav, Filter, Karten, Dialog, About und Landing-Teaser. |
| Index-UI | Archivseite im App-Shell (Titel, About-Excerpt, Suche, Sortierung, Grid, Detail-Dialog). |
| Landing | Kompakte Index-Section nach den Sanity-Modulen, vor dem Footer. |

## 4. Header

### 4.1 Entfernen

- `SiteMenuButton` und `SiteMenu` aus `SiteHead.vue` entfernen.
- `SiteMenu.vue` und `SiteMenuButton.vue` löschen.
- `mainStore.menuOpen` entfernen, wenn nach der Löschung unbenutzt (vorher per Suche prüfen).

### 4.2 Mobile Section-Icons

Neue Komponente `SiteSectionLinks.vue`, sichtbar nur ≤900 px:

- Links: `/shows`, `/pool`, `/words`, `/index` (via `localePath`).
- Optik: 24-px-Kreis wie die bestehenden Header-Icons, Glyphe im Kreis.
- Farben: Shows `--color-pink`, Pool `--color-blue`, Words `--color-green`, Index `--color-purple` (#B178CE); Hover füllt den Kreis mit dem Akzent und stellt die Glyphe auf `--color-bg`.
- Glyphen: Play-Dreieck (Shows), Kontaktkarte mit Kreis + zwei Zeilen (Pool), drei Textlinien (Words), 2×2-Raster (Index).
- Jeder Link bekommt ein `aria-label` (Shows / Pool / Words / Index).

### 4.3 Layout

- Die Section-Icons sitzen in einer linken Gruppe direkt neben dem Logo; die Utility-Icons (Suche, Chat, Kalender, Konto) bleiben rechts.
- Desktop: Section-Icons `display: none`, die vier Text-Tags (Shows, Pool, Words, Index) bleiben wie bisher. Index nutzt `--color-purple` für Rahmen/Text und gefüllt im aktiven Zustand.
- Bei 390 px prüfen, dass alle Icons plus Logo in eine Zeile passen; falls nötig, Gap der Utility-Gruppe reduzieren.

## 5. Footer

Die Stations-Zeilen zeigen Code, Stadt, **Adresse**, E-Mail und Map-Icon. Adressen: DUS `Erkrather Straße 6, 40233 Düsseldorf`; LPZ `Crottendorferstraße 10, 04317 Leipzig`; VIE `Praterstern 5, 1020 Wien`. Die rechte Footer-Spalte ist dafür breiter (`minmax(32rem, 1.1fr)`), der Footer-Top stapelt ≤1100 px; ≤700 px rutscht die Adresse in eine zweite Zeile.

### 5.1 Spalten

**Explore**
- Shows → `/shows`
- Pool → `/pool`
- Words → `/words`
- Index → `/index` (intern, kein externer Pfeil)
- Shop → `/shop`

**Pages** (vorher „Information“)
- Account → `/konto`
- Chat → öffnet das Chat-Popup (nur wenn `chatEnabled`)
- Schedule → öffnet das Timetable-Popup (`useTimetableUi().openPopup("day")`)
- Legal & Privacy → `/legal`

**Follow**
- Instagram, SoundCloud, Bandcamp, Discord
- Jede Zeile: Brand-Icon (16 px, `currentColor`), Text, externer Pfeil wie bisher.
- Discord-URL weiterhin aus `mainStore.siteNav.discordLink` mit Fallback.

### 5.2 Apply for

Unter der Stations-Liste in der rechten oberen Spalte, abgesetzt mit einer Trennlinie. Kompaktes Chip-Layout statt langer Liste:

- **Chips (Icon + kurzer Text):** Residency → `https://tally.so/r/gDRaB1`, Pool-Profile → **Account-Tab „Pool“** (separates Projekt, siehe Abschnitt 14); bis dahin `/konto`.
- **Guest-Slots:** Label mit Mikrofon-Icon + drei kompakte Stadt-Chips `DUS`, `LPZ`, `VIE` → `https://tally.so/r/31ap5O`, `https://tally.so/r/wAk9Dy`, `https://tally.so/r/nPor45`. Die vollen Städtenamen stehen in den Stations darüber; `aria-label`/`title` nennen sie zusätzlich.
- Alle externen Chips mit `target="_blank"` und `rel="noopener noreferrer"`. Der externe Pfeil entfällt zugunsten der Icons.
- **`words@callshopradio.com`** wandert als sekundärer Mail-Link unter `info@` in die Marken-Spalte, damit der Apply-Block kurz bleibt.
- Höhe des Apply-Blocks: ~107 px (vorher ~200 px); die Breite wird genutzt.

### 5.3 Theme-Toggle

- Untere Footer-Zeile: links Label „Light / Dark“ + `SiteDarkMode`, rechts „Back to top“.
- `SiteDarkMode` ist ein echter `<button type="button" role="switch">` mit `aria-checked` und Tastaturbedienung.
- Optik: Pill-Switch 44 × 24 px, Thumb 18 px, der per `transform` in 260 ms gleitet; Track-Farbe animiert mit. Pink im Hover, Fokusring, `prefers-reduced-motion` beachtet.
- Auf Mobile stapeln Label und Back-to-top.

### 5.4 Icons

- Neue Komponente `SiteSocialIcon.vue` mit Inline-SVG-Pfaden für Instagram, SoundCloud, Bandcamp, Discord.
- Neue Komponente `SitePageIcon.vue` mit Line-Icons für Shows (Play), Pool (Kontaktkarte), Words (Textlinien), Index (2×2-Raster), Shop (Tasche), Account (Person), Chat (Sprechblase), Schedule (Kalender) und Legal & Privacy (Schild mit Check).
- Alle Explore- und Pages-Links im Footer tragen das passende Icon; die Follow-Links behalten ihre Brand-Icons.
- Monochrom über `currentColor`, damit hell/dunkel automatisch funktioniert.

## 6. Contact

- Contact-Link im Footer entfernen.
- `nuxt.config.ts` Route Rules:
  - `/contact` → 301 `/`
  - `/de/contact` → 301 `/de`
- Das Sanity-Dokument bleibt unangetastet. Ein späteres Unpublish/Delete erfolgt durch die Redaktion, nicht in diesem Task.

## 7. Index-Seite

### 7.1 Route

- Ziel-URL: `/index` und `/de/index`.
- Datei: `web/app/pages/label-index.vue` mit `definePageMeta({ path: "/index" })`. Das Verzeichnis `web/app/pages/index/` kollidiert mit der Startseite (`pages/index.vue`) und wird von Nuxt nicht als `/index` registriert.
- `/index` antwortet mit einem 301 auf `/index/`; `/index/` und `/de/index/` liefern 200. Die Links bleiben `/index`.

### 7.2 Daten

- Normalisiertes JSON: `web/app/data/label-index/labels.json`.
- Felder: `slug`, `name`, `founded`, `location`, `releases`, `members`, `discogs`, `youtube`, `soundcloud`, `logo`, `logoWidth`, `logoHeight`.
- Import zur Build-Zeit (`import labels from "~/data/label-index/labels.json"`), kein Runtime-Fetch.
- About-Text: `web/app/data/label-index/about.ts` als Array von Absätzen (aus `index.html` übernommen).

### 7.3 Aufbau

1. **Kopf:** Eyebrow „Archive“ in `--color-purple`, H1 „Index“, Intro-Satz, Label-Zähler („226 labels“).
2. **About:** Button „About the Index“ (Plus/Minus), darunter ein **Excerpt** (erster Absatz, 3 Zeilen geclamped). Aufgeklappt ersetzt der volle Text den Excerpt; Desktop zweispaltig, Mobile einspaltig.
3. **Filterleiste:** sticky unter dem Site-Header (`top: var(--nav-bar-height)`):
   - Suchfeld (Name + Ort, case-insensitive), sr-only Label, Fokus in `--color-purple`.
   - Sortierung: A–Z, YEAR, SHUFFLE als Chips mit aktivem Zustand (`aria-pressed`) in `--color-purple`.
   - Trefferzähler („12 / 226“) in `--color-purple`.
4. **Grid:** 4 Spalten ≥1100 px, 3 ≥760 px, 2 <760 px.
5. **Karte:** Quadrat, 1-px-Rahmen, 5-px-Radius. Innen eine weiße Logo-Fläche (immer weiß, damit schwarze/transparente Logos in beiden Themes lesbar bleiben), darunter Name + Gründungsjahr in Theme-Farben. Hover: `--color-purple`-Rahmen, leichte Anhebung. Fokus in `--color-purple`.
6. **Detail-Dialog:** nativer `<dialog>` als Full-Screen-Flex-Container (`width/height: 100vw/100svh`, Panel via `align-items/justify-content: center`), damit das Panel in jedem Viewport exakt zentriert ist:
   - Links Logo auf weißer Fläche, rechts Name, Founded, Location, Releases, Founding Members.
   - Links als Chips mit Brand-Icon (Discogs / SoundCloud / YouTube), Text und externem Pfeil, nur wenn vorhanden.
   - Schließen per Button, Esc und Backdrop; Fokus im Dialog; Body-Scroll gesperrt.
7. **Empty State:** „No labels match.“
8. **Dark Mode:** Seitenhintergrund/Text aus den Theme-Tokens; Logo-Flächen bleiben weiß; `--color-purple` bleibt der Akzent.

**Deep Link:** `/index?label=<slug>` öffnet den Detail-Dialog des Labels nach dem Mount; Schließen entfernt den Query-Parameter wieder (`router.replace`).

### 7.4 Sortierung / Suche

- A–Z: `name.localeCompare(..., "en", { sensitivity: "base" })`.
- YEAR: `Number.parseInt(founded)` aufsteigend; ungültige Jahre ans Ende.
- SHUFFLE: Fisher–Yates, neuer Shuffle pro Klick, nur clientseitig (kein SSR-Mismatch).
- Suche: `name` und `location` enthalten den Suchbegriff (lowercase).
- Alle Zustände clientseitig; die 226 Einträge bleiben im Speicher.

### 7.5 SEO

- `useSeoMeta`: Title „Index — Callshop Radio“, Description aus dem Intro.
- Keine Indexierung des Dialogs nötig; die Seite selbst ist indexierbar.

## 8. Landing-Feature

- Neue Komponente `SiteIndexTeaser.vue`, gerendert in `web/app/pages/index.vue` **nach** `<ModuleRenderer>` und **vor** dem Footer.
- Layout: Band mit oberer Trennlinie, zwei Spalten:
  - Links: Eyebrow „Index“, H2 „Independent label archive“, ein Satz, CTA „Browse the Index →“.
  - Rechts: 8 Logo-Kacheln aus einem zufälligen Sample (eindeutig, neuer Sample pro Seitenaufruf; initial deterministisch für die Hydration). Jede Kachel ist ein Link auf `/index?label=<slug>` und öffnet dort die Label-Karte.
- Zähler aus den Daten („226 labels“).
- Mobile: gestapelt, Logo-Raster bleibt 4×2.
- i18n-Copy in EN/DE.
- Die Section ist dekorativ; nur der CTA ist ein Link auf `/index`.
- Oben und unten eine Trennlinie; darunter großzügiger Abstand zum Footer (`padding-bottom` + `margin-bottom`, Desktop 64/128 px, Mobile 40/64 px).

## 9. Bake-Pipeline

Neues Script: `web/scripts/bake-label-index.mjs`.

Aufruf:

```bash
node web/scripts/bake-label-index.mjs "P:/Recent Projects/CallshopRadio/Label_Index/Label_Index_0.0.3"
```

Ablauf:

1. `labels.json` lesen und normalisieren:
   - Deutsche Keys → englische Keys.
   - Slug aus dem Namen (Umlaute → ae/oe/ue, Sonderzeichen → `-`), Duplikate mit Suffix.
   - Leere Felder als leere Strings.
2. Logos mit ImageMagick konvertieren:
   - `magick <src> -auto-orient -background none -resize "512x512>" -strip -quality 85 <out>.webp`
   - Ausgabe nach `web/public/index/logos/<slug>.webp`.
   - Ausgabemaße in `logoWidth`/`logoHeight` speichern.
3. `web/app/data/label-index/labels.json` schreiben (sortiert nach Name).
4. Zusammenfassung ausgeben: Anzahl, Gesamtgröße, fehlende Bilder.

Eigenschaften:

- Kein Netzwerkzugriff, keine Sanity-Calls.
- Idempotent; vorhandene Logos werden überschrieben.
- ImageMagick ist Voraussetzung (lokal vorhanden, Version 7.1.2).
- Zielgröße: ≤ 2,5 MB für alle Logos (erreicht: 2,25 MB).

Update-Workflow für die Zukunft: Quellordner aktualisieren → Script laufen lassen → Diff prüfen → deployen. Kein CMS, kein VPS.

## 10. Dateien

**Neu**
- `web/app/pages/label-index.vue` (Route `/index` via `definePageMeta`)
- `web/app/data/label-index/labels.json` (generiert)
- `web/app/data/label-index/about.ts`
- `web/layers/base/components/site/SiteSectionLinks.vue`
- `web/layers/base/components/site/SiteSocialIcon.vue`
- `web/layers/base/components/site/SiteApplyIcon.vue`
- `web/layers/base/components/site/SitePageIcon.vue`
- `web/layers/base/components/index/IndexCard.vue`
- `web/layers/base/components/index/IndexDialog.vue`
- `web/layers/base/components/index/IndexLinkIcon.vue`
- `web/layers/base/components/index/IndexFilterBar.vue`
- `web/layers/base/components/index/IndexAbout.vue`
- `web/layers/base/components/site/SiteIndexTeaser.vue`
- `web/public/index/logos/*.webp` (generiert)
- `web/scripts/bake-label-index.mjs`
- `docs/superpowers/specs/2026-11-16-navigation-footer-index-design.md`

**Geändert**
- `web/layers/base/components/site/SiteHead.vue`
- `web/layers/base/components/site/SiteFoot.vue`
- `web/layers/base/components/site/SiteDarkMode.vue`
- `web/app/pages/index.vue`
- `web/nuxt.config.ts` (Contact-Redirects)
- ggf. `web/app/stores/mainStore.ts` (`menuOpen` entfernen)

**Gelöscht**
- `web/layers/base/components/site/SiteMenu.vue`
- `web/layers/base/components/site/SiteMenuButton.vue`

## 11. Accessibility

- Mobile Icons: `aria-label`, Fokusring.
- Theme-Toggle: echtes Button-Element, `role="switch"`, `aria-checked`, Enter/Space.
- Sortier-Chips: `aria-pressed`.
- Suche: sichtbares Placeholder + sr-only Label.
- Dialog: `aria-labelledby`, Fokusfalle durch `<dialog>`, Esc/Backdrop, Fokus zurück auf die auslösende Karte.
- Grid: `<ul>/<li>` oder Role-Liste; Karten als Buttons.

## 12. QA

- **Desktop 1440:** Header ohne Burger, Footer-Spalten, Theme-Toggle, Apply-for, Follow-Icons.
- **Tablet 900/768:** Umbruch der Footer-Spalten, Section-Icons nur mobil.
- **Mobile 390:** Logo + drei Section-Icons + Utilities passen; Footer stapelt; Index 2 Spalten; Dialog full-width.
- **Dark Mode:** Header, Footer, Index, Landing-Section.
- **Funktion:** Suche, A–Z/YEAR/SHUFFLE, Dialog öffnen/schließen, `/contact`-Redirect, alle Footer-Links.
- **Daten:** 226 Labels, alle Logos laden, keine 404; Gesamtgröße ≤ 2 MB.
- **Technik:** Biome, Typecheck, keine neuen Konsolenfehler; `pnpm --filter web run build` falls zeitlich vertretbar.

## 13. Offene Punkte

1. „a Pool-Profile“ verlinkt zunächst auf `/konto`; der endgültige Account-Tab „Pool“ gehört zum separaten Submission-Projekt (Abschnitt 14).
2. Später: `index.callshopradio.com` per 301 auf `callshopradio.com/index` umleiten (VPS/Caddy, nicht Teil dieses Tasks).
3. Später: Contact-Sanity-Dokument durch die Redaktion unpublizieren/löschen.

## 14. Abgrenzung: Account-Submissions (separates Projekt)

Diese Spec enthält **keine** Umsetzung des Nutzer-Submission-Workflows. Der ist ein eigenes, repoübergreifendes Projekt:

**Website (`callshopradio.com`)**
- Account-Tabs „Pool“ und „Words“.
- Pool-Profil anlegen/bearbeiten, Entwurf speichern, zum Review einreichen.
- Liste der eigenen, noch nicht veröffentlichten Profile.
- Words-Artikel verfassen und einreichen.
- Nach Freigabe: Bearbeitung durch den Owner; weitere Nutzer als Bearbeiter hinzufügen.

**Manager (`Callshop_RadioServer`)**
- Review-Queue in den bestehenden Pool-/Words-Tabs des Backends.
- Freigabe/Ablehnung durch Admin (Pool) bzw. Editor/Admin (Words).
- Verknüpfung Freigabe ↔ Account, Rechtevergabe/-entzug durch Admin oder Host.
- Neue API-Routen unter `/api/site/v1/me/pool/...` und `/me/words/...` plus Erweiterung der BFF-Allowlist im Website-Proxy.
- Datenmodell für Owner, Co-Editor:innen und Status.

**Offene Architekturfrage für dieses Projekt:** Wo liegen freigegebene Pool-Profile öffentlich? Der Website-Pool liest Sanity, der Manager importiert Pool-Daten nur aus Sanity und schreibt laut `import-pool.js` nichts zurück. **Entschieden:** Der Manager pusht freigegebene Pool-Profile nach Sanity; die Website bleibt bei Sanity als öffentlicher Quelle. Der Push wird im Submission-Spec geplant (Status, Bilder, Slugs, Idempotenz, Rückweg).
