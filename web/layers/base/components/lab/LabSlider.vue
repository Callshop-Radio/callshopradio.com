<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

// biome-ignore lint/suspicious/noExplicitAny: design lab prototypes read loose Sanity docs
type LabItem = Record<string, any>;
type Direction = "signal" | "aperture" | "press";
type LabPage = "shows" | "pool" | "words";

const props = defineProps<{
	items: LabItem[];
	direction: Direction;
	page: LabPage;
	accent: string;
	frontWorm?: boolean;
}>();

const emit = defineEmits<{
	"update:index": [index: number];
}>();

const viewport = ref<HTMLElement | null>(null);

const realCount = computed(() => props.items.length);

// Three identical copies: one full set of runway on each side. The scroll
// position is recentered by exactly one set, which is pixel-identical and
// therefore invisible, so the slider never runs out of cards.
const loopItems = computed(() => {
	if (realCount.value < 2) return props.items;
	return [...props.items, ...props.items, ...props.items];
});

const initialRealIndex = Math.min(1, Math.max(0, props.items.length - 1));

const align = computed<"center" | "start">(() => {
	if (props.page === "shows") return "center";
	if (props.page === "words") return "start";
	// Pool puts the active portrait directly beside the caption so the
	// caption-to-portrait relationship is unambiguous. Press keeps the
	// centred salon wall.
	return props.direction === "press" ? "center" : "start";
});

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
		align: align.value,
		// Start one card in so both neighbours are visible in the lab.
		initialIndex:
			realCount.value > 1
				? realCount.value + initialRealIndex
				: initialRealIndex,
		loop: realCount.value > 1,
		loopSize: realCount.value,
	},
);

const { playTrack } = useSoundcloudArtwork();

const realIndex = computed(() =>
	realCount.value
		? ((activeIndex.value % realCount.value) + realCount.value) %
			realCount.value
		: 0,
);

const activeItem = computed(() => props.items[realIndex.value] ?? null);

const activeTitle = computed(() => {
	const item = activeItem.value;
	return item?.parentShow?.title || item?.title || item?.name || "";
});

const carouselLabel = computed(() => {
	if (props.page === "shows") return "Shows-Highlights";
	if (props.page === "pool") return "Pool-Profile";
	return "Words-Artikel";
});

const mediaAspect = computed(() => {
	if (props.page === "shows") {
		return props.direction === "press" ? "4 / 5" : "1 / 1";
	}
	if (props.page === "pool") return "3 / 4";
	if (props.direction === "aperture" || props.direction === "press") {
		return "21 / 9";
	}
	return "3 / 2";
});

const pad = (value: number) => String(value).padStart(2, "0");

const indexLabel = computed(
	() => `${pad(realIndex.value + 1)} / ${pad(realCount.value)}`,
);

const announcedIndex = ref(0);
let announceTimer: ReturnType<typeof setTimeout> | null = null;

// The form morph must start on the click, not when the scroll reaches the
// midpoint. Emit the navigation target immediately; actual scroll updates are
// ignored while a target is pending (drag/scroll still emit normally).
let formTarget: number | null = null;
let formTargetTimer: ReturnType<typeof setTimeout> | null = null;

function realOf(index: number) {
	if (!realCount.value) return 0;
	return ((index % realCount.value) + realCount.value) % realCount.value;
}

function clearFormTarget() {
	formTarget = null;
	if (formTargetTimer) {
		clearTimeout(formTargetTimer);
		formTargetTimer = null;
	}
}

function setFormTarget(index: number) {
	const target = realOf(index);
	formTarget = target;
	if (formTargetTimer) clearTimeout(formTargetTimer);
	formTargetTimer = setTimeout(() => {
		formTarget = null;
	}, 1200);
	emit("update:index", target);
}

watch(
	realIndex,
	(value) => {
		if (announceTimer) clearTimeout(announceTimer);
		announceTimer = setTimeout(() => {
			announcedIndex.value = value;
		}, 320);

		if (formTarget !== null && value !== formTarget) return;
		if (value === formTarget) clearFormTarget();
		emit("update:index", value);
	},
	{ immediate: true },
);

const announcedTitle = computed(() => {
	const item = props.items[announcedIndex.value];
	return item?.parentShow?.title || item?.title || item?.name || "";
});

function handlePrev() {
	setFormTarget(activeIndex.value - 1);
	prev();
}

function handleNext() {
	setFormTarget(activeIndex.value + 1);
	next();
}

function goToSlide(index: number) {
	setFormTarget(index);
	goTo(index);
}

function handlePointerDown(event: PointerEvent) {
	clearFormTarget();
	onPointerDown(event);
}

function onWindowKeydown(event: KeyboardEvent) {
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
		handlePrev();
	} else if (event.key === "ArrowRight") {
		event.preventDefault();
		handleNext();
	}
}

onMounted(() => {
	window.addEventListener("keydown", onWindowKeydown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", onWindowKeydown);
	if (announceTimer) clearTimeout(announceTimer);
	clearFormTarget();
});

function itemZIndex(index: number) {
	if (index === activeIndex.value) return 20;
	const distance = distances.value[index] ?? index - activeIndex.value;
	// Every inactive card stays below the foreground worm (z-index 5); only
	// their order relative to each other still matters.
	return Math.max(1, 3 - Math.floor(Math.abs(distance)));
}

function itemStyle(index: number) {
	const distance = distances.value[index] ?? index - activeIndex.value;
	const abs = Math.abs(distance);
	const layoutIndex = realCount.value ? index % realCount.value : index;
	// The active card can sit a fraction of a pixel to the left of the snap
	// line during scrolling. Deriving "left of the active card" from the
	// continuous distance then flips the active card into the exit state and
	// makes it flash. The index is stable, so use it for the exit state.
	const isLeftPoolCard = props.page === "pool" && index < activeIndex.value;
	const leftSteps = isLeftPoolCard ? activeIndex.value - index : 0;
	const leftShift = isLeftPoolCard
		? `-${Math.min(102, leftSteps * 34)}vw`
		: "0vw";

	if (props.direction === "aperture") {
		const rotateY = Math.max(-14, Math.min(14, distance * -5));
		// Depth falloff: the first neighbour stays readable, everything beyond
		// it dissolves before it can be clipped by the viewport edge. Without
		// this the third card kept a bright, hard-cut strip at the right edge.
		const fade = Math.max(0, 1 - abs * 0.12 - Math.max(0, abs - 1) * 0.85);
		return {
			transform: `translate3d(${leftShift}, ${abs * 10}px, 0) scale(${1 - abs * 0.07}) rotateY(${rotateY}deg)`,
			filter: `blur(${Math.min(abs * 12, 12)}px)`,
			opacity: isLeftPoolCard ? "0" : String(Math.min(1, fade)),
		};
	}

	if (props.direction === "press") {
		const stagger = props.page === "pool" ? ((layoutIndex % 3) - 1) * 14 : 0;
		const tilt =
			props.page === "pool"
				? (layoutIndex % 2 === 0 ? -1 : 1) * Math.min(abs * 1.8, 4)
				: 0;
		return {
			transform: `translate3d(0, ${abs * 5 + stagger}px, 0) scale(${1 - abs * 0.03}) rotate(${tilt}deg)`,
			filter: `blur(${Math.min(abs * 1.4, 3)}px)`,
			opacity: String(Math.max(0.35, 1 - abs * 0.2)),
		};
	}

	return {
		transform: `translate3d(0, ${abs * 8}px, 0) scale(${1 - abs * 0.055})`,
		filter: `blur(${Math.min(abs * 2.2, 6)}px)`,
		opacity: String(Math.max(0.3, 1 - abs * 0.25)),
	};
}

function onItemClick(index: number) {
	if (index !== activeIndex.value) goToSlide(index);
}

function onPlay() {
	if (activeItem.value) playTrack(activeItem.value);
}

function onRead() {
	const path = activeItem.value?.path;
	if (path) navigateTo(path);
}

function onOpen() {
	const path = activeItem.value?.path;
	if (path) navigateTo(path);
}

function onMediaClick(index: number, item: LabItem) {
	if (index !== activeIndex.value) {
		goToSlide(index);
		return;
	}
	if (item?.path) navigateTo(item.path);
}

function itemLabel(item: LabItem) {
	return item?.parentShow?.title || item?.title || item?.name || "item";
}
</script>

<template>
	<div
		class="lab-slider"
		:class="[
			`lab-slider--${direction}`,
			`lab-slider--${page}`,
			{ 'is-dragging': isDragging, 'is-front-worm': frontWorm },
		]"
		:style="{ '--accent': accent }"
	>
		<!-- Shows: the active artwork owns the stage; the label sits under it. -->
		<div v-if="page === 'shows'" class="lab-stage lab-stage--shows">
			<div
				ref="viewport"
				class="lab-viewport"
				role="region"
				aria-roledescription="carousel"
				:aria-label="carouselLabel"
				tabindex="0"
				@scroll.passive="onScroll"
				@pointerdown="handlePointerDown"
				@click.capture="onClickCapture"
			>
				<div class="lab-track lab-track--center">
					<span class="lab-spacer" aria-hidden="true" />
					<div
						v-for="(item, index) in loopItems"
						:key="`${item._id || 'item'}-${index}`"
						class="lab-item lab-item--shows"
						role="group"
						aria-roledescription="slide"
						:aria-label="`${(index % realCount) + 1} von ${realCount}`"
						:data-active="index === activeIndex"
						:style="{ zIndex: itemZIndex(index) }"
						@click="onItemClick(index)"
					>
						<div class="lab-item__body" :style="itemStyle(index)">
							<div class="lab-media-wrap">
							<LabMedia
								:item="item"
								page="shows"
								:active="index === activeIndex"
								:aspect="mediaAspect"
							/>
							<button
								type="button"
								class="lab-media-hit"
								:aria-label="`${index === activeIndex ? 'Open' : 'Focus'}: ${itemLabel(item)}`"
								:tabindex="index === activeIndex ? 0 : -1"
								@click.stop="onMediaClick(index, item)"
							/>
							<span
								v-if="direction === 'press'"
								class="lab-item__index lab-item__index--large"
								aria-hidden="true"
							>
								{{ pad((index % realCount) + 1) }}
							</span>
						</div>
						<LabCaption
							:item="item"
							page="shows"
							variant="stack"
							:index="pad((index % realCount) + 1)"
							@play="onPlay"
							@open="onOpen"
						/>
						</div>
					</div>
					<span class="lab-spacer" aria-hidden="true" />
				</div>
			</div>
		</div>

		<!-- Pool: portrait-first. Signal/Aperture use a side column, Press a label below. -->
		<div
			v-else-if="page === 'pool'"
			class="lab-pool-layout"
			:class="{ 'lab-pool-layout--press': direction === 'press' }"
		>
			<aside v-if="direction !== 'press'" class="lab-pool-layout__aside">
				<LabCaption
					v-if="activeItem"
					:key="realIndex"
					:item="activeItem"
					page="pool"
					variant="column"
					:index="indexLabel"
					@open="onOpen"
				/>
			</aside>

			<div
				ref="viewport"
				class="lab-viewport lab-viewport--pool"
				:class="{ 'lab-viewport--pool--start': align === 'start' }"
				role="region"
				aria-roledescription="carousel"
				:aria-label="carouselLabel"
				tabindex="0"
				@scroll.passive="onScroll"
				@pointerdown="handlePointerDown"
				@click.capture="onClickCapture"
			>
				<div
					class="lab-track"
					:class="align === 'center' ? 'lab-track--center' : 'lab-track--start'"
				>
					<span v-if="align === 'center'" class="lab-spacer" aria-hidden="true" />
					<div
						v-for="(item, index) in loopItems"
						:key="`${item._id || 'item'}-${index}`"
						class="lab-item lab-item--pool"
						role="group"
						aria-roledescription="slide"
						:aria-label="`${(index % realCount) + 1} von ${realCount}`"
						:data-active="index === activeIndex"
						:style="{ zIndex: itemZIndex(index) }"
						@click="onItemClick(index)"
					>
						<div class="lab-item__body" :style="itemStyle(index)">
							<div class="lab-media-wrap">
							<LabMedia
								:item="item"
								page="pool"
								:active="index === activeIndex"
								:aspect="mediaAspect"
							/>
							<button
								type="button"
								class="lab-media-hit"
								:aria-label="`${index === activeIndex ? 'Open' : 'Focus'}: ${itemLabel(item)}`"
								:tabindex="index === activeIndex ? 0 : -1"
								@click.stop="onMediaClick(index, item)"
							/>
							<span class="lab-item__index" aria-hidden="true">
								{{ pad((index % realCount) + 1) }}
							</span>
						</div>
						<LabCaption
							v-if="direction === 'press'"
							:item="item"
							page="pool"
							variant="stack"
							:index="pad((index % realCount) + 1)"
							@open="onOpen"
						/>
						</div>
					</div>
					<span v-if="align === 'center'" class="lab-spacer" aria-hidden="true" />
					<span
						v-if="align === 'start'"
						class="lab-spacer lab-spacer--end"
						aria-hidden="true"
					/>
				</div>
			</div>
		</div>

		<!-- Words: Signal uses a side caption, Aperture/Press sit below the image. -->
		<div
			v-else
			class="lab-words-layout"
			:class="{ 'lab-words-layout--split': direction === 'signal' }"
		>
			<div
				ref="viewport"
				class="lab-viewport lab-viewport--words"
				role="region"
				aria-roledescription="carousel"
				:aria-label="carouselLabel"
				tabindex="0"
				@scroll.passive="onScroll"
				@pointerdown="handlePointerDown"
				@click.capture="onClickCapture"
			>
				<div
					class="lab-track"
					:class="align === 'center' ? 'lab-track--center' : 'lab-track--start'"
				>
					<span v-if="align === 'center'" class="lab-spacer" aria-hidden="true" />
					<div
						v-for="(item, index) in loopItems"
						:key="`${item._id || 'item'}-${index}`"
						class="lab-item lab-item--words"
						role="group"
						aria-roledescription="slide"
						:aria-label="`${(index % realCount) + 1} von ${realCount}`"
						:data-active="index === activeIndex"
						:style="{ zIndex: itemZIndex(index) }"
						@click="onItemClick(index)"
					>
						<div class="lab-item__body" :style="itemStyle(index)">
							<div class="lab-media-wrap">
							<LabMedia
								:item="item"
								page="words"
								:active="index === activeIndex"
								:aspect="mediaAspect"
							/>
							<button
								type="button"
								class="lab-media-hit"
								:aria-label="`${index === activeIndex ? 'Open' : 'Focus'}: ${itemLabel(item)}`"
								:tabindex="index === activeIndex ? 0 : -1"
								@click.stop="onMediaClick(index, item)"
							/>
						</div>
						<LabCaption
							v-if="direction !== 'signal'"
							:item="item"
							page="words"
							variant="band"
							:index="pad((index % realCount) + 1)"
							@read="onRead"
						/>
						</div>
					</div>
					<span v-if="align === 'center'" class="lab-spacer" aria-hidden="true" />
					<span
						v-if="align === 'start'"
						class="lab-spacer lab-spacer--end"
						aria-hidden="true"
					/>
				</div>
			</div>

			<aside v-if="direction === 'signal'" class="lab-words-layout__aside">
				<LabCaption
					v-if="activeItem"
					:key="realIndex"
					:item="activeItem"
					page="words"
					variant="split"
					:index="indexLabel"
					@read="onRead"
				/>
			</aside>
		</div>

		<LabTransport
			:active-index="realIndex"
			:total="realCount"
			:label="carouselLabel"
			@prev="handlePrev"
			@next="handleNext"
		/>

		<p class="lab-sr-only" aria-live="polite">
			{{ announcedIndex + 1 }} von {{ realCount }}: {{ announcedTitle }}
		</p>
	</div>
</template>

<style lang="postcss" scoped>
.lab-slider {
  --lab-item-width: 20rem;
  --lab-gap: 2rem;
  --lab-media-radius: 5px;

  position: relative;
  z-index: 1;
  width: 100%;

  /* The foreground worm is a sibling in the hero stacking context. Dropping
     the slider's own z-index lets its cards (1–3 / 20) interleave with it. */
  &.is-front-worm {
    z-index: auto;
  }

  &.is-front-worm :deep(.lab-transport) {
    position: relative;
    z-index: 30;
  }

  &--shows {
    --lab-gap: clamp(1rem, 2vw, 2.2rem);
  }

  &--shows.lab-slider--signal {
    --lab-item-width: min(26vw, 40svh, 26rem);
  }

  &--shows.lab-slider--aperture {
    --lab-item-width: min(28vw, 38svh, 28rem);
  }

  &--shows.lab-slider--press {
    --lab-item-width: min(22vw, 34svh, 22rem);
  }

  &--pool {
    --lab-gap: clamp(1rem, 1.6vw, 1.8rem);
    --lab-pool-caption-width: clamp(15rem, 23vw, 28rem);
    --lab-pool-gap: clamp(1.5rem, 2.5vw, 3.5rem);
  }

  &--pool.lab-slider--signal {
    --lab-item-width: min(24vw, 32svh, 24rem);
  }

  &--pool.lab-slider--aperture {
    --lab-item-width: min(25vw, 40svh, 25rem);
  }

  &--pool.lab-slider--press {
    --lab-item-width: min(20vw, 28svh, 20rem);
  }

  &--words {
    --lab-gap: clamp(1.5rem, 3vw, 3.5rem);
  }

  &--words.lab-slider--signal {
    --lab-item-width: min(42vw, calc(34svh * 2.333), 44rem);
  }

  &--words.lab-slider--aperture {
    --lab-item-width: min(66vw, calc(36svh * 2.333), 56rem);
  }

  &--words.lab-slider--press {
    --lab-item-width: min(72vw, calc(40svh * 2.333), 54rem);
  }

}

/* ---------------------------------------------------------------- viewport */

.lab-viewport {
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  padding-block: 0.5rem 0.75rem;

  /* Desktop cover-flow: the first neighbour stays readable, everything past
     it already fades out in itemStyle, so only a narrow edge mask is needed to
     soften a card that still touches the viewport border. Words runs a
     full-bleed cover, so it must keep its own sharp edges. */
  @media screen and (min-width: 901px) {
    &:not(.lab-viewport--words) {
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
  }

  &::-webkit-scrollbar {
    display: none;
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid var(--accent, var(--color-text));
    outline-offset: 6px;
    border-radius: var(--radius-media);
  }
}

.is-dragging .lab-viewport {
  cursor: grabbing;
}

/* ------------------------------------------------------------------- track */

.lab-track {
  display: flex;
  align-items: flex-start;
  gap: var(--lab-gap);
  width: 100%;
}

.lab-track--start {
  padding-left: var(--lab-start-offset, 0px);
}

.lab-spacer {
  flex: 0 0 max(
    0px,
    calc((100% - var(--lab-item-width)) / 2 - var(--lab-gap))
  );
  align-self: stretch;
  pointer-events: none;
}

.lab-spacer--end {
  /* A percentage in flex-basis resolves against the track's content box, which
     is already reduced by the start offset. That makes this the exact space
     needed to pull the last card to the start line:
     contentBox - itemWidth - gap. */
  flex-basis: max(
    0px,
    calc(100% - var(--lab-item-width) - var(--lab-gap))
  );
}

.lab-item {
  position: relative;
  flex: 0 0 var(--lab-item-width);
  min-width: 0;
  scroll-snap-align: center;
  cursor: pointer;

  &--pool {
    scroll-snap-align: center;
  }

  .lab-track--start & {
    scroll-snap-align: start;
  }

  &[data-active="true"] {
    cursor: default;
  }

  &[data-active="true"] .lab-media-wrap {
    box-shadow:
      0 1.4rem 3.6rem rgba(0, 0, 0, 0.24),
      0 0 0 1px transparent;
  }

  &[data-active="true"] .lab-media-wrap:hover {
    box-shadow:
      0 1.4rem 3.6rem rgba(0, 0, 0, 0.24),
      0 0 0 1px color-mix(in srgb, var(--accent, var(--color-text)) 55%, transparent);
  }
}

.lab-item__body {
  transform-origin: center top;
  backface-visibility: hidden;
  will-change: transform, filter, opacity;
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.is-dragging .lab-item__body {
  transition: none;
}

/* A loop jump swaps to an identical copy. The new active card must appear in
   its final state immediately, otherwise it animates in from the off-screen
   exit position and the wrap looks like a reload. */
.is-loop-jump .lab-item__body,
.is-loop-jump .lab-media-wrap,
.is-loop-jump .lab-caption {
  transition: none !important;
}

.lab-media-wrap {
  position: relative;
  z-index: 1;
  border-radius: var(--lab-media-radius);
  transition: box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.lab-media-hit {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--radius-media);
  background: transparent;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--accent, var(--color-text)) 62%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent, var(--color-text));
    outline-offset: -2px;
  }
}

.lab-item__index {
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  z-index: 3;
  display: grid;
  place-items: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.35rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: var(--radius-media);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-s);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  pointer-events: none;

  &--large {
    top: 0.8rem;
    left: 0.9rem;
    min-width: 0;
    height: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: #fff;
    font-family: var(--font-text-semibold);
    font-size: var(--text-display);
    letter-spacing: -0.04em;
    line-height: 0.8;
    mix-blend-mode: difference;
  }
}

/* ------------------------------------------------------------- shows label */

.lab-item--shows {
  .lab-caption {
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition:
      opacity 300ms ease,
      transform 300ms ease,
      visibility 300ms;
    pointer-events: none;
  }

  &[data-active="true"] .lab-caption {
    opacity: 1;
    visibility: visible;
    transform: none;
    pointer-events: auto;
  }
}

.lab-slider--aperture .lab-item--shows .lab-caption--stack {
  margin-top: 0.5rem;
  padding: 0.9rem var(--mid-padding) var(--mid-padding);
  border-radius: var(--radius-media);
  background-color: var(--color-bg);
}

.lab-slider--press.lab-slider--shows .lab-item--shows .lab-caption--stack {
  margin-top: 0.5rem;
  padding-top: var(--mid-padding);
}

/* ---------------------------------------------------------------- layouts */

.lab-stage {
  width: 100%;
}

.lab-stage--shows {
  min-height: 28rem;
}

.lab-pool-layout {
  position: relative;
  display: block;
  padding-left: 0;
}

.lab-words-layout--split {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(17rem, 0.75fr);
  align-items: center;
  gap: clamp(2rem, 4vw, 5rem);
}

.lab-pool-layout__aside {
  position: absolute;
  top: 1rem;
  left: var(--lab-inset, 0px);
  z-index: 12;
  width: var(--lab-pool-caption-width, 23vw);
  padding-top: 0;

  :deep(.lab-caption) {
    animation: lab-caption-in 340ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.lab-words-layout__aside {
  padding-top: 1.5rem;

  :deep(.lab-caption) {
    animation: lab-caption-in 340ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.lab-viewport--pool {
  padding-block: 1rem 1.5rem;
}

.lab-viewport--pool--start {
  --lab-start-offset: calc(
    var(--lab-inset, 0px) + var(--lab-pool-caption-width) +
      var(--lab-pool-gap)
  );

  scroll-padding-left: var(--lab-start-offset);
}

.lab-pool-layout--press {
  display: block;
  position: relative;
  padding-left: 0;
}

.lab-item--pool {
  .lab-caption {
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition:
      opacity 300ms ease,
      transform 300ms ease,
      visibility 300ms;
    pointer-events: none;
  }

  &[data-active="true"] .lab-caption {
    opacity: 1;
    visibility: visible;
    transform: none;
    pointer-events: auto;
  }
}

.lab-slider--press.lab-slider--pool .lab-item--pool .lab-caption--stack {
  margin-top: 0.5rem;
  padding-top: var(--mid-padding);
  min-height: 8.5rem;
  max-height: 10rem;
  overflow: hidden;
}

/* ---------------------------------------------------------------- words */

.lab-item--words {
  .lab-caption {
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition:
      opacity 300ms ease,
      transform 300ms ease,
      visibility 300ms;
    pointer-events: none;
  }

  &[data-active="true"] .lab-caption {
    opacity: 1;
    visibility: visible;
    transform: none;
    pointer-events: auto;
  }
}

.lab-slider--press.lab-slider--words .lab-item--words .lab-caption--band {
  margin-top: 0.5rem;
  padding: var(--mid-padding) var(--mid-padding)
    calc(var(--mid-padding) + 0.25rem);
  border-radius: var(--radius-media);
  background-color: var(--color-bg);
  --lab-band-min-height: 9.5rem;
  --lab-caption-title-size: var(--text-l);
}

/* --------------------------------------------------------------- animation */

@keyframes lab-caption-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* ----------------------------------------------------------------- mobile */

@media screen and (max-width: 900px) {
  .lab-slider {
    --lab-gap: 0.9rem;

    &--shows.lab-slider--signal,
    &--shows.lab-slider--aperture {
      --lab-item-width: 68vw;
    }

    &--shows.lab-slider--press {
      --lab-item-width: 80vw;
    }

    &--pool.lab-slider--signal,
    &--pool.lab-slider--aperture,
    &--pool.lab-slider--press {
      --lab-item-width: 68vw;
    }

    &--pool.lab-slider--aperture {
      --lab-item-width: 56vw;
    }

    &--words.lab-slider--signal,
    &--words.lab-slider--aperture,
    &--words.lab-slider--press {
      --lab-item-width: 86vw;
    }

    &--press.lab-slider--shows :deep(.lab-media--shows) {
      aspect-ratio: 1 / 1;
    }
  }

  .lab-viewport {
    padding-block: 0.5rem 0.75rem;
  }

  .lab-spacer:not(.lab-spacer--end) {
    flex-basis: max(
      0px,
      calc((100% - var(--lab-item-width)) / 2 - var(--lab-gap))
    );
  }

  .lab-stage--shows {
    min-height: 0;
  }

  .lab-words-layout--split,
  .lab-pool-layout {
    display: flex;
    flex-direction: column;
    gap: var(--mid-padding);
    align-items: stretch;
  }

  .lab-pool-layout {
    padding-left: 0;

    .lab-viewport {
      order: 1;
    }

    .lab-pool-layout__aside {
      position: static;
      order: 2;
      top: auto;
      left: auto;
      width: auto;
      margin-left: 0;
      padding-top: 0;
      padding-inline: 2rem;
      background: none;
      border-top: 1px solid
        color-mix(in srgb, var(--color-text) 14%, transparent);
    }
  }

  .lab-viewport--pool--start {
    --lab-start-offset: 0px;
    scroll-padding-left: 0;
  }

  .lab-viewport--pool--start {
    --lab-start-offset: 0px;
    scroll-padding-left: 0;
  }

  .lab-pool-layout--press {
    display: block;
  }

  .lab-words-layout__aside {
    padding-top: 0;
    border-top: 1px solid
      color-mix(in srgb, var(--color-text) 14%, transparent);
  }

  .lab-slider--aperture .lab-item--shows .lab-caption--stack {
    padding: 0.8rem var(--mid-padding) var(--mid-padding);
  }

  :deep(.lab-transport) {
    padding-top: var(--mid-padding);
  }
}

@media screen and (min-width: 600px) and (max-width: 900px) {
  .lab-slider--pool.lab-slider--aperture {
    --lab-item-width: 48vw;
  }
}
</style>
