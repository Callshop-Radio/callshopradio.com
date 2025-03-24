<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { ref, onMounted, computed } from "vue";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

// Init Embla Carousel
const [emblaNode, emblaApi] = emblaCarouselVue({
  align: "start",
  loop: true,
});

// Dots nav
const selectedIndex = ref(0);
// Aktuelle Slide-Position
const currentIndex = ref(0);
const scrollSnaps = ref<number[]>([]);

// Save position for smooth transitions
const saveTranslatePositions = useThrottleFn(() => {
  if (!emblaContainer.value) return;
  containerStyle = emblaContainer.value.style.transform;
}, 100);

const emblaContainer = ref<HTMLElement>();
let containerStyle: string = "";

async function restoreTranslatePositions() {
  if (!emblaContainer.value) return;
  emblaContainer.value.style.transform = containerStyle;
}

// Dots functions
const onSelect = () => {
  if (!emblaApi.value) return;
  selectedIndex.value = emblaApi.value.selectedScrollSnap();
  currentIndex.value = selectedIndex.value; // Aktualisiere currentIndex, wenn sich der Slide ändert
};

const scrollTo = (index: number) => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollTo(index);
  currentIndex.value = index; // Aktualisiere currentIndex beim manuellen Scrollen
};

const scrollPrev = () => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollPrev();
};

const scrollNext = () => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollNext();
};

const setupDots = () => {
  if (!emblaApi.value) return;

  // Scroll snaps für Navigation
  scrollSnaps.value = emblaApi.value.scrollSnapList();

  // Set current index
  selectedIndex.value = emblaApi.value.selectedScrollSnap();
  currentIndex.value = selectedIndex.value; // Initialisiere currentIndex

  // Event-Listener für Aktualisierung des ausgewählten Index
  emblaApi.value.on("select", onSelect);
};

// Event-Listener nach dem Mounting
onMounted(() => {
  if (emblaApi.value) {
    emblaApi.value.on("scroll", saveTranslatePositions);
    emblaApi.value.on("destroy", restoreTranslatePositions);

    setupDots();
  }
});

// Verwende direkt die Slides aus dem Modul
const slides = computed(() => {
  return props.module?.slides || [];
});
</script>

<template>
  <div
    v-if="module && slides.length > 0"
    :class="`embla module-hero module-hero--${module.style || 'default'}`"
  >
    <div class="module-hero__header" v-if="module.title">
      <h3 class="module-hero__title">
        {{ module.title }}
      </h3>
    </div>
    <div class="embla__nav__container">
      <nav class="embla__nav">
        <!-- Arrow Navigation -->
        <div class="embla__nav__arrows" v-if="scrollSnaps.length > 1">
          <button
            class="embla__arrow embla__arrow--prev"
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
          <!-- Dot Navigation -->
          <div class="embla__nav__dots" v-if="scrollSnaps.length > 1">
            <button
              v-for="(_, index) in scrollSnaps"
              :key="index"
              :class="[
                'embla__dot',
                { 'is-selected': index === selectedIndex },
              ]"
              @click="scrollTo(index)"
            ></button>
          </div>
          <button
            class="embla__arrow embla__arrow--next"
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
        </div>
      </nav>
    </div>
    <div class="graphics-behind">
      <AnimatedGradient class="animated-gradient" />
      <AnimatedLogoBackground class="animated-logo-background" />
    </div>
    <div ref="emblaNode" class="embla">
      <div ref="emblaContainer" class="embla__container">
        <div
          v-for="(slide, index) in slides"
          :key="slide._key || index"
          class="embla__slide"
          :class="{ active: index === currentIndex }"
        >
          <!-- Verwende die ModuleHeroEntry-Komponente für jeden Slide -->
          <ModuleHeroEntry
            :module="slide"
            :class="`slider-item slider-item--${
              module.style || slide.layout || 'default'
            }`"
          />
        </div>
      </div>
    </div>
    <div class="graphics-front">
      <AnimatedLogo class="animated-logo" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.module-hero {
  @apply overflow-visible;
  max-width: clamp(100%, 100%, var(--page-max-width));
  position: relative;

  &__title {
    @apply text-2xl font-bold mb-4;
  }

  &__header {
    padding: 0 calc(var(--big-margin) / 2);
    margin-bottom: var(--small-margin);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .graphics-behind {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    .animated-logo-background {
      width: 575px;
      height: 415px;
      position: absolute;
      right: calc(var(--big-margin) * 2);
      top: calc(35.3125rem - var(--big-margin)* 2 + var(--mid-margin) + 0.625rem);
      transform: translate(33%,-100%);
      z-index: 0;
    }
    .animated-gradient {
      position: absolute;
      top: -33%;
      left: -45%;
      width: 110%;
      height: 110%;
    }
  }
  .graphics-front {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    .animated-logo {
      width: 575px;
      height: 415px;
      position: absolute;
      right: calc(var(--big-margin) * 2);
      top: calc(35.3125rem - var(--big-margin)* 2 + var(--mid-margin) + var(--menu-text-size) / 2);
      transform: translate(33%,-100%);
      z-index: 0;
    }
  }

  .embla__nav__container {
    width: 100%;
    height: 100%;
    position: relative;
    .embla__nav {
      @apply flex row items-center justify-space-between;
      position: absolute;
      top: calc(35.3125rem - var(--big-margin) * 2);
      right: var(--big-margin);
      padding: var(--mid-padding);
      width: max-content;
      background-color: var(--color-bg);
      border-radius: 100px;
      border: 0.0625rem solid var(--color-text);
      shape-rendering: crispEdges;
      z-index: 10;

      .embla__nav__arrows {
        @apply flex;
        gap: 0 var(--mid-margin);
        margin: 0;

        .embla__arrow {
          @apply flex items-center justify-center rounded-full transition-colors;
          background-color: transparent;

          svg {
            @apply w-5 h-5;
            path {
              fill: var(--color-text);
            }
          }

          &:focus {
            @apply outline-none ring-2 ring-black ring-opacity-50;
          }
        }
      }

      .embla__nav__dots {
        @apply flex row items-center justify-start flex-grow-1;
        gap: 0 var(--small-padding);

        .embla__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);

          &.is-selected {
            background-color: var(--color-text);
          }

          &:hover {
            @apply bg-gray-400;
          }
        }
      }
    }
  }

  /* Basis-Styles für den Embla Carousel */
  .embla {
    @apply overflow-hidden;
    max-width: calc(var(--page-max-width));
    width: calc(var(--page-max-width));
    position: relative;

    &__container {
      @apply flex backface-hidden touch-pan-y;
    }

    &__slide {
      @apply flex flex-grow-0 flex-shrink-0 flex-basis-auto min-w-0 relative;
      width: 100%; /* Jeder Slide nimmt volle Breite ein */
      padding: 0 calc(var(--big-margin) / 2);
      opacity: 0;
      transition: opacity .15s ease !important;

      &.active {
        opacity: 1;
        transition: opacity 1.5s ease !important;
      }
    }
  }
}

/* Spezifische Stile für die integrierten ModuleHeroEntry-Komponenten */
.slider-item {
  &--default {
    ::v-deep(.module-hero-entry) {
      margin: 0; /* Entferne die Standardränder der Komponente im Slider */
    }
  }

  &--cards {
    ::v-deep(.hero-entry-image) {
      aspect-ratio: 16 / 9 !important;
      object-fit: cover;
    }
  }

  &--thumbnails {
    ::v-deep(.module-hero-entry) {
      .hero-entry-container {
        display: flex;
        flex-direction: column;
      }

      .hero-entry-media {
        .hero-entry-image {
          aspect-ratio: 16 / 9 !important;
          object-fit: cover;
        }
      }

      .hero-entry-content {
        gap: 0;
        flex-grow: 1;
      }
    }
  }

  &--image {
    ::v-deep(.module-hero-entry) {
      .hero-entry-container {
        position: relative;
      }

      .hero-entry-media {
        .hero-entry-image {
          width: 100%;
          aspect-ratio: 16 / 9 !important;
          object-fit: cover;
        }
      }

      .hero-entry-content {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 50%;
        padding: var(--big-margin);
        background-color: rgba(var(--color-bg-rgb), 0.75);
        backdrop-filter: blur(10px);

        @media (max-width: 768px) {
          width: 100%;
        }
      }
    }
  }
}
</style>