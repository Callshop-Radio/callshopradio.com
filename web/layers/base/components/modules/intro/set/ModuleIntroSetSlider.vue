<script setup lang="ts">
import { useThrottleFn } from "@vueuse/core";
import emblaCarouselVue from "embla-carousel-vue";
import { computed, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";

const _mainStore = useMainStore();

const props = defineProps({
	sets: {
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

// Verwende die Sets aus den Props
const slides = computed(() => {
	const result = [];
	// Gruppiere Sets in Paare (2 pro Slide)
	for (let i = 0; i < props.sets.length; i += 2) {
		const pair = [props.sets[i]];
		// Füge das zweite Set hinzu, wenn verfügbar
		if (i + 1 < props.sets.length) {
			pair.push(props.sets[i + 1]);
		}
		result.push(pair);
	}
	return result;
});
</script>

<template>
	<div
		v-if="slides.length > 0"
		:class="`embla intro-set-slider intro-set-slider--default`"
	>
		<div class="embla__nav__container">
			<nav v-if="scrollSnaps.length > 1" class="embla__nav">
				<button
					class="embla__arrow embla__arrow--prev"
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

				<div class="embla__nav__dots">
					<button
						v-for="(_, index) in scrollSnaps"
						:key="index"
						:class="['embla__dot', { 'is-selected': index === selectedIndex }]"
						@click="scrollTo(index)"
					/>
				</div>
				<!-- Arrow Navigation -->
				<button
					class="embla__arrow embla__arrow--next"
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
		<!-- <div class="graphics-behind">
      <AnimatedGradient class="animated-gradient" />
      <AnimatedLogoBackground class="animated-logo-background" />
    </div> -->
		<div ref="emblaNode" class="embla">
			<div ref="emblaContainer" class="embla__container">
				<div
					v-for="(setGroup, index) in slides"
					:key="index"
					class="embla__slide"
					:class="{ active: index === currentIndex }"
				>
					<div class="set-group">
						<ModuleIntroSet
							v-for="(set, setIndex) in setGroup"
							:key="set._key || setIndex"
							:set="set"
							:class="`slider-item slider-item--default`"
						/>
					</div>
				</div>
			</div>
		</div>
		<!-- <div class="graphics-front">
      <AnimatedLogo class="animated-logo" />
    </div> -->
	</div>
</template>

<style lang="postcss" scoped>
.intro-set-slider {
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
      top: calc(
        35.3125rem - var(--big-margin) * 2 + var(--mid-margin) + 0.625rem
      );
      transform: translate(33%, -100%);
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
      top: calc(
        35.3125rem - var(--big-margin) * 2 + var(--mid-margin) +
          var(--menu-text-size) / 2
      );
      transform: translate(33%, -100%);
      z-index: 0;
    }
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
              @media (min-width: 1024px) {
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
            @media (min-width: 1024px) {
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

      .set-group {
        @apply flex flex-row w-full;
        flex-flow: row wrap;
        justify-content: space-around;
        justify-self: center;
        align-items: flex-end;
        gap: var(--big-margin);
        @media (min-width: 1800px){
          gap: 0;
        }
      }

      .set-group .slider-item {
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
    ::v-deep(.set-content) {
      margin: 0; /* Entferne die Standardränder der Komponente im Slider */
    }
  }

  &--grid {
    ::v-deep(.set-content) {
      .set-main {
        width: 100%;
        max-width: 100%;
      }
    }
  }

  &--compact {
    ::v-deep(.set-content) {
      .set-main {
        display: flex;
        flex-direction: row;
        width: 100%;
        max-width: 100%;

        .set-media {
          width: 35%;
          min-width: 150px;

          .track-artwork {
            aspect-ratio: 1/1;
          }
        }

        .set-info {
          width: 65%;
          border-bottom: none;
          border-left: 0.0625rem solid var(--color-text);
        }
      }
    }
  }
}
</style>