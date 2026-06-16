<script setup lang="ts">
defineProps<{
	articles: Array<Record<string, unknown>>;
}>();
</script>

<template>
	<ModuleIntroCoverFlow
		:items="articles"
		nav-label="Artikel"
		equalize-card-heights
		accent-color="var(--color-green)"
	>
		<template #default="{ item, mediaActive }">
			<ModuleIntroArticle layout="cover-flow" :article="item" :media-active="mediaActive" />
		</template>
	</ModuleIntroCoverFlow>
</template>
