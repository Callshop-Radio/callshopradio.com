import { ref, computed, watch } from "vue";
import type { Ref } from "vue";

export interface SearchResult {
    _id: string;
    _type: "person" | "set" | "show" | "venue" | "article";
    title: string;
    slug: { current: string };
    image?: {
        asset?: {
            _ref?: string;
            url?: string;
        };
    };
    datetime?: string;
    additionalTitle?: string;
}

export interface UseSearchOptions {
    maxResults?: number;
    debounceMs?: number;
}

// Search query for autocomplete - fetches from person, set, show, venue, article
export const SEARCH_AUTOCOMPLETE_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article"] &&
  title match $searchTerm + "*"
] | order(_updatedAt desc)[0...$limit] {
  _id,
  _type,
  title,
  "slug": slug,
  "image": image {
    asset-> {
      _id,
      url
    }
  },
  datetime,
  additionalTitle,
  _type == "set" => {
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current
    }
  }
}`;

export function useSearch(options: UseSearchOptions = {}) {
    const { maxResults = 5, debounceMs = 300 } = options;

    const searchQuery: Ref<string> = ref("");
    const results: Ref<SearchResult[]> = ref([]);
    const isLoading: Ref<boolean> = ref(false);
    const error: Ref<string | null> = ref(null);
    const isOpen: Ref<boolean> = ref(false);

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    const hasResults = computed(() => results.value.length > 0);
    const hasQuery = computed(() => searchQuery.value.trim().length > 0);

    // Get the route path based on content type
    const getResultPath = (result: SearchResult): string => {
        switch (result._type) {
            case "person":
            case "venue":
                return `/pool/${result.slug?.current}`;
            case "show":
                return `/shows/${result.slug?.current}`;
            case "set":
                // Sets need to link to shows/[show-slug]/[set-slug]
                // For now, we'll link directly to the set
                return `/shows/${result.slug?.current}`;
            case "article":
                return `/words/${result.slug?.current}`;
            default:
                return "/";
        }
    };

    // Get a friendly label for the content type
    const getTypeLabel = (type: SearchResult["_type"]): string => {
        switch (type) {
            case "person":
                return "Person";
            case "venue":
                return "Venue";
            case "show":
                return "Show";
            case "set":
                return "Set";
            case "article":
                return "Article";
            default:
                return "Content";
        }
    };

    // Get type color class
    const getTypeColor = (type: SearchResult["_type"]): string => {
        switch (type) {
            case "person":
            case "venue":
                return "type-pool";
            case "show":
            case "set":
                return "type-shows";
            case "article":
                return "type-words";
            default:
                return "";
        }
    };

    // Perform the search
    const performSearch = async (query: string) => {
        if (!query.trim()) {
            results.value = [];
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const sanity = useSanity();
            const searchResults = await sanity.fetch<SearchResult[]>(
                SEARCH_AUTOCOMPLETE_QUERY,
                {
                    searchTerm: query.trim(),
                    limit: maxResults,
                }
            );

            results.value = searchResults || [];
        } catch (err) {
            console.error("Search error:", err);
            error.value = "Failed to perform search";
            results.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    // Debounced search watcher
    watch(searchQuery, (newQuery) => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        if (!newQuery.trim()) {
            results.value = [];
            isLoading.value = false;
            return;
        }

        isLoading.value = true;

        debounceTimeout = setTimeout(() => {
            performSearch(newQuery);
        }, debounceMs);
    });

    // Clear search
    const clearSearch = () => {
        searchQuery.value = "";
        results.value = [];
        error.value = null;
    };

    // Open/close search modal
    const openSearch = () => {
        isOpen.value = true;
    };

    const closeSearch = () => {
        isOpen.value = false;
        clearSearch();
    };

    const toggleSearch = () => {
        if (isOpen.value) {
            closeSearch();
        } else {
            openSearch();
        }
    };

    // Cleanup on unmount
    onUnmounted(() => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
    });

    return {
        // State
        searchQuery,
        results,
        isLoading,
        error,
        isOpen,
        // Computed
        hasResults,
        hasQuery,
        // Methods
        getResultPath,
        getTypeLabel,
        getTypeColor,
        clearSearch,
        openSearch,
        closeSearch,
        toggleSearch,
        performSearch,
    };
}
