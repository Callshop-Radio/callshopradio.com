<script setup lang="ts">
withDefaults(
	defineProps<{
		// biome-ignore lint/suspicious/noExplicitAny: ~/types/sanity alias is currently broken/any
		modules?: any[];
	}>(),
	{
		modules: () => [],
	},
);
</script>

<template>
	<div
		v-for="(module, index) in modules"
		:key="module._key"
		class="module"
	>
		<ModuleContentGrid
			v-if="module._type == 'module.contentReferenceGrid'"
			:module="module"
		/>
		<ModuleContentTeaser
			v-if="module._type == 'module.contentReferenceSlider'"
			:module="module"
		/>
		<ModuleHeroEntrySolo
			v-if="module._type == 'module.heroEntry'"
			:module="module"
			:eager="index === 0"
		/>
		<!-- One hero for all content kinds: sets square/pink, pool portrait/blue,
		     words landscape/green. The former landing slider is archived in
		     modules/archive/ModuleHeroSliderLegacy.vue and can be re-registered
		     here if needed. -->
		<SiteMixedHero
			v-if="module._type == 'module.heroSlider'"
			:module="module"
			:eager="index === 0"
		/>
	</div>
</template>
