<script setup lang="ts">
defineProps<{
	profiles: Array<Record<string, unknown>>;
}>();
</script>

<template>
	<ModuleIntroCoverFlow :items="profiles" nav-label="Profil">
		<template #default="{ item, mediaActive }">
			<ModuleIntroPool layout="cover-flow" :pool-item="item" :media-active="mediaActive" />
		</template>
	</ModuleIntroCoverFlow>
</template>
