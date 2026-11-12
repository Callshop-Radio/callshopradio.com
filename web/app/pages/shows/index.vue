<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { SHOWSARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "shows-archive",
});

const query = groq`${SHOWSARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

const slider = computed(() => data.value?.slider);
const { featured: featuredSets } = await useCoverFlowSliderItems(
	slider,
	"sets",
	{
		contentType: "sets",
	},
);

// Wide aurora behind the coverflow. It drifts horizontally with the pointer
// and keeps the morphing SVG as its main motion.
const reduceMotion = ref(false);
const glowOffset = ref({ x: 0, y: 0 });
let lastPointerMove = 0;
let lastGlowX = 0;
let lastGlowY = 0;

function onGlowPointerMove(event) {
	if (reduceMotion.value || event.pointerType === "touch") return;
	const now = performance.now();
	if (now - lastPointerMove < 200) return;
	const nx = Math.min(
		0.5,
		Math.max(-0.5, event.clientX / window.innerWidth - 0.5),
	);
	const ny = Math.min(
		0.5,
		Math.max(-0.5, event.clientY / window.innerHeight - 0.5),
	);
	const x = Math.round(nx * 44);
	const y = Math.round(ny * 20);
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

onMounted(() => {
	reduceMotion.value = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	window.addEventListener("pointermove", onGlowPointerMove, { passive: true });
	document.documentElement.addEventListener("pointerleave", resetGlow);
});

onUnmounted(() => {
	window.removeEventListener("pointermove", onGlowPointerMove);
	document.documentElement.removeEventListener("pointerleave", resetGlow);
});

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="shows-archive">
		<section v-if="featuredSets.length > 0" class="intro-section">
			<div class="shows-glow" :style="glowStyle" aria-hidden="true">
				<AnimatedGradient class="shows-glow__blob shows-glow__blob--a" />
				<AnimatedGradient class="shows-glow__blob shows-glow__blob--b" />
				<AnimatedGradient class="shows-glow__blob shows-glow__blob--c" />
			</div>
			<ModuleIntroCoverFlow :items="featuredSets" nav-label="Set" area="show">
				<template #default="{ item, mediaActive, isCenter }">
					<ModuleIntroSet
						layout="cover-flow"
						:set="item"
						:media-active="mediaActive"
						:is-center="isCenter"
					/>
				</template>
			</ModuleIntroCoverFlow>
		</section>
		<section
			v-if="data?.modules && data?.modules?.length > 0"
			class="module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.shows-archive {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;

  .intro-section {
    position: relative;
    isolation: isolate;
    width: 100%;
    max-width: 100%;
    margin-top: calc(var(--first-content-distance) + 50px);

    @media screen and (max-width: 900px) {
      margin-top: calc(var(--base-margin) + 50px);
    }

    :deep(.intro-cover-flow) {
      position: relative;
      z-index: 1;
    }
  }
}

.shows-glow {
  position: absolute;
  inset: 0 0 4% 0;
  z-index: 0;
  pointer-events: none;
  transform: translate3d(var(--glow-x, 0px), var(--glow-y, 0px), 0);
  transition: transform 1400ms cubic-bezier(0.22, 1, 0.36, 1);

  @media screen and (max-width: 900px) {
    inset: 2% 0 6% 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.shows-glow__blob {
  position: absolute;
  display: block;
  opacity: 0.56;
  filter: blur(34px);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }

  &--a {
    top: -12%;
    right: -8%;
    width: 76%;
    height: 100%;
    opacity: 0.58;
    transform: scaleX(-1) rotate(8deg);
  }

  &--b {
    bottom: -18%;
    left: -8%;
    width: 72%;
    height: 86%;
    opacity: 0.44;
    filter: blur(46px);
    transform: rotate(-6deg);
  }

  &--c {
    top: 24%;
    left: 38%;
    width: 52%;
    height: 60%;
    opacity: 0.3;
    filter: blur(58px);
    transform: rotate(14deg);
  }
}
</style>

