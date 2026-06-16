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
		v-for="module in modules"
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
		/>
		<ModuleHeroSlider
			v-if="module._type == 'module.heroSlider'"
			:module="module"
		/>
	</div>
</template>
