<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import { randomFormSeed } from "../../utils/generative-form";
import HeroWorm from "./HeroWorm.vue";

type HeroPage = "shows" | "pool" | "words";
// biome-ignore lint/suspicious/noExplicitAny: hero items are loose Sanity cover-flow docs
type HeroItem = Record<string, any>;

defineProps<{
	page: HeroPage;
	items: HeroItem[];
	accent: string;
}>();

const mainStore = useMainStore();
const formSeed = ref<number | null>(null);
const activeIndex = ref(1);
const ready = ref(false);
const root = ref<HTMLElement | null>(null);

onMounted(() => {
	formSeed.value = randomFormSeed();

	nextTick(() => {
		const started = performance.now();
		const reveal = () => {
			const active = root.value?.querySelector('.lab-item[data-active="true"]');
			const rect = active?.getBoundingClientRect();
			const inView = rect && rect.right > 0 && rect.left < window.innerWidth;
			if (inView || performance.now() - started > 2000) {
				ready.value = true;
				return;
			}
			requestAnimationFrame(reveal);
		};
		requestAnimationFrame(reveal);
	});
});
</script>

<template>
	<div
		ref="root"
		class="site-hero"
		:class="{ 'is-ready': ready }"
		:style="{ '--accent': accent }"
	>
		<LabAtmosphere
			variant="form"
			contained
			foreground-worm
			:page="page"
			:accent="accent"
			:shift="activeIndex"
			:form-seed="formSeed"
			:dark="Boolean(mainStore?.isDarkMode)"
		/>

		<HeroWorm :page="page" :shift="activeIndex" />

		<div class="site-hero__inner">
			<LabSlider
				:items="items"
				direction="aperture"
				front-worm
				:page="page"
				:accent="accent"
				@update:index="activeIndex = $event"
			/>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.site-hero {
  --lab-inset: max(
    var(--page-gutter),
    calc((100vw - var(--page-max-width)) / 2)
  );

  position: relative;
  isolation: isolate;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  padding-bottom: var(--big-margin);
  opacity: 0;
  transition: opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);

  &.is-ready {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.site-hero__inner {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
}
</style>
