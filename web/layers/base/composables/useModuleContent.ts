/**
 * useModuleContent Composable
 * 
 * Allows modules to fetch their own content with pagination, 
 * content-type filtering, shuffle support, and global caching.
 */
import { ref, computed, watch } from 'vue';
import { useSanity } from '#imports';
import { 
  SET_LIST_QUERY, 
  SET_COUNT_QUERY,
  POOL_LIST_QUERY, 
  POOL_COUNT_QUERY,
  ARTICLE_LIST_QUERY, 
  ARTICLE_COUNT_QUERY,
  SHOW_LIST_QUERY,
  SHOW_COUNT_QUERY
} from '~~/queries/module.queries';

// ==================== GLOBAL CACHE ====================
// Cache for module content, persists across components
interface CacheEntry<T = any> {
  items: T[];
  count: number;
  timestamp: number;
}

const moduleContentCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from query type and params
 */
function getCacheKey(type: string, params: Record<string, any>): string {
  return `${type}:${JSON.stringify(params)}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Pre-fetch and cache module content (call on page mount)
 */
export async function prefetchModuleContent(
  type: 'sets' | 'pool' | 'shows' | 'words',
  options: { contentType?: string | string[]; limit?: number } = {}
): Promise<void> {
  const sanity = useSanity();
  const limit = options.limit || 50;
  const params: Record<string, any> = { start: 0, end: limit };
  
  // Set pool types if applicable
  if (type === 'pool') {
    params.types = options.contentType 
      ? (Array.isArray(options.contentType) ? options.contentType : [options.contentType])
      : ['person', 'venue'];
  }
  
  const cacheKey = getCacheKey(type, params);
  
  // Skip if already cached and valid
  if (isCacheValid(moduleContentCache.get(cacheKey))) {
    return;
  }
  
  try {
    const queryConfig = {
      sets: { query: SET_LIST_QUERY, countQuery: SET_COUNT_QUERY },
      pool: { query: POOL_LIST_QUERY, countQuery: POOL_COUNT_QUERY },
      shows: { query: SHOW_LIST_QUERY, countQuery: SHOW_COUNT_QUERY },
      words: { query: ARTICLE_LIST_QUERY, countQuery: ARTICLE_COUNT_QUERY },
    };
    
    const { query, countQuery } = queryConfig[type];
    
    const [items, count] = await Promise.all([
      sanity.fetch(query, params),
      sanity.fetch(countQuery, params)
    ]);
    
    moduleContentCache.set(cacheKey, {
      items,
      count: typeof count === 'number' ? count : 0,
      timestamp: Date.now()
    });
    
    console.log(`[useModuleContent] Pre-fetched ${type}: ${items.length} items`);
  } catch (error) {
    console.error(`[useModuleContent] Pre-fetch failed for ${type}:`, error);
  }
}

/**
 * Clear the module content cache
 */
export function clearModuleContentCache(): void {
  moduleContentCache.clear();
}

// ==================== COMPOSABLE ====================

export interface ModuleContentOptions {
  type: 'sets' | 'pool' | 'shows' | 'words';
  contentType?: string | string[];  // For pool: 'person', 'venue', or both
  perPage?: number;
  autoLoad?: boolean;
  shuffle?: boolean;
  useCache?: boolean;  // Use global cache (default: true)
}

export interface ModuleContentState<T = any> {
  items: T[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  hasMore: boolean;
  error: Error | null;
}

/**
 * Shuffle array with seed for reproducible results
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

export const useModuleContent = <T = any>(options: ModuleContentOptions) => {
  const sanity = useSanity();
  
  // State
  const items = ref<T[]>([]);
  const isLoading = ref(false);
  const page = ref(1);
  const totalCount = ref(0);
  const error = ref<Error | null>(null);
  
  const perPage = options.perPage || 24;
  const shuffleSeed = options.shuffle ? Date.now() : 0;
  const useCache = options.useCache !== false; // Default true
  
  // Computed
  const hasMore = computed(() => {
    return items.value.length < totalCount.value;
  });
  
  const start = computed(() => (page.value - 1) * perPage);
  const end = computed(() => page.value * perPage);
  
  // Get query and params based on content type
  const getQueryConfig = () => {
    switch (options.type) {
      case 'sets':
        return {
          query: SET_LIST_QUERY,
          countQuery: SET_COUNT_QUERY,
          params: { start: start.value, end: end.value }
        };
      case 'pool':
        const types = options.contentType 
          ? (Array.isArray(options.contentType) ? options.contentType : [options.contentType])
          : ['person', 'venue'];
        return {
          query: POOL_LIST_QUERY,
          countQuery: POOL_COUNT_QUERY.replace('$types', JSON.stringify(types)),
          params: { start: start.value, end: end.value, types }
        };
      case 'shows':
        return {
          query: SHOW_LIST_QUERY,
          countQuery: SHOW_COUNT_QUERY,
          params: { start: start.value, end: end.value }
        };
      case 'words':
        return {
          query: ARTICLE_LIST_QUERY,
          countQuery: ARTICLE_COUNT_QUERY,
          params: { start: start.value, end: end.value }
        };
      default:
        throw new Error(`Unknown content type: ${options.type}`);
    }
  };
  
  /**
   * Fetch content from Sanity (checks cache first)
   */
  const fetchContent = async (append = false): Promise<void> => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const { query, countQuery, params } = getQueryConfig();
      const cacheKey = getCacheKey(options.type, params);
      
      let fetchedItems: any[];
      let count: number;
      
      // Check cache first (only for first page, not when appending)
      const cachedEntry = useCache && !append ? moduleContentCache.get(cacheKey) : undefined;
      
      if (isCacheValid(cachedEntry)) {
        // Use cached data
        fetchedItems = cachedEntry!.items;
        count = cachedEntry!.count;
        console.log(`[useModuleContent] Using cached ${options.type}: ${fetchedItems.length} items`);
      } else {
        // Fetch from Sanity
        [fetchedItems, count] = await Promise.all([
          sanity.fetch(query, params),
          totalCount.value === 0 ? sanity.fetch(countQuery, params) : Promise.resolve(totalCount.value)
        ]);
        
        // Store in cache
        if (useCache && !append) {
          moduleContentCache.set(cacheKey, {
            items: fetchedItems,
            count: typeof count === 'number' ? count : 0,
            timestamp: Date.now()
          });
        }
      }
      
      // Update total count
      if (typeof count === 'number') {
        totalCount.value = count;
      }
      
      // Apply shuffle if enabled
      const processedItems = options.shuffle 
        ? seededShuffle(fetchedItems, shuffleSeed)
        : fetchedItems;
      
      // Append or replace items
      if (append) {
        items.value = [...items.value, ...processedItems];
      } else {
        items.value = processedItems;
      }
    } catch (err) {
      error.value = err as Error;
      console.error('[useModuleContent] Error fetching content:', err);
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Load more items (pagination)
   */
  const loadMore = async (): Promise<void> => {
    if (!hasMore.value || isLoading.value) return;
    page.value++;
    await fetchContent(true);
  };
  
  /**
   * Refresh content (reset and reload)
   */
  const refresh = async (): Promise<void> => {
    page.value = 1;
    totalCount.value = 0;
    await fetchContent(false);
  };
  
  // Auto-load on mount if enabled
  if (options.autoLoad !== false) {
    // Use onMounted in the component that uses this composable
    // or call fetchContent() manually
  }
  
  return {
    // State
    items: computed(() => items.value),
    isLoading: computed(() => isLoading.value),
    page: computed(() => page.value),
    totalCount: computed(() => totalCount.value),
    hasMore,
    error: computed(() => error.value),
    
    // Actions
    fetchContent,
    loadMore,
    refresh,
    
    // Config
    perPage
  };
};
