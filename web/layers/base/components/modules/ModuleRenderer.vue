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
		<ModuleHeroSlider
			v-if="module._type == 'module.heroSlider'"
			:module="module"
			:eager="index === 0"
		/>
	</div>
</template>
