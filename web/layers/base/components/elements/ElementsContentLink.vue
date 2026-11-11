<script setup lang="ts">
defineOptions({
	inheritAttrs: false,
});

type TrackedEntity = {
	path?: string | null;
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
};

const props = defineProps<{
	/** Sanity document with a GROQ `path` field. */
	item?: TrackedEntity | null;
	/** Nested show reference with `path`. */
	show?: TrackedEntity | null;
	/** Nested pool profile with `path`. */
	pool?: TrackedEntity | null;
	/** Pre-resolved language-neutral path. */
	path?: string | null;
	/**
	 * Low-priority data prefetch when the card approaches the viewport.
	 * Intended for the first row of related cards, not every card.
	 */
	prefetchOnProximity?: boolean;
}>();

const { to } = useAppPath();
const { prefetchRoute } = usePrefetchRoute();
const { track } = useAnalytics();

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

let proximityObserver: IntersectionObserver | null = null;
let proximityIdleHandle: number | null = null;
let proximityIdleTimer: ReturnType<typeof setTimeout> | null = null;

type IdleWindow = Window & {
	requestIdleCallback?: (
		callback: (deadline: {
			didTimeout: boolean;
			timeRemaining: () => number;
		}) => void,
		options?: { timeout?: number },
	) => number;
	cancelIdleCallback?: (handle: number) => void;
};

function cancelProximityIdle() {
	if (proximityIdleTimer !== null) {
		clearTimeout(proximityIdleTimer);
		proximityIdleTimer = null;
	}
	if (proximityIdleHandle !== null) {
		(window as IdleWindow).cancelIdleCallback?.(proximityIdleHandle);
		proximityIdleHandle = null;
	}
}

function scheduleProximityPrefetch() {
	if (!props.prefetchOnProximity) return;
	if (proximityIdleHandle !== null || proximityIdleTimer !== null) return;

	const run = () => {
		proximityIdleHandle = null;
		proximityIdleTimer = null;
		prefetchRoute(rawPath.value, { proximity: true });
	};

	const requestIdle = (window as IdleWindow).requestIdleCallback;
	if (requestIdle) {
		proximityIdleHandle = requestIdle(run, { timeout: 1500 });
		return;
	}
	proximityIdleTimer = setTimeout(run, 200);
}

const trackedEntity = computed(
	() => props.item ?? props.show ?? props.pool ?? null,
);

function handleSelect() {
	const entity = trackedEntity.value;
	if (!entity) return;

	track("select_content", {
		content_type:
			entity._type || (props.show ? "show" : props.pool ? "pool" : "unknown"),
		content_id: entity._id || "",
		content_title: entity.title || entity.name || "",
		link_path: rawPath.value || "",
	});
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
	el.addEventListener("pointerdown", handlePrefetch, { passive: true });

	if (props.prefetchOnProximity && "IntersectionObserver" in window) {
		proximityObserver = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				proximityObserver?.disconnect();
				proximityObserver = null;
				scheduleProximityPrefetch();
			},
			{ rootMargin: "400px 0px", threshold: 0 },
		);
		proximityObserver.observe(el);
	}
});

onBeforeUnmount(() => {
	proximityObserver?.disconnect();
	proximityObserver = null;
	cancelProximityIdle();

	const el = resolveEl();
	if (!el) return;
	el.removeEventListener("mouseenter", handlePrefetch);
	el.removeEventListener("focus", handlePrefetch);
	el.removeEventListener("touchstart", handlePrefetch);
	el.removeEventListener("pointerdown", handlePrefetch);
});
</script>

<template>
	<NuxtLink
		v-if="resolvedTo"
		ref="linkRef"
		:to="resolvedTo"
		v-bind="$attrs"
		@click="handleSelect"
	>
		<slot />
	</NuxtLink>
	<span v-else v-bind="$attrs" class="content-link--static">
		<slot />
	</span>
</template>
