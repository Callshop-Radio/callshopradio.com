<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import { formatDate } from "~~/layers/base/composables/formatDate";
import { randomFormSeed } from "../../utils/generative-form";

type MixedKind = "shows" | "pool" | "words";

// biome-ignore lint/suspicious/noExplicitAny: curated Sanity hero slides are loose docs
type SlideDoc = Record<string, any>;

type MixedItem = {
	_id: string;
	kind: MixedKind;
	doc: SlideDoc;
	label: string;
	accent: string;
	aspect: string;
	title: string;
	href: string | null;
	date: string | null;
	meta: string;
	action: string;
	playable: boolean;
};

const props = withDefaults(
	defineProps<{
		module: SlideDoc;
		eager?: boolean;
	}>(),
	{ eager: false },
);

const mainStore = useMainStore();
const localePath = useLocalePath();
const { playTrack } = useSoundcloudArtwork();

// One frame per content type: the shape and the accent are what tell the three
// kinds apart before the caption is read.
const TYPES = {
	set: {
		kind: "shows",
		label: "Set",
		accent: "var(--color-pink)",
		aspect: "1 / 1",
	},
	person: {
		kind: "pool",
		label: "Pool",
		accent: "var(--color-blue)",
		aspect: "3 / 4",
	},
	venue: {
		kind: "pool",
		label: "Venue",
		accent: "var(--color-blue)",
		aspect: "3 / 4",
	},
	article: {
		kind: "words",
		label: "Words",
		accent: "var(--color-green)",
		aspect: "3 / 2",
	},
} as const;

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function tagLabel(tag: SlideDoc | undefined): string {
	if (!tag) return "";
	return getI18nLabel(tag.title) || text(tag.name) || text(tag.short);
}

function tagList(doc: SlideDoc): string[] {
	return (Array.isArray(doc.tags) ? doc.tags : [])
		.map((tag: SlideDoc) => tagLabel(tag))
		.filter(Boolean);
}

function cityLabel(doc: SlideDoc): string {
	const city = (Array.isArray(doc.tags) ? doc.tags : []).find(
		(tag: SlideDoc) => tag?._type === "tag.city",
	);
	return tagLabel(city);
}

function buildItem(slide: SlideDoc, index: number): MixedItem | null {
	const doc = slide?.contentReference;
	const type = TYPES[doc?._type as keyof typeof TYPES];
	if (!doc || !type) return null;

	const title = text(doc.title) || text(doc.name) || text(slide?.title);
	if (!title) return null;

	const artists = (Array.isArray(doc.persons) ? doc.persons : [])
		.map((person: SlideDoc) => text(person?.title) || text(person?.name))
		.filter(Boolean);
	const showTitle = text(doc.parentShow?.title);

	let meta = "";
	let date: string | null = null;

	if (type.kind === "shows") {
		date = text(doc.datetime) || null;
		meta = [showTitle, artists.slice(0, 2).join(" / ")]
			.filter(Boolean)
			.join(" · ");
	} else if (type.kind === "pool") {
		meta = [
			cityLabel(doc),
			tagList(doc)
				.filter((label) => label !== cityLabel(doc))
				.slice(0, 2)
				.join(" / "),
		]
			.filter(Boolean)
			.join(" · ");
	} else {
		date = text(doc.publishedAt) || null;
		meta = tagList(doc).slice(0, 2).join(" / ");
	}

	return {
		_id: text(doc._id) || `slide-${index}`,
		kind: type.kind,
		doc,
		label: type.label,
		accent: type.accent,
		aspect: type.aspect,
		title,
		href: text(doc.path) || null,
		date,
		meta,
		action:
			type.kind === "shows"
				? "Open set"
				: type.kind === "pool"
					? "Open profile"
					: "Read story",
		playable:
			type.kind === "shows" &&
			Boolean(doc.soundcloud?.tracks?.length || doc.soundcloud?.url),
	};
}

const items = computed<MixedItem[]>(() =>
	(props.module?.slides || [])
		.map((slide: SlideDoc, index: number) => buildItem(slide, index))
		.filter((item: MixedItem | null): item is MixedItem => Boolean(item)),
);

const realCount = computed(() => items.value.length);

// Three copies keep the runway endless; the scroll position is recentred by
// exactly one set, so the jump is invisible.
const loopItems = computed<MixedItem[]>(() => {
	if (realCount.value < 2) return items.value;
	return [...items.value, ...items.value, ...items.value];
});

const viewport = ref<HTMLElement | null>(null);

const {
	activeIndex,
	distances,
	isDragging,
	goTo,
	next,
	prev,
	onScroll,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onClickCapture,
} = useLabScroll(
	viewport,
	computed(() => loopItems.value),
	{
		align: "center",
		initialIndex: realCount.value > 1 ? realCount.value : 0,
		loop: realCount.value > 1,
		loopSize: realCount.value,
	},
);

const realIndex = computed(() =>
	realCount.value
		? ((activeIndex.value % realCount.value) + realCount.value) %
			realCount.value
		: 0,
);

const activeItem = computed<MixedItem | null>(
	() => items.value[realIndex.value] ?? null,
);

const activeKind = computed<MixedKind>(() => activeItem.value?.kind ?? "shows");
const activeAccent = computed(
	() => activeItem.value?.accent ?? "var(--color-pink)",
);

// Hero titles must stay on one line. Long set titles step down in size instead
// of wrapping; the ellipsis is only the last resort on narrow screens.
const titleClass = computed(() => {
	const length = activeItem.value?.title.length ?? 0;
	if (length > 64) return "is-xlong";
	if (length > 46) return "is-long";
	return "";
});

const ready = ref(false);
const formSeed = ref<number | null>(null);

function itemZIndex(index: number) {
	if (index === activeIndex.value) return 20;
	const distance = distances.value[index] ?? index - activeIndex.value;
	return Math.max(1, 3 - Math.floor(Math.abs(distance)));
}

// Same depth falloff as the archive heroes: one readable neighbour, the rest
// dissolves before it can be clipped by the viewport.
function itemStyle(index: number) {
	const distance = distances.value[index] ?? index - activeIndex.value;
	const abs = Math.abs(distance);
	const fade = Math.max(0, 1 - abs * 0.18 - Math.max(0, abs - 1) * 0.8);
	return {
		transform: `translate3d(0, ${abs * 10}px, 0) scale(${1 - abs * 0.05})`,
		filter: `blur(${Math.min(abs * 9, 9)}px)`,
		opacity: String(Math.min(1, fade)),
	};
}

function openItem(item: MixedItem | null) {
	if (!item?.href) return;
	void navigateTo(localePath(item.href));
}

function playActive() {
	const item = activeItem.value;
	if (item?.kind !== "shows") return;
	playTrack(item.doc);
}

function onItemOpen(index: number) {
	if (index !== activeIndex.value) {
		goTo(index);
		return;
	}
	openItem(loopItems.value[index] ?? null);
}

function onKeydown(event: KeyboardEvent) {
	if (
		event.defaultPrevented ||
		event.metaKey ||
		event.ctrlKey ||
		event.altKey
	) {
		return;
	}
	const target = event.target;
	if (
		target instanceof HTMLElement &&
		target.closest("input, textarea, select, [contenteditable='true']")
	) {
		return;
	}
	if (event.key === "ArrowLeft") {
		event.preventDefault();
		prev();
	} else if (event.key === "ArrowRight") {
		event.preventDefault();
		next();
	}
}

onMounted(() => {
	formSeed.value = randomFormSeed();
	window.addEventListener("keydown", onKeydown);
	nextTick(() => {
		ready.value = true;
	});
});

onUnmounted(() => {
	window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
	<div
		v-if="activeItem"
		class="site-hero mixed-hero"
		:class="{ 'is-ready': ready, 'is-dragging': isDragging }"
		:style="{ '--lab-accent': activeAccent }"
	>
		<LabAtmosphere
			variant="form"
			contained
			:page="activeKind"
			:accent="activeAccent"
			:shift="realIndex"
			:form-seed="formSeed"
			:dark="Boolean(mainStore?.isDarkMode)"
		/>

		<div class="site-hero__inner">
			<div
				ref="viewport"
				class="mixed-hero__viewport"
				role="region"
				aria-roledescription="carousel"
				aria-label="Highlights"
				tabindex="0"
				@scroll.passive="onScroll"
				@pointerdown="onPointerDown"
				@pointermove="onPointerMove"
				@pointerup="onPointerUp"
				@pointercancel="onPointerUp"
				@click.capture="onClickCapture"
			>
				<div
					class="mixed-hero__track"
					:class="{ 'is-single': realCount < 2 }"
				>
					<article
						v-for="(item, index) in loopItems"
						:key="`${item._id}-${index}`"
						class="lab-item mixed-item"
						:class="`mixed-item--${item.kind}`"
						:data-active="index === activeIndex"
						:style="{ zIndex: itemZIndex(index) }"
					>
						<div class="mixed-item__body" :style="itemStyle(index)">
							<div class="mixed-item__media">
								<LabMedia
									:item="item.doc"
									:page="item.kind"
									:aspect="item.aspect"
									:active="index === activeIndex"
								/>
								<button
									type="button"
									class="mixed-item__hit"
									:aria-label="`${index === activeIndex ? item.action : 'Focus'}: ${item.title}`"
									:tabindex="index === activeIndex ? 0 : -1"
									@click.stop="onItemOpen(index)"
								/>
								<span class="mixed-item__badge">{{ item.label }}</span>
							</div>
						</div>
					</article>
				</div>
			</div>

			<div class="mixed-hero__caption" :key="realIndex">
				<div class="mixed-caption__kicker">
					<span class="mixed-caption__type">{{ activeItem.label }}</span>
					<template v-if="activeItem.date">
						<span class="mixed-caption__dot" aria-hidden="true">·</span>
						<span>{{ formatDate(activeItem.date) }}</span>
					</template>
				</div>

				<h2 class="mixed-caption__title" :class="titleClass">
					<NuxtLink v-if="activeItem.href" :to="localePath(activeItem.href)">
						{{ activeItem.title }}
					</NuxtLink>
					<span v-else>{{ activeItem.title }}</span>
				</h2>

				<p v-if="activeItem.meta" class="mixed-caption__meta">
					{{ activeItem.meta }}
				</p>

				<div class="mixed-caption__actions">
					<button
						v-if="activeItem.kind === 'shows' && activeItem.playable"
						type="button"
						class="mixed-caption__primary"
						@click="playActive"
					>
						<span class="mixed-caption__play" aria-hidden="true" />
						Play set
					</button>
					<NuxtLink
						v-if="activeItem.href"
						:to="localePath(activeItem.href)"
						class="mixed-caption__link"
					>
						{{ activeItem.kind === "shows" ? "Open set" : activeItem.action }}
						<span aria-hidden="true">→</span>
					</NuxtLink>
				</div>
			</div>

			<LabTransport
				:active-index="realIndex"
				:total="realCount"
				label="Highlight"
				@prev="prev"
				@next="next"
			/>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.site-hero {
  --lab-inset: max(
    var(--page-gutter),
    calc((100vw - var(--page-max-width)) / 2)
  );

  position: relative;
  isolation: isolate;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  padding-bottom: var(--big-margin);
  opacity: 0;
  transition: opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);

  &.is-ready {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.site-hero__inner {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
}

/* ---------------------------------------------------------------- formats */

.mixed-hero {
  --mixed-h: min(52svh, 34rem);
  --mixed-inset: calc(var(--lab-inset) + var(--base-margin));

  /* The thick form segment is calibrated for the archive layouts; here it
     lands on the caption band. Keep the glow and the thin contour only. */
  :deep(.form-worm) {
    display: none;
  }
}

.mixed-item {
  flex: 0 0 auto;
  min-width: 0;
  scroll-snap-align: center;
  cursor: pointer;

  &[data-active="true"] {
    cursor: default;
  }
}

/* Same height for every format; the width follows the type. */
.mixed-item--shows {
  --mixed-w: var(--mixed-h);
}

.mixed-item--pool {
  --mixed-w: calc(var(--mixed-h) * 0.75);
}

.mixed-item--words {
  --mixed-w: calc(var(--mixed-h) * 1.5);
}

.mixed-item__body {
  width: var(--mixed-w);
  transform-origin: center center;
  transition:
    transform 640ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 640ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 640ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mixed-item__media {
  position: relative;
  width: 100%;
  border-radius: 5px;
  overflow: hidden;
  background: var(--color-grey);
}

.mixed-item__hit {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.mixed-item__badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  z-index: 2;
  padding: 0.22rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 28%, transparent);
  border-radius: 5px;
  /* Solid enough to stay readable on bright cover artwork. */
  background: color-mix(in srgb, var(--color-bg) 82%, transparent);
  backdrop-filter: blur(6px);
  color: var(--color-text);
  font-family: var(--font-text);
  font-size: var(--mini-font-size);
  line-height: 1.1;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
  pointer-events: none;
}

.mixed-item[data-active="true"] .mixed-item__badge {
  border-color: var(--lab-accent);
  color: var(--lab-accent);
}

/* ---------------------------------------------------------------- viewport */

.mixed-hero__viewport {
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  padding-block: 0.75rem 1.25rem;

  @media screen and (min-width: 901px) {
    mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 3%,
      #000 94%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 3%,
      #000 94%,
      transparent 100%
    );
  }

  &::-webkit-scrollbar {
    display: none;
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid var(--lab-accent);
    outline-offset: 6px;
    border-radius: 5px;
  }
}

.mixed-hero__track {
  display: flex;
  align-items: center;
  gap: clamp(1.5rem, 3vw, 3.5rem);
  width: 100%;

  /* A single curated slide has no runway; centre it instead of snapping left. */
  &.is-single {
    justify-content: center;
  }
}

/* Keep the transport on the same page line as the caption band. */
.mixed-hero :deep(.lab-transport) {
  width: min(calc(100% - 2 * var(--mixed-inset)), var(--page-max-width));
  margin-inline: auto;
}

.is-loop-jump .mixed-item__body {
  transition: none !important;
}

/* ---------------------------------------------------------------- caption */

.mixed-hero__caption {
  position: relative;
  z-index: 12;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "kicker actions"
    "title actions"
    "meta actions";
  column-gap: var(--big-margin);
  row-gap: 0.3rem;
  width: min(calc(100% - 2 * var(--mixed-inset)), var(--page-max-width));
  margin: clamp(1.25rem, 2.5vw, 2rem) auto 0;
  padding-top: var(--mid-padding);
  border-top: 1px solid
    color-mix(in srgb, var(--lab-accent) 45%, transparent);
  animation: mixed-caption-in 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mixed-caption__kicker {
  grid-area: kicker;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: color-mix(in srgb, var(--color-text) 65%, transparent);
  font-family: var(--font-text);
  font-size: var(--mini-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.mixed-caption__type {
  color: var(--lab-accent);
  font-family: var(--font-text-semibold);
}

.mixed-caption__title {
  grid-area: title;
  margin: 0;
  max-width: none;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.6vw, 2.4rem);
  line-height: 1.02;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.is-long {
    font-size: clamp(1.25rem, 2.1vw, 1.95rem);
  }

  &.is-xlong {
    font-size: clamp(1.1rem, 1.7vw, 1.6rem);
  }

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--lab-accent);
    }
  }
}

.mixed-caption__meta {
  grid-area: meta;
  margin: 0;
  max-width: 52ch;
  color: color-mix(in srgb, var(--color-text) 68%, transparent);
  font-size: var(--small-font-size);
  line-height: 1.35;
}

.mixed-caption__actions {
  grid-area: actions;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.6rem;
  align-self: end;
}

.mixed-caption__primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--lab-accent);
  border-radius: 5px;
  background: transparent;
  color: var(--lab-accent);
  font-family: var(--font-text-semibold);
  font-size: var(--mini-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background: var(--lab-accent);
    color: var(--color-bg);
  }
}

.mixed-caption__play {
  width: 0;
  height: 0;
  border-top: 0.3rem solid transparent;
  border-bottom: 0.3rem solid transparent;
  border-left: 0.5rem solid currentColor;
}

.mixed-caption__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--mini-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-decoration: none;
  text-transform: uppercase;

  span {
    color: var(--lab-accent);
    transition: transform var(--transition-fast);
  }

  &:hover {
    color: var(--lab-accent);

    span {
      transform: translateX(3px);
    }
  }
}

@keyframes mixed-caption-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* ----------------------------------------------------------------- mobile */

/* Below the wide desktop the action column would squeeze the title into an
   ellipsis; stack it under the meta line instead. */
@media screen and (max-width: 1200px) {
  .mixed-hero__caption {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "kicker"
      "title"
      "meta"
      "actions";
    width: calc(100% - 2 * var(--mixed-inset));
  }

  .mixed-caption__actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    margin-top: 0.45rem;
  }
}

@media screen and (max-width: 900px) {
  .mixed-hero {
    --mixed-h: 46svh;
  }

  .mixed-item--shows {
    --mixed-w: min(var(--mixed-h), 82vw);
  }

  .mixed-item--pool {
    --mixed-w: min(calc(var(--mixed-h) * 0.75), 66vw);
  }

  .mixed-item--words {
    --mixed-w: min(calc(var(--mixed-h) * 1.5), 86vw);
  }

  .mixed-hero__caption {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "kicker"
      "title"
      "meta"
      "actions";
    width: calc(100% - 2 * var(--mixed-inset));
  }

  .mixed-caption__title {
    font-size: clamp(1.35rem, 6vw, 1.9rem);
  }

  .mixed-caption__actions {
    align-items: flex-start;
    margin-top: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mixed-item__body,
  .mixed-hero__caption {
    transition: none;
    animation: none;
  }
}
</style>
