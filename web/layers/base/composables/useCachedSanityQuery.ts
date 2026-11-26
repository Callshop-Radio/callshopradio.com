/**
 * Cached Sanity Query Composable
 *
 * Wraps useSanityQuery with getCachedData to return cached data immediately
 * on client-side navigation instead of refetching every time.
 */
export const useCachedSanityQuery = async <const Q extends string>(
	query: Q,
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
			// On the server, always fetch fresh. In dev the Nuxt app instance is
			// reused across HMR updates, so `payload.data` can still hold the
			// result of a previous render and would leak into the next one
			// (pages then render without their modules until a reload).
			if (import.meta.server) {
				return undefined;
			}

			const cachedData = nuxtApp.payload.data[key];

			if (cachedData) {
				return cachedData;
			}

			return undefined;
		},
		key: queryKey,
	});
};
