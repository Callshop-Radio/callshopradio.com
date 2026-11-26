<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
	formSeedFor,
	randomFormSeed,
} from "../../layers/base/utils/generative-form";

// biome-ignore lint/suspicious/noExplicitAny: design lab prototypes read loose Sanity docs
type LabItem = Record<string, any>;
type BackgroundVariant = "horizon" | "strata" | "form";
type LabPage = "shows" | "pool" | "words";

definePageMeta({
	bodyClass: "design-lab",
});

const mainStore = useMainStore();

const { data: setsData, refresh: refreshSets } = await useAsyncData<LabItem[]>(
	"hero-lab-sets",
	() => $fetch<LabItem[]>("/api/cover-flow/sets"),
);

const { data: poolData, refresh: refreshPool } = await useAsyncData<LabItem[]>(
	"hero-lab-pool",
	() => $fetch<LabItem[]>("/api/cover-flow/pool"),
);

const { data: articlesData, refresh: refreshArticles } = await useAsyncData<
	LabItem[]
>("hero-lab-articles", () => $fetch<LabItem[]>("/api/cover-flow/articles"));

const page = ref<LabPage>("shows");
const background = ref<BackgroundVariant>("form");
const activeIndex = ref(0);
const version = ref(0);
const mounted = ref(false);
const formSeed = ref<number | null>(null);

const backgrounds: Array<{
	id: BackgroundVariant;
	label: string;
	index: string;
}> = [
	{ id: "horizon", label: "Horizon", index: "01" },
	{ id: "strata", label: "Strata", index: "02" },
	{ id: "form", label: "Form", index: "03" },
];

const pages: Array<{ id: LabPage; label: string; accent: string }> = [
	{ id: "shows", label: "Shows", accent: "var(--color-pink)" },
	{ id: "pool", label: "Pool", accent: "var(--color-blue)" },
	{ id: "words", label: "Words", accent: "var(--color-green)" },
];

const accent = computed(
	() =>
		pages.find((entry) => entry.id === page.value)?.accent ??
		"var(--color-pink)",
);

const items = computed<LabItem[]>(() => {
	if (page.value === "shows") return (setsData.value ?? []).slice(0, 8);
	if (page.value === "pool") return (poolData.value ?? []).slice(0, 8);
	return (articlesData.value ?? []).slice(0, 8);
});

const dataNote = computed(
	() =>
		`live data · ${items.value.length} items${
			formSeed.value
				? ` · form ${formSeedFor(formSeed.value, activeIndex.value)}`
				: ""
		}`,
);

const pageLabel = computed(
	() => pages.find((entry) => entry.id === page.value)?.label ?? "",
);

const fallbackBackground = {
	id: "strata" as BackgroundVariant,
	label: "Strata",
	index: "02",
};

const bgEntry = computed(
	() =>
		backgrounds.find((entry) => entry.id === background.value) ??
		fallbackBackground,
);

const note: Record<LabPage, string> = {
	shows: "Orbit — Bild zuerst, Papier-Etikett darunter.",
	pool: "Light Table — Randnotiz links, Auslauf hinter der Caption.",
	words: "Focus Pull — 21:9-Fenster, Caption darunter.",
};

const bgNotes: Record<BackgroundVariant, string> = {
	horizon:
		"Horizon — Feld, beschnittene Scheibe, eine Horizontlinie. Ruhig und offen; die Form bleibt flach. Kritik: darf nicht als Sonnenuntergang kippen.",
	strata:
		"Strata — drei gestaffelte Ebenen mit 5px-Kanten. Tiefe durch Schichtung statt Blur. Kritik: muss größer und leiser als die Karten bleiben.",
	form: "Form — generierte Kontur hinter dem Slider. Rechteck-Union mit gerundeten Ecken, Kontur in der Seitenfarbe. Kritik: ruhig halten, die Form darf die Bilder nicht überstimmen.",
};
const pageNote = computed(() => note[page.value]);
const bgNote = computed(() => bgNotes[background.value]);

const px = ref(0);
const py = ref(0);
let pointerFrame = 0;
let reduceMotion = false;

function onPointerMove(event: PointerEvent) {
	if (reduceMotion || event.pointerType === "touch" || pointerFrame) return;
	pointerFrame = requestAnimationFrame(() => {
		pointerFrame = 0;
		px.value = Math.round((event.clientX / window.innerWidth - 0.5) * 28);
		py.value = Math.round((event.clientY / window.innerHeight - 0.5) * 20);
	});
}

async function shuffle() {
	await Promise.all([refreshSets(), refreshPool(), refreshArticles()]);
	version.value += 1;
}

onMounted(() => {
	mounted.value = true;
	formSeed.value = randomFormSeed();
	reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	window.addEventListener("pointermove", onPointerMove, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener("pointermove", onPointerMove);
	if (pointerFrame) cancelAnimationFrame(pointerFrame);
});
</script>

<template>
	<div class="design-lab">
		<LabAtmosphere
			:variant="background"
			:page="page"
			:accent="accent"
			:shift="activeIndex"
			:px="px"
			:py="py"
			:form-seed="formSeed"
			:dark="mounted && Boolean(mainStore?.isDarkMode)"
		/>

		<div class="design-lab__content">
			<h1 class="lab-sr-only">Aperture Hero Lab — drei Backgrounds</h1>

			<div class="lab-bar">
				<div class="lab-bar__title">
					<span class="lab-bar__dot" :style="{ backgroundColor: accent }" />
					<span>Hero Lab</span>
				</div>

				<div class="lab-bar__group" role="group" aria-label="Seite">
					<button
						v-for="entry in pages"
						:key="entry.id"
						type="button"
						class="lab-bar__button"
						:class="{ 'is-active': page === entry.id }"
						:aria-pressed="page === entry.id"
						:style="{ '--page-accent': entry.accent }"
						@click="page = entry.id"
					>
						<span class="lab-bar__page-dot" />
						{{ entry.label }}
					</button>
				</div>

				<div class="lab-bar__group" role="group" aria-label="Background">
					<button
						v-for="entry in backgrounds"
						:key="entry.id"
						type="button"
						class="lab-bar__button"
						:class="{ 'is-active': background === entry.id }"
						:aria-pressed="background === entry.id"
						@click="background = entry.id"
					>
						<span class="lab-bar__bg-index">{{ entry.index }}</span>
						{{ entry.label }}
					</button>
				</div>

				<button
					type="button"
					class="lab-bar__shuffle"
					aria-label="Neue Inhalte laden"
					@click="shuffle"
				>
					↻
				</button>

				<a class="lab-bar__jump" href="#pool-profile-lab">Pool A / C ↓</a>
			</div>

			<div class="lab-note">
				<span class="lab-note__label" :style="{ color: accent }">
					Aperture / {{ pageLabel }} · BG {{ bgEntry.index }}
					{{ bgEntry.label }}
				</span>
				<span class="lab-note__text">{{ pageNote }}</span>
				<span class="lab-note__data">{{ dataNote }}</span>
			</div>
			<p class="lab-bg-note">{{ bgNote }}</p>

			<main class="lab-canvas">
				<LabSlider
					v-if="items.length"
					:key="`${page}-${version}`"
					:items="items"
					direction="aperture"
					:page="page"
					:accent="accent"
					@update:index="activeIndex = $event"
				/>
				<div v-else class="lab-empty">
					Keine Inhalte geladen. Läuft die lokale Nuxt-Instanz mit
					Sanity-Zugriff?
				</div>
			</main>

			<section id="pool-profile-lab" class="pool-lab">
				<header class="pool-lab__head">
					<p class="pool-lab__kicker">Pool profile · layout variants</p>
					<h2 class="pool-lab__title">Karteikarte vs. Steckbrief</h2>
					<p class="pool-lab__intro">
						Beide Varianten arbeiten mit dem Hochkantfoto und dem
						theme-weiten 5-px-Radius. Shows und Contact sind
						Beispieldaten; Portrait, Name, Tags und Bio kommen live aus
						Pool.
					</p>
				</header>

				<div class="pool-lab__variant">
					<div class="pool-lab__variant-head">
						<span class="pool-lab__letter">A</span>
						<div>
							<h3>Karteikarte</h3>
							<p>
								Reiter, Feldzeilen und eingelegtes Foto links.
								Archivkarte statt Magazin-Spread.
							</p>
						</div>
					</div>
					<PoolProfileLab
						variant="card"
						index="P-01"
						:profile="poolData?.[0] ?? null"
					/>
				</div>

				<div class="pool-lab__variant">
					<div class="pool-lab__variant-head">
						<span class="pool-lab__letter">C</span>
						<div>
							<h3>Steckbrief</h3>
							<p>
								Blaues Kopfband, Foto als Print, Feldraster und
								Bio als Fußteil. Klarer Formular-Charakter.
							</p>
						</div>
					</div>
					<PoolProfileLab
						variant="sheet"
						index="P-02"
						:profile="poolData?.[1] ?? poolData?.[0] ?? null"
					/>
				</div>
			</section>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
:global(body.design-lab .footer),
:global(body.design-lab .chat-popup),
:global(body.design-lab .chat-button) {
  display: none !important;
}

.design-lab {
  --lab-inset: max(
    var(--page-gutter),
    calc((100vw - var(--page-max-width)) / 2)
  );

  position: relative;
  isolation: isolate;
  width: 100%;
  overflow-x: clip;
  padding-top: 8px;
  padding-bottom: var(--big-margin);

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: var(--page-max-width);
    margin: 0 auto;
  }
}

.lab-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--small-padding) var(--mid-padding);
  width: fit-content;
  max-width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: 5px;
  background-color: var(--color-bg);

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding-left: 0.45rem;
    font-family: var(--font-text-semibold);
    font-size: var(--text-s);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  &__dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent);
  }

  &__group {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    padding-left: var(--mid-padding);
    border-left: 1px solid
      color-mix(in srgb, var(--color-text) 12%, transparent);

    @media screen and (max-width: 900px) {
      padding-left: 0;
      border-left: none;
    }
  }

  &__button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.32rem 0.55rem;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--color-dark-grey);
    font-family: var(--font-text-medium);
    font-size: var(--text-s);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);

    &:hover {
      color: var(--color-text);
    }

    &:focus-visible {
      outline: 2px solid var(--page-accent, var(--color-text));
      outline-offset: 2px;
    }

    &.is-active {
      background-color: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__page-dot {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 999px;
    background-color: var(--page-accent);
    opacity: 0.55;
  }

  &__button.is-active &__page-dot {
    opacity: 1;
  }

  &__bg-index {
    font-variant-numeric: tabular-nums;
    font-size: var(--text-s);
    color: var(--color-dark-grey);
  }

  &__button.is-active &__bg-index {
    color: var(--color-bg);
  }

  &__shuffle {
    display: grid;
    place-items: center;
    width: 1.9rem;
    height: 1.9rem;
    margin-left: auto;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
    border-radius: 5px;
    background: transparent;
    color: var(--color-text);
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      border-color: currentColor;
      color: var(--lab-accent);
    }

    &:focus-visible {
      outline: 2px solid var(--color-text);
      outline-offset: 2px;
    }
  }

  &__jump {
    display: inline-flex;
    align-items: center;
    padding: 0.32rem 0.55rem;
    border: 1px solid color-mix(in srgb, var(--color-blue) 45%, transparent);
    border-radius: 5px;
    color: var(--color-blue);
    font-family: var(--font-text-semibold);
    font-size: var(--text-s);
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
    white-space: nowrap;

    &:hover {
      border-color: var(--color-blue);
      background: var(--color-blue);
      color: var(--color-white);
    }
  }
}

.lab-note {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem var(--mid-padding);
  margin-top: var(--small-margin);
  font-size: var(--text-s);
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);

  &__label {
    font-family: var(--font-text-semibold);
  }

  &__text {
    color: var(--color-dark-grey);
  }

  &__data {
    margin-left: auto;
    color: var(--color-dark-grey);
    font-variant-numeric: tabular-nums;
  }
}

.lab-bg-note {
  max-width: 86ch;
  margin: 0.2rem 0 0;
  font-size: var(--text-s);
  line-height: 1.4;
  color: var(--color-dark-grey);
}

.lab-canvas {
  margin-top: clamp(0.5rem, 1.5vh, 1rem);
  width: 100vw;
  max-width: 100vw;
  margin-right: calc(50% - 50vw);
  margin-left: calc(50% - 50vw);
}

/* Pool profile layout lab ------------------------------------------------ */

.pool-lab {
  display: flex;
  flex-direction: column;
  gap: var(--big-margin);
  margin-top: var(--huge-margin);
  padding-bottom: var(--big-margin);
  scroll-margin-top: calc(var(--nav-height) + var(--mid-padding));
}

.pool-lab__head {
  max-width: 72ch;
}

.pool-lab__kicker {
  margin: 0 0 0.5rem;
  color: var(--color-blue);
  font-family: var(--font-text-semibold);
  font-size: var(--text-s);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.pool-lab__title {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: var(--text-l);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.015em;
  text-transform: uppercase;
}

.pool-lab__intro {
  max-width: 70ch;
  margin: var(--mid-padding) 0 0;
  color: var(--color-dark-grey);
  font-size: var(--text-m);
  line-height: 1.5;
}

.pool-lab__variant {
  display: flex;
  flex-direction: column;
  gap: var(--mid-padding);
}

.pool-lab__variant-head {
  display: flex;
  align-items: flex-start;
  gap: var(--mid-padding);
}

.pool-lab__letter {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 5px;
  background: var(--color-blue);
  color: var(--color-white);
  font-family: var(--font-text-semibold);
  font-size: var(--text-m);
  flex: none;
}

.pool-lab__variant-head h3 {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: var(--text-l);
  font-weight: 500;
  line-height: 1;
  text-transform: uppercase;
}

.pool-lab__variant-head p {
  max-width: 68ch;
  margin: 0.35rem 0 0;
  color: var(--color-dark-grey);
  font-size: var(--text-s);
  line-height: 1.45;
}

@media screen and (max-width: 900px) {
  .pool-lab {
    margin-top: var(--content-gap);
  }
}

.lab-empty {
  padding: var(--big-margin) 0;
  font-size: var(--text-m);
  color: var(--color-dark-grey);
}

.lab-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media screen and (max-width: 900px) {
  .design-lab {
    padding-top: 8px;
  }

  .lab-bar {
    width: 100%;
    border-radius: 5px;
    gap: 0.35rem;
  }

  .lab-bar__shuffle {
    margin-left: 0;
  }

  .lab-note__data {
    display: none;
  }

  .lab-bg-note {
    font-size: 0.62rem;
    line-height: 1.35;
  }
}
</style>
