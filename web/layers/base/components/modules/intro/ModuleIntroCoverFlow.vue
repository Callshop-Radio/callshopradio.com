<script setup lang="ts">
import {
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	toRef,
	watch,
} from "vue";

// useIntroCoverFlow is provided by Nuxt auto-import (layers/base/composables).

const props = withDefaults(
	defineProps<{
		items: Array<{ _id?: string }>;
		navLabel?: string;
		equalizeCardHeights?: boolean;
		/** Content area — drives accent color for dots and arrow hover */
		area?: "show" | "pool" | "words";
	}>(),
	{
		navLabel: "Slide",
		equalizeCardHeights: false,
		area: "show",
	},
);

const stageRef = ref<HTMLElement | null>(null);
const itemsRef = toRef(props, "items");
const uniformCardHeight = ref<number | null>(null);

let resizeObserver: ResizeObserver | null = null;

const {
	currentIndex,
	isAnimating,
	total,
	cardStyle,
	getVisualOffset,
	scrollNext,
	scrollPrev,
	scrollTo,
} = useIntroCoverFlow(itemsRef, stageRef);

function measureUniformCardHeight() {
	if (!props.equalizeCardHeights || !stageRef.value) return;

	nextTick(() => {
		requestAnimationFrame(() => {
			const wraps = stageRef.value?.querySelectorAll<HTMLElement>(
				".cover-flow__card-wrap",
			);
			if (!wraps?.length) return;

			let maxHeight = 0;
			wraps.forEach((wrap) => {
				const card = wrap.firstElementChild as HTMLElement | null;
				if (!card) return;
				maxHeight = Math.max(maxHeight, card.offsetHeight);
			});

			uniformCardHeight.value =
				maxHeight > 0 ? Math.ceil(maxHeight) : uniformCardHeight.value;
		});
	});
}

const stageStyle = computed(() => {
	if (!props.equalizeCardHeights || !uniformCardHeight.value) return undefined;

	return {
		"--cover-flow-uniform-height": `${uniformCardHeight.value}px`,
		minHeight: `${uniformCardHeight.value / 16 + 2}rem`,
	};
});

watch(
	() => props.items,
	() => {
		uniformCardHeight.value = null;
		measureUniformCardHeight();
	},
	{ deep: true },
);

onMounted(() => {
	measureUniformCardHeight();

	if (!props.equalizeCardHeights || !stageRef.value) return;

	resizeObserver = new ResizeObserver(() => measureUniformCardHeight());
	resizeObserver.observe(stageRef.value);

	stageRef.value.querySelectorAll(".cover-flow__card-wrap").forEach((wrap) => {
		resizeObserver?.observe(wrap);
	});
});

onUnmounted(() => {
	resizeObserver?.disconnect();
});
</script>

<template>
	<div
		v-if="total > 0"
		class="intro-cover-flow"
		:class="`intro-cover-flow--${area}`"
	>
		<div class="cover-flow">
			<button
				v-if="total > 1"
				class="cover-flow__arrow cover-flow__arrow--prev"
				type="button"
				:aria-label="`Vorheriger ${navLabel}`"
				:disabled="isAnimating"
				@click="scrollPrev"
			>
				<svg
					width="22"
					height="20"
					viewBox="0 0 22 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z"
						fill="currentColor"
					/>
				</svg>
			</button>

			<div
				ref="stageRef"
				class="cover-flow__stage"
				:class="{ 'cover-flow__stage--uniform': equalizeCardHeights }"
				:style="stageStyle"
			>
				<div
					v-for="(item, index) in items"
					:key="item._id"
					class="cover-flow__card-wrap"
					:style="cardStyle(index)"
					:data-offset="getVisualOffset(index)"
				>
					<slot
						:item="item"
						:index="index"
						:media-active="Math.abs(getVisualOffset(index)) <= 1"
					/>
				</div>
			</div>

			<button
				v-if="total > 1"
				class="cover-flow__arrow cover-flow__arrow--next"
				type="button"
				:aria-label="`Nächster ${navLabel}`"
				:disabled="isAnimating"
				@click="scrollNext"
			>
				<svg
					width="22"
					height="20"
					viewBox="0 0 22 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z"
						fill="currentColor"
					/>
				</svg>
			</button>
		</div>

		<nav
			v-if="total > 1"
			class="cover-flow__dots"
			:aria-label="`${navLabel} Navigation`"
		>
			<button
				v-for="(_, index) in items"
				:key="index"
				type="button"
				:class="['cover-flow__dot', { 'is-selected': index === currentIndex }]"
				:aria-label="`${navLabel} ${index + 1}`"
				:aria-current="index === currentIndex ? 'true' : undefined"
				:disabled="isAnimating"
				@click="scrollTo(index)"
			/>
		</nav>
	</div>
</template>

<style lang="postcss" scoped>
.intro-cover-flow {
  --cover-flow-card-width: 27rem;
  --cover-flow-arrow-gutter: 2.5rem;
  --cover-flow-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --cover-flow-accent: var(--color-pink);

  &--pool {
    --cover-flow-accent: var(--color-blue);
  }

  &--words {
    --cover-flow-accent: var(--color-green);
  }

  &--show {
    --cover-flow-accent: var(--color-pink);
  }

  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--small-margin) 0 var(--base-margin);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cover-flow {
  position: relative;
  width: 100%;
  padding-inline: var(--cover-flow-arrow-gutter);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-flow__stage {
  position: relative;
  width: 100%;
  min-height: 34rem;
  overflow: visible;
  touch-action: pan-y;
}

.cover-flow__card-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cover-flow-card-width);
  transform-origin: center center;
  backface-visibility: hidden;
  transition:
    transform 0.72s var(--cover-flow-ease),
    opacity 0.72s var(--cover-flow-ease),
    filter 0.6s var(--cover-flow-ease);
}

.cover-flow__arrow {
  position: absolute;
  top: 50%;
  z-index: 10;
  background: transparent;
  color: var(--color-text);
  transform: translateY(-50%);
  padding: var(--small-padding);
  transition: color var(--transition-fast);

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  svg path {
    fill: currentColor;
    transition: fill var(--transition-fast);
  }

  &:hover:not(:disabled) {
    @media (min-width: 1024px) {
      color: var(--cover-flow-accent);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  &--prev {
    left: 0;
  }

  &--next {
    right: 0;
  }
}

.cover-flow__dots {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: var(--small-padding);
  margin-top: var(--base-margin);
  padding-top: var(--mid-padding);
}

.cover-flow__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background-color: var(--color-grey);
  transition: background-color var(--transition-fast);

  &.is-selected {
    background-color: var(--cover-flow-accent);
  }

  &:hover:not(:disabled) {
    @media (min-width: 1024px) {
      background-color: var(--cover-flow-accent);
    }
  }

  &:disabled {
    cursor: default;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-flow__card-wrap {
    transition: none;
  }
}

@media screen and (max-width: 900px) {
  .intro-cover-flow {
    --cover-flow-card-width: min(17.5rem, 72vw);
    --cover-flow-arrow-gutter: 0.25rem;
    padding-inline: 0;
  }

  .cover-flow__stage {
    min-height: 26rem;
  }

  .cover-flow__arrow {
    padding: 0.125rem;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }
}
</style>
