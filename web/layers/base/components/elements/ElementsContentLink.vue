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
const { prefetchRoute } = usePrefetchRoute();

const rawPath = computed(
	() =>
		props.path ??
		props.item?.path ??
		props.show?.path ??
		props.pool?.path ??
		null,
);

const resolvedTo = computed(() =>
	rawPath.value ? to(rawPath.value) : undefined,
);

// Bind listeners directly to the underlying <a> via DOM — declaring them on
// <NuxtLink> as @mouseenter/@focus didn't fire (NuxtLink's own listener
// handling collides with `v-bind="$attrs"`).
const linkRef = ref<unknown>(null);

function handlePrefetch() {
	prefetchRoute(rawPath.value);
}

function resolveEl(): HTMLElement | null {
	const ref = linkRef.value as { $el?: unknown } | HTMLElement | null;
	if (!ref) return null;
	const el = (ref as { $el?: unknown }).$el ?? ref;
	return el instanceof HTMLElement ? el : null;
}

onMounted(() => {
	const el = resolveEl();
	if (!el) return;
	el.addEventListener("mouseenter", handlePrefetch);
	el.addEventListener("focus", handlePrefetch);
	el.addEventListener("touchstart", handlePrefetch, { passive: true });
});

onBeforeUnmount(() => {
	const el = resolveEl();
	if (!el) return;
	el.removeEventListener("mouseenter", handlePrefetch);
	el.removeEventListener("focus", handlePrefetch);
	el.removeEventListener("touchstart", handlePrefetch);
});
</script>

<template>
	<NuxtLink
		v-if="resolvedTo"
		ref="linkRef"
		:to="resolvedTo"
		v-bind="$attrs"
	>
		<slot />
	</NuxtLink>
	<span v-else v-bind="$attrs" class="content-link--static">
		<slot />
	</span>
</template>
