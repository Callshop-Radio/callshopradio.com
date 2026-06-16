import { getSlugCurrent, type SanitySlug } from "~/composables/useSanityLink";

// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
export type ContentRouteItem = any;

export type ContentRouteOptions = {
	/** Fallback show slug when `parentShow` is missing (e.g. sets on a show detail page). */
	contextShowSlug?: string;
};

const getSetParentShowSlug = (item: ContentRouteItem): string | undefined =>
	getSlugCurrent(item?.parentShow?.slug) ||
	getSlugCurrent(item?.show?.slug) ||
	undefined;

/** Build a site path for a Sanity content document (without locale prefix). */
export const resolveContentItemPath = (
	item: ContentRouteItem,
	options: ContentRouteOptions = {},
): string | undefined => {
	const slugCurrent = getSlugCurrent(item?.slug);
	if (!slugCurrent) return undefined;

	switch (item?._type) {
		case "person":
		case "venue":
			return `/pool/${slugCurrent}`;

		case "set": {
			const showSlug = getSetParentShowSlug(item) || options.contextShowSlug;
			if (showSlug) return `/shows/${showSlug}/${slugCurrent}`;
			return `/shows/${slugCurrent}`;
		}

		case "article":
		case "word":
			return `/words/${slugCurrent}`;

		case "show":
			return `/shows/${slugCurrent}`;

		case "page":
			return `/${slugCurrent}`;

		case "showsArchive":
			return "/shows";

		case "pool":
			return "/pool";

		case "words":
			return "/words";

		case "timetable":
			return "/schedule";

		case "home":
			return "/";

		default:
			return item?._type ? `/${item._type}/${slugCurrent}` : undefined;
	}
};

export const hasContentSlug = (item: ContentRouteItem): boolean =>
	Boolean(getSlugCurrent(item?.slug));

/** Resolve a show document (or `{ slug }`) to `/shows/{slug}`. */
export const resolveShowPath = (
	show?: { slug?: SanitySlug } | null,
): string | undefined => {
	const slugCurrent = getSlugCurrent(show?.slug);
	return slugCurrent ? `/shows/${slugCurrent}` : undefined;
};

/** Resolve a pool profile to `/pool/{slug}`. */
export const resolvePoolPath = (
	item?: { slug?: SanitySlug; _type?: string } | null,
): string | undefined => {
	const slugCurrent = getSlugCurrent(item?.slug);
	return slugCurrent ? `/pool/${slugCurrent}` : undefined;
};

export const useContentRoute = () => {
	const localePath = useLocalePath();
	const route = useRoute();

	const contextShowSlug = computed(() => {
		const slug = route.params.slug;
		return typeof slug === "string" ? slug : slug?.[0];
	});

	function getItemRoute(
		item: ContentRouteItem,
		options: ContentRouteOptions = {},
	) {
		const path = resolveContentItemPath(item, {
			contextShowSlug: options.contextShowSlug || contextShowSlug.value,
			...options,
		});
		return path ? localePath(path) : localePath("/");
	}

	function getShowRoute(show?: { slug?: SanitySlug } | null) {
		const path = resolveShowPath(show);
		return path ? localePath(path) : localePath("/shows");
	}

	function getPoolRoute(item?: { slug?: SanitySlug } | null) {
		const path = resolvePoolPath(item);
		return path ? localePath(path) : localePath("/pool");
	}

	return {
		getItemRoute,
		getShowRoute,
		getPoolRoute,
		hasContentSlug,
		resolveContentItemPath,
	};
};
