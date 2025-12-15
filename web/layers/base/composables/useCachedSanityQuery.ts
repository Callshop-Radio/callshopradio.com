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
  }
) => {
  const nuxtApp = useNuxtApp();
  
  // Generate a unique key based on query and params
  const queryKey = options?.key || `sanity-${btoa(query + JSON.stringify(params || {})).slice(0, 32)}`;
  
  if (process.client) {
    console.log(`[useCachedSanityQuery] Key: ${queryKey}`);
  }

  return useSanityQuery<T>(query, params, {
    // Return cached data immediately if available
    getCachedData: (key) => {
      // Check if we have cached data from SSR payload or static data
      const cachedData = nuxtApp.payload.data[key] || nuxtApp.static?.data?.[key];
      
      if (process.client) {
         if (cachedData) {
            console.log(`[useCachedSanityQuery] Cache HIT for ${key}`);
         } else {
            console.log(`[useCachedSanityQuery] Cache MISS for ${key} - triggering refetch`);
         }
      }

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
