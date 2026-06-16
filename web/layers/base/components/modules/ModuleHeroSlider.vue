<script setup lang="ts">
import { useSwipe } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const props = defineProps({
	module: {
		type: Object,
		required: true,
	},
});

// State
const currentIndex = ref(0);
const sliderRef = ref<HTMLElement | null>(null);

// Slides
const slides = computed(() => {
	return props.module?.slides || [];
});

// Navigation
const scrollNext = () => {
	if (slides.value.length === 0) return;
	currentIndex.value = (currentIndex.value + 1) % slides.value.length;
};

const scrollPrev = () => {
	if (slides.value.length === 0) return;
	currentIndex.value =
		(currentIndex.value - 1 + slides.value.length) % slides.value.length;
};

const scrollTo = (index: number) => {
	currentIndex.value = index;
};

// Swipe Support
const { isSwiping: _isSwiping, direction: _direction } = useSwipe(sliderRef, {
	onSwipeEnd(e, direction) {
		if (direction === "left") scrollNext();
		if (direction === "right") scrollPrev();
	},
});

// Funktion zum Aktualisieren des aktuellen Content-Typs im Store
const updateCurrentContentType = () => {
	if (
		!slides.value ||
		slides.value.length === 0 ||
		currentIndex.value >= slides.value.length
	)
		return;

	const currentSlide = slides.value[currentIndex.value];
	const contentType = currentSlide?.contentReference?._type || "";

	// Aktualisiere den Content-Typ im Store
	mainStore.setCurrentHeroContentType(contentType);
};

// Überwache Änderungen des currentIndex und aktualisiere den Content-Typ
watch(currentIndex, () => {
	updateCurrentContentType();
});

// Initial update
onMounted(() => {
	updateCurrentContentType();
});
</script>

<template>
	<div
		v-if="module && slides.length > 0"
		:class="`module-hero module-hero--${module.style || 'default'} ${
			mainStore.currentHeroContentType
		}`"
	>
		<div v-if="module.title" class="module-hero__header">
			<h3 class="module-hero__title">
				{{ module.title }}
			</h3>
		</div>
    
		<div class="slider__nav__container">
			<nav class="slider__nav">
				<!-- Arrow Navigation -->
				<div v-if="slides.length > 1" class="slider__nav__arrows">
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
          
					<!-- Dot Navigation -->
					<div class="slider__nav__dots">
						<button
							v-for="(_, index) in slides"
							:key="index"
							:class="['slider__dot', { 'is-selected': index === currentIndex }]"
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
				</div>
			</nav>
		</div>

		<div class="graphics-behind" :class="mainStore?.currentHeroContentType">
			<AnimatedGradient
				class="animated-gradient"
				:type="mainStore?.currentHeroContentType"
			/>
			<AnimatedLogoBackground class="animated-logo-background" />
		</div>

		<!-- Slider Content -->
		<div ref="sliderRef" class="slider-content">
			<div
				v-for="(slide, index) in slides"
				:key="slide._key || index"
				class="slide"
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

  @media screen and (max-width: 1099px) {
    margin-top: var(--base-margin);
    padding-bottom: var(--mid-padding);
  }

  &__title {
    @apply text-2xl font-bold mb-4;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--small-margin);
    
    /* Mobile: Kompakteres Padding */
    padding: 0 var(--mid-margin);
    
    /* Tablet/Desktop: Standard Padding */
    @media screen and (min-width: 600px) {
      padding: 0 calc(var(--big-margin) / 2);
    }
  }

  .graphics-behind {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    &.venue,
    &.person {
      .animated-gradient {
        position: absolute;
        
        /* Mobile: Zentriert für venue/person */
        top: 30%;
        left: -25%;
        width: 190%;
        height: 190%;
        opacity: 0.85;
        
        /* Tablet: Zentriert mit mehr Coverage */
        @media screen and (min-width: 600px) and (max-width: 1100px) {
          top: 15%;
          left: -35%;
          width: 200%;
          height: 200%;
          opacity: 0.9;
        }
        
        /* Desktop: Original Position */
        @media screen and (min-width: 1100px) {
          top: -60%;
          left: -15%;
          width: 140%;
          height: 140%;
          opacity: 1;
        }
      }
    }
    .animated-logo-background {
      position: absolute;
      z-index: 0;
      
      /* Mobile: Zentriert hinter dem Bild */
      width: 140svw;
      height: 60svh;
      left: 50%;
      top: 40svw;
      transform: translate(-50%, -50%);
      opacity: 0.8;
      
      /* Tablet: Zentriert mit mehr Platz */
      @media screen and (min-width: 600px) and (max-width: 1100px) {
        width: 150svw;
        height: 65svh;
        left: 50%;
        top: 30svw;
        transform: translate(-50%, -50%);
        opacity: 0.85;
      }
      
      /* Desktop: Original Position */
      @media screen and (min-width: 1100px) {
        width: 575px;
        height: 415px;
        right: calc(var(--big-margin) * 2);
        left: auto;
        top: calc(
          35.3125rem - var(--big-margin) * 2 + var(--mid-margin) + 0.625rem
        );
        transform: translate(33%, -100%);
        opacity: 1;
      }
    }
    .animated-gradient {
      position: absolute;
      transition: width 0.5s ease, height 0.5s ease, top 0.5s ease,
        left 0.5s ease;
      
      /* Mobile: Zentriert hinter dem Content */
      top: 30%;
      left: -20%;
      width: 180%;
      height: 180%;
      opacity: 0.85;
      
      /* Tablet: Zentrierter mit mehr Coverage */
      @media screen and (min-width: 600px) and (max-width: 1100px) {
        top: 20%;
        left: -30%;
        width: 190%;
        height: 190%;
        opacity: 0.9;
      }
      
      /* Desktop: Original Position */
      @media screen and (min-width: 1100px) {
        top: -33%;
        left: -45%;
        width: 110%;
        height: 110%;
        opacity: 1;
      }
    }
  }
  .graphics-front {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    .animated-logo {
      position: absolute;
      z-index: 0;
      
      /* Mobile: Zentriert hinter dem Bild */
      width: 140svw;
      height: 60svh;
      left: 50%;
      top: 40svw;
      transform: translate(-50%, -50%);
      opacity: 0.8;
      
      /* Tablet: Zentriert mit mehr Platz */
      @media screen and (min-width: 600px) and (max-width: 1100px) {
        width: 150svw;
        height: 65svh;
        left: 50%;
        top: 30svw;
        transform: translate(-50%, -50%);
        opacity: 0.85;
      }
      
      /* Desktop: Original Position */
      @media screen and (min-width: 1100px) {
        width: 575px;
        height: 415px;
        right: calc(var(--big-margin) * 2);
        left: auto;
        top: calc(
          35.3125rem - var(--big-margin) * 2 + var(--mid-margin) + 0.625rem
        );
        transform: translate(33%, -100%);
        opacity: 1;
      }
    }
  }

  .slider__nav__container {
    width: 100%;
    height: 100%;
    position: relative;

    @media screen and (max-width: 1099px) {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: var(--mid-padding);
      z-index: 20;
      pointer-events: none;
      height: auto;
    }
    
    .slider__nav {
      @apply flex row items-center justify-space-between;
      padding: var(--mid-padding);
      background-color: var(--color-bg);
      border-radius: 100px;
      border: 0.0625rem solid var(--color-text);
      shape-rendering: crispEdges;
      z-index: 10;
      
      @media screen and (max-width: 600px) {
        position: absolute;
        top: auto;
        bottom: 0;
        left: 50%;
        right: auto;
        width: calc(100% - var(--page-gutter) * 2 - var(--mid-margin) * 2);
        max-width: none;
        transform: translate(-50%, 50%);
        pointer-events: auto;
      }

      @media screen and (min-width: 601px) and (max-width: 1099px) {
        position: absolute;
        top: auto;
        bottom: 0;
        left: calc(var(--page-gutter) + var(--big-margin) / 2);
        right: auto;
        width: max-content;
        max-width: calc(100% - var(--page-gutter) * 2 - var(--big-margin));
        transform: translateY(50%);
        pointer-events: auto;
      }
      
      @media screen and (min-width: 1100px) {
        position: absolute;
        top: calc(35.3125rem - var(--big-margin) * 2);
        right: var(--big-margin);
        width: max-content;
      }

      .slider__nav__arrows {
        @apply flex row items-center;
        margin: 0;
        
        /* Mobile: Full-width mit space-between */
        @media screen and (max-width: 600px) {
          width: 100%;
          justify-content: space-between;
          gap: 0;
        }
        
        /* Tablet/Desktop: Kompakte Anordnung */
        @media screen and (min-width: 601px) {
          gap: 0 var(--mid-margin);
          justify-content: center;
        }

        .slider__arrow {
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

      .slider__nav__dots {
        @apply flex row items-center justify-center;
        gap: 0 var(--small-padding);

        @media screen and (max-width: 600px) {
          flex-grow: 1;
        }

        .slider__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);

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

  /* Slider Logic (Grid Overlay) */
  .slider-content {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    width: 100%;
    position: relative;

    @media screen and (max-width: 900px) {
      z-index: 1;
    }
  }

  .slide {
    @apply flex w-full;
    grid-area: 1 / 1 / 2 / 2;
    width: 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
    z-index: 1;

    &.active {
      opacity: 1;
      pointer-events: auto;
      z-index: 2;
    }

    /* Mobile: Column Layout, kompaktes Padding */
    @media screen and (max-width: 600px) {
      flex-flow: column wrap;
      align-items: stretch;
      justify-content: flex-start;
      padding: 0 var(--mid-margin);
    }
    
    /* Tablet: Column Layout mit mehr Spacing */
    @media screen and (min-width: 601px) and (max-width: 1100px) {
      flex-flow: column wrap;
      align-items: center;
      justify-content: flex-start;
      padding: 0 calc(var(--big-margin) / 2);
      gap: var(--mid-margin);
    }
    
    /* Desktop: Row Layout */
    @media screen and (min-width: 1101px) {
      flex-flow: row nowrap;
      align-items: flex-start;
      padding: 0 calc(var(--big-margin) / 2);
    }
  }
}

/* Spezifische Stile für die integrierten ModuleHeroEntry-Komponenten */
.slider-item {
  &--default {
    ::v-deep(.module-hero-entry) {
      margin: 0;
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