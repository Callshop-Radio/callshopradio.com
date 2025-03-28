<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { ref, onMounted, computed } from "vue";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const props = defineProps({
  poolItems: {
    type: Array,
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

// Verwende die Pool-Items aus den Props
const slides = computed(() => {
  const result = [];
  // Gruppiere Pool-Items in Paare (2 pro Slide)
  for (let i = 0; i < props.poolItems.length; i += 2) {
    const pair = [props.poolItems[i]];
    // Füge das zweite Pool-Item hinzu, wenn verfügbar
    if (i + 1 < props.poolItems.length) {
      pair.push(props.poolItems[i + 1]);
    }
    result.push(pair);
  }
  return result;
});
</script>

<template>
  <div
    v-if="slides.length > 0"
    :class="`embla intro-pool-slider intro-pool-slider--default`"
  >
    <div class="embla__nav__container">
      <nav class="embla__nav" v-if="scrollSnaps.length > 1">
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

        <div class="embla__nav__dots">
          <button
            v-for="(_, index) in scrollSnaps"
            :key="index"
            :class="['embla__dot', { 'is-selected': index === selectedIndex }]"
            @click="scrollTo(index)"
          ></button>
        </div>
        <!-- Arrow Navigation -->
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
      </nav>
    </div>

    <div ref="emblaNode" class="embla">
      <div ref="emblaContainer" class="embla__container">
        <div
          v-for="(poolGroup, index) in slides"
          :key="index"
          class="embla__slide"
          :class="{ active: index === currentIndex }"
        >
          <div class="pool-group">
            <ModuleIntroPool
              v-for="(poolItem, itemIndex) in poolGroup"
              :key="poolItem._id || itemIndex"
              :poolItem="poolItem"
              :class="`slider-item slider-item--default`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.intro-pool-slider {
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

  .embla__nav__container {
    width: 100%;
    height: 100%;
    .embla__nav {
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: var(--page-max-width);
      width: var(--page-max-width);
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      pointer-events: none;

      .embla__arrow {
        background-color: transparent;
        transform: translate(0, calc(var(--base-margin) * -1));
        pointer-events: all;

        svg {
          @apply w-5 h-5;
          &:hover {
            path {
              @media (--desktop-up) {
                fill: var(--color-pink);
              }
            }
          }
          path {
            fill: var(--color-text);
          }
        }

        &:focus {
          @apply outline-none ring-2 ring-black ring-opacity-50;
        }
      }

      .embla__nav__dots {
        position: absolute;
        @apply flex row items-center justify-start flex-grow-1;
        gap: 0 var(--small-padding);
        width: max-content;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);

        .embla__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);
          pointer-events: all;

          &.is-selected {
            background-color: var(--color-pink);
          }

          &:hover {
            @media (--desktop-up) {
              background-color: var(--color-pink);
            }
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
      transition: opacity 0.15s ease !important;

      .pool-group {
        @apply flex flex-row w-full;
        flex-flow: row wrap;
        justify-self: center;
        align-items: flex-end;
        gap: var(--big-margin);
      }

      .pool-group .slider-item {
        @apply flex-1;
        min-width: 0;
      }

      &.active {
        opacity: 1;
        transition: opacity 1.5s ease !important;
      }
    }
  }
}

/* Spezifische Stile für die verschiedenen Slider-Varianten */
.slider-item {
  &--default {
    ::v-deep(.pool-content) {
      margin: 0; /* Entferne die Standardränder der Komponente im Slider */
    }
  }

  &--grid {
    ::v-deep(.pool-content) {
      .pool-container {
        width: 100%;
        max-width: 100%;
      }
    }
  }

  &--compact {
    ::v-deep(.pool-content) {
      .pool-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        max-width: 100%;

        .pool-media {
          width: 35%;
          min-width: 150px;

          .pool-image {
            aspect-ratio: 1/1;
          }
        }

        .pool-info {
          width: 65%;
          border-bottom: none;
          border-left: 0.0625rem solid var(--color-text);
        }
      }
    }
  }
}
</style>