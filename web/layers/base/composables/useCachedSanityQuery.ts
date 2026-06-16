import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";

/**
 * Cached Sanity Query Composable
 *
 * Wraps useSanityQuery with getCachedData to return cached data immediately
 * on client-side navigation instead of refetching every time.
 */
export const useCachedSanityQuery = async <_T = unknown>(
	query: string,
	params?: MaybeRefOrGetter<Record<string, unknown>>,
	options?: {
		key?: string;
	},
) => {
	const nuxtApp = useNuxtApp();
	const resolvedParams = computed(() => toValue(params) ?? {});

	const queryKey = computed(() => {
		if (options?.key) {
			return `${options.key}-${JSON.stringify(resolvedParams.value)}`;
		}
		return `sanity-${btoa(query + JSON.stringify(resolvedParams.value)).slice(0, 32)}`;
	});

	return useSanityQuery(query, resolvedParams, {
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
