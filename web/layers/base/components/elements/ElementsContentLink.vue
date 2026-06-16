<script setup lang="ts">
defineOptions({
	inheritAttrs: false,
});

const props = defineProps<{
	/** Sanity document with a GROQ `path` field. */
	item?: { path?: string | null } | null;
	/** Nested show reference with `path`. */
	show?: { path?: string | null } | null;
	/** Nested pool profile with `path`. */
	pool?: { path?: string | null } | null;
	/** Pre-resolved language-neutral path. */
	path?: string | null;
}>();

const { to } = useAppPath();

const resolvedTo = computed(() => {
	if (props.path) return to(props.path);
	if (props.item?.path) return to(props.item.path);
	if (props.show?.path) return to(props.show.path);
	if (props.pool?.path) return to(props.pool.path);
	return undefined;
});
</script>

<template>
	<NuxtLink v-if="resolvedTo" :to="resolvedTo" v-bind="$attrs">
		<slot />
	</NuxtLink>
	<span v-else v-bind="$attrs" class="content-link--static">
		<slot />
	</span>
</template>
