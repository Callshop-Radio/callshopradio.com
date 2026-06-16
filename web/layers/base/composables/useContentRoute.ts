// Shared content routing helper.
// Builds the route per `_type`, wrapped in `useLocalePath()` (i18n) exactly
// as the inlined copies across the module components did.
// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
type RouteItem = any;

export const useContentRoute = () => {
	const localePath = useLocalePath();

	// Funktion zum Bestimmen der passenden Route für verschiedene Content-Typen
	function getItemRoute(item: RouteItem) {
		if (!item || !item?.slug) return "/";

		switch (item?._type) {
			case "person":
			case "venue":
				return localePath(`/pool/${item?.slug?.current}`);

			case "set":
				// Prüfe, ob parentShow vorhanden ist
				if (item?.parentShow?.slug?.current) {
					return localePath(
						`/shows/${item.parentShow?.slug?.current}/${item?.slug?.current}`,
					);
				}
				// Fallback falls parentShow nicht verfügbar ist
				return localePath(`/shows/${item?.slug?.current}`);

			case "article":
				return localePath(`/words/${item?.slug?.current}`);

			case "show":
				return localePath(`/shows/${item?.slug?.current}`);

			// Standard-Fallback
			default:
				return localePath(`/${item?._type}/${item?.slug?.current}`);
		}
	}

	return {
		getItemRoute,
	};
};
