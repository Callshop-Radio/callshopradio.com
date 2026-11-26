<script setup lang="ts">
defineProps<{
	profiles: Array<Record<string, unknown>>;
}>();
</script>

<template>
	<ModuleIntroCoverFlow
		:items="profiles"
		nav-label="Profil"
		area="pool"
		orientation="vertical"
	>
		<template #default="{ item, mediaActive }">
			<ModuleIntroPool
				layout="cover-flow"
				:pool-item="item"
				:media-active="mediaActive"
				orientation="vertical"
			/>
		</template>
	</ModuleIntroCoverFlow>
</template>
