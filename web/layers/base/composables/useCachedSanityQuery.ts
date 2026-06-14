/**
 * Cached Sanity Query Composable
 *
 * Wraps useSanityQuery with getCachedData to return cached data immediately
 * on client-side navigation instead of refetching every time.
 */
export const useCachedSanityQuery = async <_T = unknown>(
	query: string,
	params?: Record<string, unknown>,
	options?: {
		key?: string;
	},
) => {
	const nuxtApp = useNuxtApp();

	// Generate a unique key based on query and params
	const queryKey =
		options?.key ||
		`sanity-${btoa(query + JSON.stringify(params || {})).slice(0, 32)}`;

	return useSanityQuery(query, params, {
		getCachedData: (key: string) => {
			const cachedData = nuxtApp.payload.data[key];

			if (cachedData) {
				return cachedData;
			}

			// Return undefined to trigger a fresh fetch
			return undefined;
		},
		key: queryKey,
	});
};
