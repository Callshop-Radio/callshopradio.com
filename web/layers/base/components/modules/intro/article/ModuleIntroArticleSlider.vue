<script setup lang="ts">
import { useSwipe } from "@vueuse/core";
import { computed, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";

const _mainStore = useMainStore();

const props = defineProps({
	articles: {
		type: Array,
		required: true,
	},
});

function hasTeaserText(article: {
	useTeaserText?: boolean;
	textTeaser?: unknown[];
}) {
	return Boolean(article?.useTeaserText && article?.textTeaser?.length);
}

// State
const currentIndex = ref(0);
const sliderRef = ref<HTMLElement | null>(null);

// Slides
const slides = computed(() => {
	return props.articles
		.filter((article) => hasTeaserText(article))
		.map((article) => [article]);
});

// Navigation
const scrollNext = () => {
	currentIndex.value = (currentIndex.value + 1) % slides.value.length;
};

const scrollPrev = () => {
	currentIndex.value =
		(currentIndex.value - 1 + slides.value.length) % slides.value.length;
};

const scrollTo = (index: number) => {
	currentIndex.value = index;
};

// Swipe Support
const { isSwiping: _isSwiping, direction: _direction } = useSwipe(sliderRef, {
	threshold: 60,
	onSwipeEnd(_e, direction) {
		if (direction === "left") scrollNext();
		if (direction === "right") scrollPrev();
	},
});
</script>

<template>
	<div
		v-if="slides.length > 0"
		:class="`intro-article-slider intro-article-slider--default`"
	>
		<!-- Slides -->
		<div ref="sliderRef" class="slider-content">
			<div
				v-for="(articleGroup, index) in slides"
				:key="index"
				class="slide"
				:class="{ active: index === currentIndex }"
			>
				<div class="article-group">
					<ModuleIntroArticle
						v-for="(article, articleIndex) in articleGroup"
						:key="article._key || articleIndex"
						:article="article"
						:class="`slider-item slider-item--default`"
					/>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<div v-if="slides.length > 1" class="slider__nav__container">
			<nav class="slider__nav">
				<button
					class="slider__arrow slider__arrow--prev"
					aria-label="Vorheriger Slide"
					@click="scrollPrev"
				>
					<svg
						width="22"
						height="20"
						viewBox="0 0 22 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z"
							fill="black"
						/>
					</svg>
				</button>

				<div class="slider__nav__dots">
					<button
						v-for="(_, index) in slides"
						:key="index"
						:class="['slider__dot', { 'is-selected': index === currentIndex }]"
						:aria-label="`Slide ${index + 1}`"
						@click="scrollTo(index)"
					/>
				</div>

				<button
					class="slider__arrow slider__arrow--next"
					aria-label="Nächster Slide"
					@click="scrollNext"
				>
					<svg
						width="22"
						height="20"
						viewBox="0 0 22 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z"
							fill="black"
						/>
					</svg>
				</button>
			</nav>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.intro-article-slider {
  @apply overflow-visible;
  max-width: clamp(100%, 100%, var(--page-max-width));
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--mid-padding);

  &__header {
    padding: 0 calc(var(--big-margin) / 2);
    margin-bottom: var(--small-margin);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .slider__nav__container {
    width: 100%;
    height: auto;
    position: relative;
    z-index: 10;

    @media (max-width: 900px) {
      padding: 0 var(--base-padding);
    }

    @media (min-width: 901px) {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      pointer-events: none;
    }

    .slider__nav {
      width: 100%;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--mid-padding);
      pointer-events: auto;

      @media (max-width: 900px) {
        position: static;
        min-width: unset;
        padding: var(--small-padding) var(--mid-padding);
        background-color: var(--color-bg);
        border-radius: 100px;
        border: 0.0625rem solid var(--color-text);
      }

      @media (min-width: 901px) {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        min-width: var(--page-max-width);
        width: var(--page-max-width);
        max-width: 100%;
        height: 100%;
        padding: 0 var(--big-padding);
        pointer-events: none;
      }

      .slider__arrow {
        background-color: transparent;
        pointer-events: all;
        flex-shrink: 0;

        @media (max-width: 900px) {
          transform: none;
        }

        @media (min-width: 901px) {
          transform: translate(0, calc(var(--base-margin) * -1));
        }

        svg {
          @apply w-5 h-5;

          &:hover {
            path {
              @media (min-width: 1024px) {
                fill: var(--color-green);
              }
            }
          }

          path {
            @media (max-width: 900px) {
              fill: var(--color-text);
            }

            @media (min-width: 901px) {
              fill: var(--color-bg);
            }
          }
        }

        &:focus {
          @apply outline-none ring-2 ring-black ring-opacity-50;
        }
      }

      .slider__nav__dots {
        @apply flex row items-center justify-center flex-grow-1;
        gap: 0 var(--small-padding);
        pointer-events: all;

        @media (max-width: 900px) {
          position: static;
          top: auto;
          left: auto;
        }

        @media (min-width: 901px) {
          position: absolute;
          top: var(--big-padding);
          left: var(--big-padding);
          width: max-content;
          flex-grow: 0;
          justify-content: flex-start;
        }

        .slider__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);

          &.is-selected {
            background-color: var(--color-green);
          }

          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-green);
            }
          }
        }
      }
    }
  }

  /* Slider Logic (Grid Overlay) */
  .slider-content {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    width: 100%;
    position: relative;
    touch-action: pan-y pinch-zoom;
    user-select: none;
  }

  .slide {
    @apply flex flex-row w-full;
    grid-area: 1 / 1 / 2 / 2;
    width: 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease; /* Gentle transition */
    z-index: 1;

    &.active {
      opacity: 1;
      pointer-events: auto;
      z-index: 2;
    }

    .article-group {
      @apply flex flex-row w-full;
      flex-flow: row wrap;
      justify-content: space-around;
      justify-self: center;
      align-items: flex-end;
      gap: var(--big-margin);
      height: 100%;
      @media (min-width: 1800px) {
        gap: 0;
      }
    }

    .article-group .slider-item {
      @apply flex-1;
      min-width: 0;
      height: 100%;
    }
  }
}

/* Specific styles for the different slider variants */
.slider-item {
  &--default {
    ::v-deep(.article-content) {
      margin: 0; /* Remove the component's default margins within the slider */
    }
  }

  &--grid {
    ::v-deep(.article-content) {
      .article-container {
        width: 100%;
        max-width: 100%;
      }
    }
  }

  &--compact {
    ::v-deep(.article-content) {
      .article-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        max-width: 100%;

        .article-media {
          width: 35%;
          min-width: 150px;

          .article-image {
            aspect-ratio: 1/1;
          }
        }

        .article-info {
          width: 65%;
          border-bottom: none;
          border-left: 0.0625rem solid var(--color-text);
        }
      }
    }
  }
}
</style>