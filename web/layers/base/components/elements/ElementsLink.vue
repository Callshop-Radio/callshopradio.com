<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale } = useI18n();
const localePath = useLocalePath();
const { to } = useAppPath();
const currentRoute = useRoute();

const props = defineProps({
	type: {
		type: String,
		default: () => "external",
	},
	path: {
		type: String,
		default: () => "",
	},
	href: {
		type: String,
		default: () => "",
	},
	blank: {
		type: Boolean,
		default: () => false,
	},
	route: {
		type: String,
		default: () => "",
	},
	slug: {
		type: [String, Object],
		default: () => "",
	},
	parentSlug: {
		type: String,
		default: () => "",
	},
	setSlug: {
		type: String,
		default: () => "",
	},
	refType: {
		type: String,
		default: () => "",
	},
	reference: {
		type: Object,
		default: null,
	},
	func: {
		type: String,
		default: () => "",
	},
	parentActive: {
		type: Boolean,
		default: () => true,
	},
});

const linkTarget = computed(() => {
	if (props.type === "internal") {
		return to(props.path) ?? localePath("/");
	}

	return props.href || localePath("/");
});

// Improved function to check whether a route is active, even with multiple nesting
const isActive = computed(() => {
	if (props.type !== "internal" || !props.parentActive) return false;

	const linkPath = linkTarget.value;

	// Normalize paths without trailing slash
	const normalizedLinkPath = linkPath.endsWith("/")
		? linkPath.slice(0, -1)
		: linkPath;

	const normalizedRoutePath = currentRoute.path.endsWith("/")
		? currentRoute.path.slice(0, -1)
		: currentRoute.path;

	// 1. Check for an exact match
	if (normalizedRoutePath === normalizedLinkPath) {
		return true;
	}

	// 2. Check whether the current route is a sub-page of the link
	if (
		normalizedLinkPath !== "/" &&
		normalizedRoutePath.startsWith(`${normalizedLinkPath}/`)
	) {
		return true;
	}

	// 3. Check main sections of the website
	const routeSegments = normalizedRoutePath.split("/").filter(Boolean);
	const linkSegments = normalizedLinkPath.split("/").filter(Boolean);

	if (routeSegments.length === 0 || linkSegments.length === 0) return false;

	// Skip locale prefix segment for comparison (e.g. /de/shows → shows)
	const localeSegment =
		routeSegments[0] === locale.value ? routeSegments.slice(1) : routeSegments;
	const linkLocaleSegment =
		linkSegments[0] === locale.value ? linkSegments.slice(1) : linkSegments;

	if (localeSegment[0] && localeSegment[0] === linkLocaleSegment[0]) {
		if (
			["shows", "pool", "words", "info", "schedule"].includes(
				linkLocaleSegment[0],
			)
		) {
			return true;
		}
	}

	// 4. Slug-based check
	if (props.slug) {
		return normalizedRoutePath === normalizedLinkPath;
	}

	return false;
});

const { $CC } = useNuxtApp();
const mainStore = useMainStore();

const onClick = (func) => {
	switch (func) {
		case "cookie":
			if (!mainStore?.siteCookieBanner?.useCookieBanner) {
				return console.warn(
					`'${func}' triggered but cookie banner is not used.`,
				);
			}
			$CC.showPreferences();
			break;
		default:
			console.warn(`Function '${func}' not defined.`);
	}
};
</script>

<template>
	<NuxtLink
		v-if="type !== 'function'"
		:key="`rt-${locale}`"
		:to="linkTarget"
		:target="props?.blank && props?.type !== 'internal' ? '_blank' : undefined"
		:download="props.type === 'download' ? true : undefined"
		:rel="props?.blank && props?.type !== 'internal' ? 'noopener' : undefined"
		:class="{ 'parent-active': isActive }"
	><slot/></NuxtLink>
	<button
		v-else
		class="link-style"
		@click="onClick(props?.func)">
		<slot />
	</button>
</template>

<style lang="postcss" scoped>
/* The parent-active class is used for parent routes */
.parent-active {
}

/* Keep normal router-link-active and router-link-exact-active styles */
.router-link-exact-active {
}

/* Navigation-specific styles */
:where(nav) {
  .router-link-exact-active,
  .router-link-active,
  .parent-active {
    color: var(--color-bg);
    background-color: var(--color-text);
  }
}
</style>
