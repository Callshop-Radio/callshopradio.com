/**
 * Sanity query for slug-based detail pages.
 *
 * Reactive key includes the current slug, so SPA navigation between
 * `/shows/foo` and `/shows/bar` swaps in the cached payload (SSR or
 * previously fetched) instead of triggering a fresh Sanity request.
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

	const slug = computed(() => {
		const raw = route.params[routeParam];
		return String(Array.isArray(raw) ? raw[0] : (raw ?? ""));
	});

	return useAsyncData<T | null>(
		() => `${options.keyPrefix}-${slug.value}`,
		async () => {
			if (!slug.value) return null;
			const sanity = useSanity();
			return sanity.client.fetch<T>(query, { [queryParam]: slug.value });
		},
		{
			getCachedData: (key, nuxtApp) =>
				(nuxtApp.payload.data[key] as T | null | undefined) ??
				(nuxtApp.static.data[key] as T | null | undefined),
		},
	);
}
