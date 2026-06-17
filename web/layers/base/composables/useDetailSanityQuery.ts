/**
 * Sanity query for slug-based detail pages.
 *
 * Goes through /api/sanity/detail/{type} (defineCachedEventHandler) so the
 * 2–3s Sanity round-trip is paid once per (type, slug) and served from
 * Nitro's LRU for every subsequent request. The webhook at /api/revalidate
 * purges those cache entries on Sanity content changes.
 *
 * Reactive key + getCachedData lets SPA navigation reuse the payload from
 * SSR or a prior fetch without re-suspending.
 */
export async function useDetailSanityQuery<T = unknown>(
	_query: string,
	options: {
		keyPrefix: string;
		/** Route param to read (`slug`, `set`, …). Defaults to `slug`. */
		routeParam?: string;
		/** GROQ param name. Defaults to `slug` — kept for callsite compatibility. */
		queryParam?: string;
	},
) {
	const route = useRoute();
	const routeParam = options.routeParam ?? "slug";

	const slug = computed(() => {
		const raw = route.params[routeParam];
		return String(Array.isArray(raw) ? raw[0] : (raw ?? ""));
	});

	return useAsyncData<T | null>(
		() => `${options.keyPrefix}-${slug.value}`,
		async () => {
			if (!slug.value) return null;
			return await $fetch<T>(`/api/sanity/detail/${options.keyPrefix}`, {
				query: { slug: slug.value },
			});
		},
		{
			getCachedData: (key, nuxtApp) =>
				(nuxtApp.payload.data[key] as T | null | undefined) ??
				(nuxtApp.static.data[key] as T | null | undefined),
		},
	);
}
