/**
 * Sanity query for slug-based detail pages.
 *
 * Re-fetches when the route changes (e.g. related-content navigation
 * between two articles on the same page component).
 */
export async function useDetailSanityQuery<T = unknown>(
	query: string,
	options: {
		keyPrefix: string;
		/** Route param to read (`slug`, `set`, …). Defaults to `slug`. */
		routeParam?: string;
		/** GROQ param name. Defaults to `slug`. */
		queryParam?: string;
	},
) {
	const route = useRoute();
	const routeParam = options.routeParam ?? "slug";
	const queryParam = options.queryParam ?? "slug";

	const routeKey = computed(() => route.fullPath);

	const queryParams = computed(() => {
		const raw = route.params[routeParam];
		const value = String(Array.isArray(raw) ? raw[0] : (raw ?? ""));
		return { [queryParam]: value };
	});

	return useAsyncData<T | null>(
		() => `${options.keyPrefix}-${routeKey.value}`,
		async () => {
			const slugValue = queryParams.value[queryParam];
			if (!slugValue) return null;

			const sanity = useSanity();
			return sanity.client.fetch<T>(query, queryParams.value);
		},
		{ watch: [routeKey] },
	);
}
