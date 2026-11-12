<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { SET_QUERY_RESULT } from "~~/types/sanity.types.gen";

type SetDetail = NonNullable<SET_QUERY_RESULT>;

const { locale: _locale, setLocale: _setLocale } = useI18n();
const { navigateToTagSearch } = useTagNavigation();

const props = defineProps<{
	set: SetDetail;
}>();

const mainStore = useMainStore();
const account = useAccountStore();

const hasShow = computed(
	() =>
		Boolean(props.set?.parentShow?.title) &&
		props.set?.parentShow?.title !== "No Show",
);

const displayTitle = computed(() =>
	hasShow.value
		? (props.set?.parentShow?.title ?? "")
		: (props.set?.title ?? ""),
);

// Long show names must not break the magazine headline: the size steps down
// with the character count instead of overflowing the column.
const titleClass = computed(() => {
	const length = displayTitle.value.length;
	return {
		"is-long": length > 20 && length <= 32,
		"is-very-long": length > 32,
	};
});

const formattedDate = computed(() => {
	const value = props.set?.datetime ?? props.set?._updatedAt;
	return value ? formatDate(value) : "";
});

const persons = computed(() => props.set?.persons ?? []);

const nonCityTags = computed(() => {
	const tags = props.set?.tags;
	if (!Array.isArray(tags)) return [];
	return tags.filter((tag) => tag._type !== "tag.city");
});

const hasTracklist = computed(
	() =>
		Boolean(props.set?.tracklistRich?.length) ||
		Boolean(props.set?.tracklist?.length),
);

// The marquee needs flat strings; rich-tracklist blocks are flattened to their
// text runs so both data shapes can scroll.
function richTextLines(blocks: unknown): string[] {
	if (!Array.isArray(blocks)) return [];
	return blocks
		.map((block) => {
			const children = (block as { children?: Array<{ text?: string }> })
				.children;
			return (children ?? [])
				.map((child) => child.text ?? "")
				.join("")
				.trim();
		})
		.filter(Boolean);
}

const marqueeTracks = computed(() => {
	const plain = Array.isArray(props.set?.tracklist)
		? props.set.tracklist.filter((track) => Boolean(track))
		: [];
	if (plain.length) return plain;
	return richTextLines(props.set?.tracklistRich);
});

const hasShowText = computed(() =>
	Boolean(props.set?.parentShow?.content?.length),
);
const hasSetText = computed(() => Boolean(props.set?.content?.length));

const FALLBACK_SET_DESCRIPTION = "Press play and tune in.";
const fallbackDescriptionBlocks = computed(() => {
	const blocks = mainStore?.siteFallbacks?.fallbackSet?.description;
	return Array.isArray(blocks) && blocks.length > 0 ? blocks : null;
});

const { getSoundcloudArtwork, playTrack } = useSoundcloudArtwork();
const artworkUrl = ref("");

// Slow, group-level pointer drift for the generative glow. The listener sits
// on the window so the glow also reacts when the pointer is over the page
// background; the morphing SVG stays the main animation.
const glowOffset = ref({ x: 0, y: 0 });
const reduceMotion = ref(false);
let lastPointerMove = 0;
let lastGlowX = 0;
let lastGlowY = 0;

function onGlowPointerMove(event: PointerEvent) {
	if (reduceMotion.value || event.pointerType === "touch") return;
	const now = performance.now();
	if (now - lastPointerMove < 180) return;
	const nx = Math.min(
		0.5,
		Math.max(-0.5, event.clientX / window.innerWidth - 0.5),
	);
	const ny = Math.min(
		0.5,
		Math.max(-0.5, event.clientY / window.innerHeight - 0.5),
	);
	const ease = (value: number) =>
		Math.sign(value) * (Math.abs(value) * 2) ** 1.2 * 0.5;
	const x = Math.round(ease(nx) * 64);
	const y = Math.round(ease(ny) * 48);
	if (Math.abs(x - lastGlowX) < 1 && Math.abs(y - lastGlowY) < 1) return;
	lastPointerMove = now;
	lastGlowX = x;
	lastGlowY = y;
	glowOffset.value = { x, y };
}

function resetGlow() {
	lastPointerMove = 0;
	lastGlowX = 0;
	lastGlowY = 0;
	glowOffset.value = { x: 0, y: 0 };
}

const glowStyle = computed(() => ({
	"--glow-x": `${glowOffset.value.x}px`,
	"--glow-y": `${glowOffset.value.y}px`,
}));

function loadArtworkUrl() {
	if (props.set) artworkUrl.value = getSoundcloudArtwork(props.set);
}

function openTag(tag: unknown) {
	navigateToTagSearch(
		tag as Parameters<typeof navigateToTagSearch>[0],
		props.set as unknown as Parameters<typeof navigateToTagSearch>[1],
	);
}

// Clicking a marquee track copies artist and title to the clipboard.
const copiedIndex = ref<number | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

async function copyTrack(index: number, track: string) {
	const value = track.trim();
	if (!value) return;

	try {
		await navigator.clipboard.writeText(value);
	} catch {
		// Older browsers / insecure contexts: fall back to a hidden textarea.
		const textarea = document.createElement("textarea");
		textarea.value = value;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		textarea.remove();
	}

	copiedIndex.value = index;
	if (copiedTimer) clearTimeout(copiedTimer);
	copiedTimer = setTimeout(() => {
		copiedIndex.value = null;
	}, 1600);
}

onMounted(() => {
	loadArtworkUrl();
	reduceMotion.value = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	if (props.set?._id) account.loadVisible([props.set._id]);
	window.addEventListener("pointermove", onGlowPointerMove, { passive: true });
	document.documentElement.addEventListener("pointerleave", resetGlow);
});

onUnmounted(() => {
	if (copiedTimer) clearTimeout(copiedTimer);
	window.removeEventListener("pointermove", onGlowPointerMove);
	document.documentElement.removeEventListener("pointerleave", resetGlow);
});
</script>

<template>
	<article v-if="set" class="set-page">
		<div
			class="set-head"
			:style="glowStyle"
		>
			<div
				class="set-glow"
				:class="{ 'is-dark': mainStore.isDarkMode }"
				aria-hidden="true"
			>
				<AnimatedGradient class="set-glow__blob set-glow__blob--a" />
				<AnimatedGradient class="set-glow__blob set-glow__blob--b" />
				<AnimatedGradient class="set-glow__blob set-glow__blob--c" />
			</div>

			<div class="set-intro">
				<p class="eyebrow">
					Set
					<template v-if="formattedDate">
						<span>·</span>{{ formattedDate }}
					</template>
				</p>

				<h1 class="set-title" :class="titleClass">
					<ElementsContentLink
						v-if="hasShow"
						class="set-title__link"
						:show="set.parentShow"
					>
						{{ displayTitle }}
					</ElementsContentLink>
					<template v-else>{{ displayTitle }}</template>
				</h1>

				<p v-if="persons.length" class="set-artists">
					<template v-for="artist in persons" :key="artist._id">
						<span
							class="dot"
							:class="artist?.poolVisibility ? 'dot--pool' : 'dot--muted'"
						/>
						<ElementsContentLink
							v-if="artist?.poolVisibility"
							class="set-artists__link"
							:pool="artist"
						>
							{{ artist.title }}
						</ElementsContentLink>
						<span v-else class="set-artists__name">{{ artist.title }}</span>
						<span
							v-if="index < persons.length - 1"
							class="set-artists__sep"
						>
							/
						</span>
					</template>
				</p>

				<div v-if="nonCityTags.length" class="tags set-tags">
					<button
						v-for="(tag, index) in nonCityTags"
						:key="tag._id || index"
						class="tag"
						type="button"
						@click="openTag(tag)"
					>
						{{ getI18nLabel(tag?.title) }}
					</button>
				</div>

				<div class="set-actions">
					<button type="button" class="cta" @click="playTrack(set)">
						<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
						<span>Listen to set</span>
					</button>
					<ElementsHeartButton
						v-if="set?._id"
						:set-id="set._id"
						variant="inline"
						class="set-heart"
					/>
				</div>
			</div>

			<button
				type="button"
				class="set-cover"
				:aria-label="`Play ${displayTitle}`"
				@click="playTrack(set)"
			>
				<img
					v-if="artworkUrl"
					:src="artworkUrl"
					:alt="displayTitle"
					class="set-cover__image"
					loading="eager"
				/>
				<span v-else class="set-cover__placeholder" />
				<span class="set-cover__shade" aria-hidden="true" />
				<span class="set-cover__play" aria-hidden="true">
					<img src="/icons/play-button.svg" alt="" />
				</span>
			</button>

			<div class="set-body">
				<section class="set-about">
					<template v-if="hasShowText">
						<h2 class="label">About the show</h2>
						<RichText :blocks="set.parentShow?.content" />
					</template>

					<template v-if="hasSetText">
						<h2 class="label">About this set</h2>
						<RichText :blocks="set.content" />
					</template>

					<template v-if="!hasShowText && !hasSetText">
						<h2 class="label">About this set</h2>
						<RichText
							v-if="fallbackDescriptionBlocks"
							:blocks="fallbackDescriptionBlocks"
						/>
						<p v-else>{{ FALLBACK_SET_DESCRIPTION }}</p>
					</template>
				</section>
			</div>
		</div>

		<section
			v-if="hasTracklist && marqueeTracks.length"
			class="set-marquee"
			aria-label="Tracklist"
		>
			<div class="set-marquee__track">
				<div
					v-for="copy in 2"
					:key="copy"
					class="set-marquee__row"
					:aria-hidden="copy === 2 ? 'true' : undefined"
				>
					<button
						v-for="(track, index) in marqueeTracks"
						:key="`${copy}-${index}`"
						type="button"
						class="set-marquee__item"
						:class="{ 'is-copied': copiedIndex === index }"
						:tabindex="copy === 2 ? -1 : undefined"
						:aria-label="`${track} kopieren`"
						@click="copyTrack(index, track)"
					>
						<span class="set-marquee__dot">
							{{ String(index + 1).padStart(2, "0") }}
						</span>
						<span class="set-marquee__text">{{ track }}</span>
						<span class="set-marquee__hint" aria-hidden="true">Kopiert</span>
					</button>
				</div>
			</div>
			<span class="set-marquee__status" role="status" aria-live="polite">
				{{ copiedIndex !== null ? "Track kopiert" : "" }}
			</span>
		</section>
	</article>
</template>

<style lang="postcss" scoped>
.set-page {
  width: var(--page-max-width);
  max-width: 100%;
  margin: var(--big-margin) auto 0;
}

/* Magazine head: intro and body share the left column, the cover sits right.
   Everything is top-aligned. */
.set-head {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.95fr);
  grid-template-areas:
    "intro cover"
    "body cover";
  grid-template-rows: auto 1fr;
  column-gap: var(--big-margin);
  row-gap: var(--base-margin);
  align-items: start;

  @media screen and (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "intro"
      "cover"
      "body";
    row-gap: var(--base-margin);
  }
}

/* Generative glow behind the info column — same AnimatedGradient as the
   landing hero, layered into soft pink metaballs with a subtle pointer
   parallax. */
.set-glow {
  position: fixed;
  top: 7vh;
  left: 5vw;
  width: 52vw;
  height: 58vh;
  z-index: -1;
  pointer-events: none;
  transform: translate3d(var(--glow-x, 0px), var(--glow-y, 0px), 0);
  transition: transform 1000ms cubic-bezier(0.22, 1, 0.36, 1);

  @media screen and (max-width: 900px) {
    top: 5vh;
    left: -18vw;
    width: 132vw;
    height: 40vh;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &.is-dark .set-glow__blob {
    opacity: 1;
    filter: blur(22px);

    &--b {
      opacity: 0.8;
      filter: blur(40px);
    }

    &--c {
      opacity: 0.58;
      filter: blur(52px);
    }
  }
}

.set-glow__blob {
  position: absolute;
  display: block;
  opacity: 0.56;
  filter: blur(26px);

  :deep(svg path) {
    opacity: 1;
  }

  &--a {
    top: -4%;
    left: -4%;
    width: 72%;
    height: 86%;
  }

  &--b {
    right: -6%;
    bottom: -10%;
    width: 62%;
    height: 72%;
    opacity: 0.4;
    filter: blur(44px);
    transform: rotate(8deg);
  }

  &--c {
    top: 26%;
    left: 38%;
    width: 46%;
    height: 52%;
    opacity: 0.28;
    filter: blur(56px);
    transform: rotate(-14deg);
  }
}

.set-intro,
.set-cover,
.set-body {
  position: relative;
  z-index: 1;
}

.set-intro {
  grid-area: intro;
  display: flex;
  flex-flow: column;
  gap: var(--mid-padding);
  align-items: flex-start;
}

.eyebrow {
  margin: 0;
  font-size: var(--small-font-size);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);

  span {
    opacity: 0.4;
    margin: 0 0.3rem;
  }
}

.set-title {
  margin: 0;
  font-family: var(--font-text-semibold);
  font-weight: 500;
  font-size: clamp(2.4rem, 5.6vw, 5rem);
  line-height: 0.92;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  max-width: 100%;
  overflow-wrap: anywhere;
  text-wrap: balance;

  &.is-long {
    font-size: clamp(2rem, 4.2vw, 3.6rem);
  }

  &.is-very-long {
    font-size: clamp(1.7rem, 3.2vw, 2.7rem);
  }

  &__link {
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }
}

.set-artists {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-family: var(--font-text-semibold);
  font-size: var(--base-font-size);
  text-transform: uppercase;

  &__link {
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-blue);
    }
  }

  &__sep {
    opacity: 0.35;
  }
}

.dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex: none;

  /* Grey by default; pool blue when the artist has a published profile. */
  &--muted {
    background-color: var(--color-dark-grey);
  }

  &--pool {
    background-color: var(--color-blue);
  }
}

.set-actions {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: var(--mid-padding);
  margin-top: var(--small-padding);
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem 0.45rem 0.45rem;
  border: 0;
  border-radius: var(--pill-radius);
  background-color: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-text);
  font-size: var(--small-font-size);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  img {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
  }

  &:hover {
    background-color: var(--color-pink);
    color: var(--color-white);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 3px;
  }
}

/* Cover: click starts the set, hover/focus reveals the centred play icon. */
.set-cover {
  grid-area: cover;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 0;
  border-radius: 5px;
  overflow: hidden;
  background-color: var(--color-grey);
  cursor: pointer;

  &__image,
  &__placeholder {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__shade {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.28);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &__play {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5rem;
    height: 5rem;
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);

    img {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &:hover,
  &:focus-visible {
    .set-cover__shade {
      opacity: 1;
    }

    .set-cover__play {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* Touch devices never hover: keep the play affordance visible. */
  @media (hover: none) {
    .set-cover__shade {
      opacity: 0.12;
    }

    .set-cover__play {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      width: 4rem;
      height: 4rem;
    }
  }
}

/* About sits directly under the play button, inside the left column next to
   the cover. */
.set-body {
  grid-area: body;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--big-margin);
  align-items: start;
}

/* Infinite tracklist marquee between the set header and the related grid. */
.set-marquee {
  width: 100svw;
  max-width: 100svw;
  margin-top: var(--big-margin);
  margin-left: calc(50% - 50svw);
  padding: var(--base-margin) 0;
  border-top: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text) 14%, transparent);
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 6%,
    #000 94%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 6%,
    #000 94%,
    transparent 100%
  );

  &__track {
    display: flex;
    width: max-content;
    animation: set-marquee-scroll 55s linear infinite;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: var(--base-margin);
    padding-right: var(--base-margin);
  }

  &__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--small-padding);
    white-space: nowrap;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    cursor: pointer;

    &:hover .set-marquee__dot {
      background-color: var(--color-pink);
    }

    &.is-copied .set-marquee__dot {
      background-color: var(--color-blue);
    }

    &:focus-visible {
      outline: 2px solid var(--color-blue);
      outline-offset: 4px;
      border-radius: 4px;
    }
  }

  &__hint {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.45rem);
    transform: translateX(-50%) translateY(0.25rem);
    padding: 0.15rem 0.45rem;
    border-radius: var(--pill-radius);
    background-color: var(--color-blue);
    color: #fff;
    font-family: var(--font-text);
    font-size: 0.625rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  &__item.is-copied &__hint {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  &__status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  &__dot {
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: var(--color-text);
    color: var(--color-bg);
    font-family: var(--font-text-semibold);
    font-size: 0.625rem;
    letter-spacing: 0.02em;
    flex: none;
  }

  &__text {
    font-family: var(--font-text-semibold);
    font-size: clamp(1rem, 1.5vw, 1.35rem);
    text-transform: uppercase;
    letter-spacing: 0.01em;
  }

  &:hover &__track {
    animation-play-state: paused;
  }

  /* Keyboard/touch: once a track has focus the strip stops moving. */
  &:focus-within &__track {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    overflow-x: auto;

    &__track {
      animation: none;
    }
  }
}

@keyframes set-marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.label {
  margin: 0 0 var(--mid-padding);
  font-family: var(--font-text-semibold);
  font-weight: 500;
  font-size: var(--small-font-size);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
  opacity: 0.6;
}

.set-about {
  :deep(.rich-text) {
    font-size: var(--base-font-size);
    line-height: 1.6;
  }

  :deep(p) {
    margin: 0 0 var(--mid-padding);
  }

  .label:not(:first-child) {
    margin-top: var(--base-margin);
  }
}

.set-tags {
  display: flex;
  flex-flow: row wrap;
  gap: 0.375rem;
}
</style>
