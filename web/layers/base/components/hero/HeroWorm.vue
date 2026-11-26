<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
	registerFormWormTarget,
	unregisterFormWormTarget,
} from "../../composables/useFormWorm";

type HeroPage = "shows" | "pool" | "words";

const props = withDefaults(
	defineProps<{
		page: HeroPage;
		shift?: number;
	}>(),
	{ shift: 0 },
);

const wormEl = ref<SVGPathElement | null>(null);

// Same parallax offsets as LabAtmosphere: the foreground worm must sit exactly
// on top of the contour that the atmosphere renders.
const shiftX = computed(() =>
	props.page === "pool" ? 0 : Math.round(props.shift * 3),
);
const shiftY = computed(() =>
	props.page === "pool" ? Math.round(props.shift * 5) : 0,
);

onMounted(() => registerFormWormTarget(wormEl.value));
onUnmounted(() => unregisterFormWormTarget(wormEl.value));
</script>

<template>
	<div
		class="hero-worm"
		:class="`hero-worm--${page}`"
		:style="{
			'--hero-shift-x': `${shiftX}px`,
			'--hero-shift-y': `${shiftY}px`,
		}"
		aria-hidden="true"
	>
		<div class="hero-worm__parallax">
			<svg
				class="hero-worm__shape"
				viewBox="0 0 1000 1000"
				preserveAspectRatio="xMidYMid meet"
				xmlns="http://www.w3.org/2000/svg"
			>
				<!-- Start page: 50 units × (575 / 1113) = 25.83 px. -->
				<path
					ref="wormEl"
					class="hero-worm__path"
					fill="none"
					stroke="currentColor"
					stroke-width="25.83"
					stroke-linecap="round"
					stroke-linejoin="round"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.hero-worm {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: visible;
  pointer-events: none;
  color: var(--lab-accent);

  &__parallax {
    position: absolute;
    inset: 0;
    transform: translate3d(var(--hero-shift-x), var(--hero-shift-y), 0);
    transition: transform 1100ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  &__shape {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(86vh, 86vw);
    height: min(86vh, 86vw);
    overflow: visible;
    color: var(--lab-accent);
    opacity: 1;
    transform: translate(-50%, -50%) translate(14vw, 1vh);
  }

  &--shows &__shape {
    transform: translate(-50%, -50%) translate(14vw, 2vh);
  }

  &--pool &__shape {
    transform: translate(-50%, -50%) translate(16vw, 1vh);
  }

  &--words &__shape {
    /* Matches the atmosphere: a contour sized to the story image, centred on
       it, so the worm runs across the artwork. */
    width: min(50vh, 86vw);
    height: min(50vh, 86vw);
    transform: translate(-50%, -50%) translate(12vw, -13vh);
  }
}

@media screen and (max-width: 900px) {
  .hero-worm {
    &__parallax {
      transition: none;
    }

    &__shape,
    &--shows &__shape,
    &--pool &__shape,
    &--words &__shape {
      width: min(78vh, 92vw);
      height: min(78vh, 92vw);
      transform: translate(-50%, -50%) translate(0, -2vh);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-worm__parallax {
    transition: none;
  }
}
</style>
