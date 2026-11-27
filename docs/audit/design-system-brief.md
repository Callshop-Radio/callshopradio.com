# Audit-Handoff — Design-System callshopradio.live

**Für:** frischer Agent (neue Session)
**Datum:** 26.11.2026
**Ziel:** Visuelles Audit der **öffentlichen Website** `callshopradio.live`, Design-Regeln festschreiben (DESIGN.md), Abweichungen korrigieren.

---

## 1. Falscher Start — was bereits passiert ist

Ein vorheriger Agent hat **die falsche App** auditiert: das **Air Panel** (Show Manager) in
`C:\GitHub\Callshop_RadioServer\apps\manager` statt der öffentlichen Seite.

Dort liegt ein lokaler Commit:

```
c455671  style(manager): enforce one design system across every page
```

Er enthält eine Typo-/Radius-/Farb-Tokenisierung des Air Panels plus `DESIGN.md` im
**falschen** Repo (`C:\GitHub\Callshop_RadioServer\DESIGN.md`) und einen Zeiger in dessen
`AGENTS.md`. Tests sind grün (2043 pass / 37 skip), nichts gepusht, nichts deployt.

**Entscheidung nötig (User fragen):** behalten oder `git -C C:\GitHub\Callshop_RadioServer reset --hard c455671^`
zurücknehmen. Nicht ungefragt löschen. Für die öffentliche Seite ist das **irrelevant** —
dort nichts davon verwenden.

---

## 2. Zielsystem

| | |
|---|---|
| Repo | `C:\GitHub\callshopradio.com` (Monorepo, pnpm workspace) |
| Frontend | `web/` — **Nuxt 4**, Vue 3, `@unocss/nuxt`, PostCSS mit `postcss-nested` |
| CMS | Sanity (`studio/`), Inhalte/Texte liegen **in Sanity**, nicht im Code |
| Live | `https://callshopradio.live`, gebaut von Netlify aus **`origin/develop`** (nicht `main`) |
| Deploy | Branch → PR gegen `develop` → Merge. Direkte Pushes sind gesperrt. |

### Wichtige Dateien

```
web/layers/base/assets/styles/
  main.postcss                 Import-Reihenfolge + globale Overrides (.show-artists)
  abstracts/variables.postcss  Farben, Abstände, Pills, Breakpoint-Variablen
  abstracts/fonts.postcss      @font-face Icona
  base/typography.postcss      Schriftgrößen-Tokens + Rich-Text
  base/layout.postcss          Seitenraster
  global/customMedia.pcss      @custom-media Definitionen
  modules/main.postcss         Modul-/Karten-Styles
web/layers/base/components/    SiteHeader, SiteFoot, SitePlayer, Module*, Search, Account …
web/app/pages/                 Routen (siehe 4.2)
web/app/pages/design-lab.vue   Prototypen-Seite, KEIN Design-System-Referenz
```

---

## 3. Arbeitsumgebung

Für diesen Audit wurde bereits ein **isolierter Worktree** angelegt (der Haupt-Checkout ist
mit Arbeit einer anderen Session belegt):

```
C:\GitHub\callshopradio-worktrees\design-audit
  detached HEAD @ 9d24230 (= origin/develop)
```

**Loslegen:**

```powershell
cd C:\GitHub\callshopradio-worktrees\design-audit
pnpm install                                  # node_modules fehlen im Worktree
Copy-Item ..\..\callshopradio.com\web\.env web\.env   # Sanity-Zugang, NICHT committen
pnpm web:dev                                  # http://localhost:3333
```

Alternativ live prüfen: `https://callshopradio.live` (entspricht `develop`).

**Achtung:** Auf `localhost:3333` läuft bereits ein Nuxt-Dev-Server, gestartet aus dem
**Haupt-Checkout** (`C:\GitHub\callshopradio.com`, PID 30816) — also vom Branch
`feat/footer-contact` mit fremden, uncommitteten Änderungen. Für einen sauberen
`develop`-Stand entweder diesen Server nutzen und die Abweichungen im Kopf behalten,
oder im Worktree mit eigenem Port starten:
`pnpm web:dev --port 3334`.

**Vor dem ersten Edit:** `git -C C:\GitHub\callshopradio-worktrees\design-audit status`
darf nur `?? AUDIT-HANDOFF.md` zeigen. Wenn mehr da ist, ist der Worktree kontaminiert →
neu anlegen.

---

## 4. Harte Regeln (aus `callshopradio.com/AGENTS.md`)

1. **Live ist `origin/develop`.** `main` ist NICHT live.
2. Deploy nur über PR gegen `develop`; nie direkt pushen.
3. **Nur die eigenen Dateien stagen.** Andere Sessions halten uncommittete Arbeit im
   Haupt-Checkout — niemals mitcommitten.
4. Formatierung: `pnpm exec biome check --write <files>`; der Pre-Commit-Hook formatiert
   das ganze Repo.
5. Website-Texte kommen aus Sanity — Code-Änderungen betreffen nur Markup, Styles, Queries.

### Zustand des Haupt-Checkouts (NICHT anfassen)

```
branch: feat/footer-contact
 M web/layers/base/components/modules/ModuleContentGrid.vue
 M web/layers/base/components/site/SiteFoot.vue
 M web/layers/base/composables/useTagNavigation.ts
```

---

## 5. Was bereits verifiziert ist (Startpunkte)

Alle Angaben aus `web/layers`, Stand `9d24230`. Zeilennummern = aktueller Worktree.

### 5.1 Kaputte oder tote Tokens

| Fund | Ort | Wirkung |
|---|---|---|
| `--h3-size` **zweimal** definiert (`1.125rem`, dann `1rem`) | `base/typography.postcss:21-22` | h3 ist effektiv 16px, nicht 18px |
| `--h4-line-height: calc(var(--h4-size) * 1.25)` — `--h4-size` fehlt in `:root` | `base/typography.postcss:28` | ungültiges calc auf Basis-Ebene (Token wird nur 1× benutzt → harmlos, aber falsch) |
| `letter-spacing: 1.5%` (**Prozent ist für letter-spacing ungültig**) | `base/typography.postcss:102, 111` | Regel greift nie |
| `@media (desktop-up: 1024px)` — **ungültige Media-Query-Syntax** | `abstracts/variables.postcss:151` | der ganze Desktop-Block (Paddings/Margins) greift nie |
| `--small-font-size` Basis `0.6875rem` (11px), in allen Breakpoints `0.6275rem` (10.04px) | `base/typography.postcss:16, 53, 70, 87` | Basiswert ist toter Code |
| `--mini-font-size` 7px / 7,8px / 10,04px je Breakpoint | ebd. 17, 54, 71, 88 | Mikrotext unter 8px |
| `--huge-margin` nur in Media-Queries definiert | `abstracts/variables.postcss` | auf Basis-Ebene undefiniert |

### 5.2 Benutzte, aber nirgends definierte Tokens (36)

Relevant (mit Fallback im Aufruf, dadurch „funktioniert“ es zufällig):

| Token | Aufrufe | Wo | Bewertung |
|---|---|---|---|
| `--color-text-light` | 31 | `SiteSearch.vue`, `SiteSearchAdvanced.vue`, `ModuleSearchResults.vue` | immer Fallback `#888` → faktisch ein hardcodiertes Grau |
| `--index-accent` | 20 | `IndexAbout/IndexCard/IndexDialog` | prüfen, ob per JS/Inline gesetzt |
| `--lab-accent` | 64 | `HeroWorm`, `SiteMixedHero`, `LabAtmosphere` | dito (Lab-Sektion) |
| `--font-text-regular` | 3 | `ModuleIntroArticle`, `ModuleSearchResults` | falsche Font-Familie → Fallback `system-ui` |
| `--color-lines` | 1 | `base/typography.postcss` (`text-decoration-color`) | Link-Unterstrichfarbe greift nie |
| `--color-code-bg` | 1 | `base/typography.postcss` (code) | Code-Hintergrund transparent |
| `--menu-line-height` | 2 | `base/typography.postcss` (nav/header) | Zeilenhöhe der Navigation ungesteuert |
| `--heading-font-size` | 2 | `ModuleContentTeaser`, `ModuleRelatedContent` | |
| `--font-display`, `--font-headline` | 1 / 1 | `SiteMixedHero`, `SiteSearchAdvanced` | |

Restliche Treffer (`--lab-shift-x`, `--hero-shift-x`, `--glow-x`, `--grid-index`, …) werden
vermutlich zur Laufzeit per JS gesetzt — vor dem „Fixen“ prüfen.

### 5.3 Baseline-Zahlen (gemessen über alle `.vue`-`<style>`-Blöcke + `.postcss`)

| Metrik | Wert |
|---|---|
| `font-size`-Deklarationen | **515**, davon **96 verschiedene Werte** in 120 Dateien |
| `border-radius`-Deklarationen | **352**, davon **35 verschiedene Werte** |
| Hex-Farben | **110**, davon **25 verschiedene** |
| `font-weight`-Werte | **7** (300, 400, 500, 550, 600, 700, normal) — Icona hat nur Regular/Medium/Semibold |

**Radius-Chaos (die Kernfrage des Users):**

```
 90×  5px           ← Standard für Karten/Bilder?
 57×  50%
 50×  100px         ← Pille Variante A
 23×  999px         ← Pille Variante B
 22×  var(--pill-radius)       (0.75rem = 12px)  ← Pille Variante C
  4×  var(--pill-radius-sm)    (0.4rem = 6.4px)  ← Pille Variante D
 16×  12px
  9×  5px 5px 0 0
  8×  4px / 8× 1.5625rem
```

**Typo-Ausreißer (Beispiele aus den 96):** `0.4375rem` (7px), `0.4875rem` (7,8px),
`0.5625rem` (9px), `0.6275rem` (10,04px), `0.85rem` (13,6px), `0.9rem` (14,4px),
`0.8rem` (12,8px), `9px`, `10px`, `11px`, dazu
`calc(var(--base-font-size) * 0.78)` und `calc(var(--base-font-size) * 0.72)`.
`.show-artists` in `base/assets/styles/main.postcss` erzwingt `font-size: … * 0.78 !important`.

**Farb-Duplikate:** `#f794b3` (= `--color-pink`), `#2c2c2c` (= `--color-darker-grey`),
`#878787` (= `--color-dark-grey` im Dark-Theme), `#090909` (= `--color-bg`),
`#557fb9`, `#78ce82`, `#b178ce`, `#ff8f77` (= Token-Farben erneut hardcodiert).

**Weitere Auffälligkeiten:**

- `--pill-radius` (12px) wird für **Navigation und Buttons** benutzt, aber 50× `100px`
  und 23× `999px` umgehen es. Der Kommentar in `variables.postcss:94-98` erklärt die
  Zwei-Pillen-Idee — die Realität hat vier.
- `body`-Text ist `--base-font-size` = **13px** (Desktop), mobil 12px. Sehr klein für
  Fließtext; im Audit bewerten (Lesbarkeit vs. Editorial-Look).
- Kopfzeile/Nav: `--menu-text-size` 13px, `--menu-letter-spacing: 0.0625rem`.

---

## 6. Reproduzierbare Messungen

**Undefinierte Tokens** (PowerShell, vom Repo-Root):

```powershell
cd C:\GitHub\callshopradio-worktrees\design-audit\web
$files = Get-ChildItem layers,app -Recurse -Include *.postcss,*.pcss,*.vue -File |
  Where-Object { $_.FullName -notmatch 'node_modules' }
$defined = New-Object System.Collections.Generic.HashSet[string]; $used = @{}
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw
  foreach ($m in [regex]::Matches($c,'(?m)^\s*(--[a-z0-9-]+)\s*:')) { [void]$defined.Add($m.Groups[1].Value) }
  foreach ($m in [regex]::Matches($c,'var\((--[a-z0-9-]+)')) {
    $n=$m.Groups[1].Value; if(-not $used.ContainsKey($n)){$used[$n]=0}; $used[$n]++
  }
}
$used.Keys | Where-Object { -not $defined.Contains($_) } | Sort-Object
```

**Werte-Zensus** (font-size / radius / hex über alle Style-Blöcke):
Skript `C:\Users\konta\AppData\Local\Temp\opencode\site-census.mjs` (Pfad zeigt auf den
Worktree; Ergebnis siehe 5.3). Es liest `.vue`-`<style>`-Blöcke und `.postcss` und zählt
Werte. Für die Endfassung erweitern (pro Datei, mit Zeilennummern).

**Sichtprüfung:** Playwright ist lokal vorhanden (`C:\Users\konta\AppData\Local\Temp\opencode`,
`node_modules/playwright@1.65.1`, Chromium installiert). Muster: Seite laden, `waitForTimeout`,
Census per `page.evaluate` (font-size, border-radius, color, background der sichtbaren
Elemente), Screenshot 1440×900 und 390×844.

---

## 7. Audit-Plan

1. **Dev-Server starten**, alle Routen einmal sichten (Desktop + Mobil).
2. **Bestandsaufnahme:** Tokens, Skalen, Komponenten-Inventar (Buttons, Pills/Tags,
   Karten, Bilder, Nav, Player, Suche, Tabellen/Liste, Formulare).
3. **Regeln ableiten** — nicht erfinden, sondern aus dem Bestand die *gemeinte* Regel
   rekonstruieren (z. B. 5px ist offenbar der Karten-/Bildradius, 12px die Pille).
4. **Abweichungen fixen** (Token zuerst, dann Komponenten; keine Layout-Umbauten ohne Not).
5. **Visuell verifizieren** (Screenshots vorher/nachher, beide Themes, beide Breakpoints).
6. **`DESIGN.md` schreiben** (siehe 8) und committen.

### 7.1 Routen für die Sichtprüfung

```
/                       Startseite (Hero, Picks, Slider)
/shows                  Show-Index
/shows/[slug]           Show-Detail
/shows/[slug]/[set]     Set-Detail (Player, Tracklist)
/pool                   Artist-/Venue-Index (Artist-Tags!)
/pool/[slug]            Artist-Profil
/words                  Artikelliste
/words/[slug]           Artikel
/schedule               Sendeplan
/search                 Suche (+ Advanced)
/merch                  Merch
/label-index            Index
/legal                  Rechtstexte
/[slug]                 CMS-Seiten
/konto, /konto/anmelden, /konto/profil, /konto/uebersicht, /konto/listen, /konto/listen/[id]
/einladung/[token]      Einladung (Token nötig)
/demo/set               Player-Demo
/design-lab             Prototyp — nicht Teil des Design-Systems
```

### 7.2 Themen, die der User explizit genannt hat

- **Schriftgrößen** konsistent (Skala definieren, 96 Werte einfrieren)
- **Border-Radius von Buttons** (eine Regel)
- **Border-Radius von Bildern** (eine Regel, inkl. Karten-/Cover-Varianten)
- **Farben** (nur Tokens, Light+Dark)
- **Artist-Tags**: welche Größe/Höhe/Padding/Radius haben sie?
  → Pool-Karten (`PoolProfile*`, `ModuleContentGrid`), `.show-artists`, `--city-tag-height`
  in `variables.postcss:48` sind die relevanten Stellen. Es gibt bereits ein Token dafür —
  prüfen, ob es überall benutzt wird.

---

## 8. Erwartetes Ergebnis: `DESIGN.md`

Ablage: **`C:\GitHub\callshopradio.com\DESIGN.md`** (Repo-Root, nicht im Air Panel).

Inhalt (bewährtes Gerüst aus dem falschen Audit, hier anwenden):

1. Geltungsbereich + Ausnahmen (Studio/Sanity-Preview, design-lab, Promo-Canvas, E-Mail)
2. Grundprinzipien (Editorial-Look: Weiß/Schwarz, Icona, Pills, dünne Linien)
3. **Farben** als Tabelle (Token, Light-Wert, Dark-Wert, Bedeutung)
4. **Typografie**: Skala mit Token → px (Desktop/Mobil), Rollen, Gewichte, Zeilenhöhen,
   Letter-Spacing; Regeln gegen Zwischengrößen
5. **Radien**: Buttons, Pills/Tags, Karten, Bilder, Avatare — je ein Wert
6. **Abstände/Layout**: `--page-max-width`, `--page-gutter`, Paddings, Breakpoints
7. **Komponenten**: Button-Varianten, Nav-Pill, Tags (Artist/Genre/City), Karten,
   Bilder/Aspect-Ratios, Player, Suche, Liste/Tabelle, Formulare, Zustände
8. **Zustände**: Hover/Focus/Active/Disabled, Light+Dark
9. **Responsive**: was sich unter 900 / 640 px ändert
10. **Do & Don't** mit CSS-Snippets
11. **Audit-Ergebnis**: Zahlen vorher/nachher (siehe 5.3)
12. **Offene Punkte**
13. Checkliste für neue Komponenten

---

## 9. Offene Entscheidungen (User fragen, bevor gebaut wird)

1. **Air-Panel-Commit `c455671`**: behalten oder zurücknehmen?
2. **Fix-Tiefe**: nur Tokens/Vereinheitlichung — oder auch Layout-Ausreißer
   (z. B. Mikrotext < 8px, Body 13px) anfassen?
3. **Beide Themes** (Light + Dark) gleichwertig auditieren? (Standard: ja)
4. Soll `DESIGN.md` verbindlich sein (Verweis in `AGENTS.md` des Website-Repos)?

---

## 10. Fallstricke

- Der Haupt-Checkout ist **dirty** (andere Session) und läuft bereits auf Port 3333.
  Immer im Worktree arbeiten (Port 3334), sonst prüft man den falschen Branch.
- `pnpm web:dev` ohne `.env` → Sanity liefert nichts, Seiten sind leer. `.env` kopieren.
- Netlify baut **develop**; ein lokaler Commit ist nicht live.
- `biome` formatiert beim Commit das ganze Repo — nur eigene Dateien stagen.
- Viele Styles sind **scoped** in `.vue`-Dateien; ein reiner PostCSS-Blick reicht nicht.
- `postcss-nested` erlaubt verschachtelte Regeln — beim Zählen/Suchen beachten.
- Ein Teil der „undefinierten“ Tokens wird per JS/Inline-Style gesetzt; nicht blind ersetzen.
- Das `design-lab` ist eine Spielwiese; nicht als Referenz behandeln.
