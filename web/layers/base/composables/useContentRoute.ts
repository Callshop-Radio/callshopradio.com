// Shared content routing helper.
// Builds the route per `_type`, wrapped in `useLocalePath()` (i18n) exactly
// as the inlined copies across the module components did.
// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
type RouteItem = any;

export const useContentRoute = () => {
	const localePath = useLocalePath();
	const { getSlugCurrent } = useSanityLink();

	function getItemRoute(item: RouteItem) {
		const slugCurrent = getSlugCurrent(item?.slug);
		if (!slugCurrent) return localePath("/");

		switch (item?._type) {
			case "person":
			case "venue":
				return localePath(`/pool/${slugCurrent}`);

			case "set": {
				const showSlug = getSlugCurrent(item?.parentShow?.slug);
				if (showSlug) {
					return localePath(`/shows/${showSlug}/${slugCurrent}`);
				}
				return localePath(`/shows/${slugCurrent}`);
			}

			case "article":
				return localePath(`/words/${slugCurrent}`);

			case "show":
				return localePath(`/shows/${slugCurrent}`);

			default:
				return localePath(`/${item?._type}/${slugCurrent}`);
		}
	}

	return {
		getItemRoute,
	};
};
