/**
 * Cached Sanity Query Composable
 *
 * Wraps useSanityQuery with getCachedData to return cached data immediately
 * on client-side navigation instead of refetching every time.
 */
export const useCachedSanityQuery = async <T = any>(
  query: string,
  params?: Record<string, any>,
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
    // Use the generated key
    key: queryKey,
  } as any);
};
