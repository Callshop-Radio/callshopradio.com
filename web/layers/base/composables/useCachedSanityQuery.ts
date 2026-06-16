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

	const queryKey =
		options?.key ||
		`sanity-${btoa(query + JSON.stringify(params || {})).slice(0, 32)}`;

	return useSanityQuery(query, params, {
		getCachedData: (key: string) => {
			const cachedData = nuxtApp.payload.data[key];

			if (cachedData) {
				return cachedData;
			}

			return undefined;
		},
		key: queryKey,
	});
};
