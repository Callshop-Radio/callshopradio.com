<script setup lang="ts">
import { ref, computed } from "vue";
import { useSwipe } from "@vueuse/core";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const props = defineProps({
  articles: {
    type: Array,
    required: true,
  },
});

// State
const currentIndex = ref(0);
const sliderRef = ref<HTMLElement | null>(null);

// Slides
const slides = computed(() => {
  // Jeder Artikel bekommt sein eigenes Slide
  return props.articles.map((article) => [article]);
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
const { isSwiping, direction } = useSwipe(sliderRef, {
  onSwipeEnd(e, direction) {
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
    <!-- Navigation Overlay -->
    <div class="slider__nav__container">
      <nav class="slider__nav" v-if="slides.length > 1">
        <button
          class="slider__arrow slider__arrow--prev"
          @click="scrollPrev"
          aria-label="Vorheriger Slide"
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
            @click="scrollTo(index)"
          ></button>
        </div>
        <!-- Arrow Navigation -->
        <button
          class="slider__arrow slider__arrow--next"
          @click="scrollNext"
          aria-label="Nächster Slide"
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
  </div>
</template>

<style lang="postcss" scoped>
.intro-article-slider {
  @apply overflow-visible;
  max-width: clamp(100%, 100%, var(--page-max-width));
  position: relative;
  padding: var(--mid-margin) 0 var(--base-margin) 0;

  &__header {
    padding: 0 calc(var(--big-margin) / 2);
    margin-bottom: var(--small-margin);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .slider__nav__container {
    width: 100%;
    height: 100%;
    .slider__nav {
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: var(--page-max-width);
      padding: 0 var(--big-padding);
      width: var(--page-max-width);
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      pointer-events: none;

      .slider__arrow {
        background-color: transparent;
        transform: translate(0, calc(var(--base-margin) * -1));
        pointer-events: all;

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
            fill: var(--color-bg);
          }
        }

        &:focus {
          @apply outline-none ring-2 ring-black ring-opacity-50;
        }
      }

      .slider__nav__dots {
        position: absolute;
        @apply flex row items-center justify-start flex-grow-1;
        gap: 0 var(--small-padding);
        width: max-content;
        top: var(--big-padding);
        left: var(--big-padding);

        .slider__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);
          pointer-events: all;

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
    /* max-width: calc(var(--page-max-width)); */
    width: 100%;
    position: relative;
    /* overflow: hidden; Not strictly needed if grid handles content */
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

/* Spezifische Stile für die verschiedenen Slider-Varianten */
.slider-item {
  &--default {
    ::v-deep(.article-content) {
      margin: 0; /* Entferne die Standardränder der Komponente im Slider */
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