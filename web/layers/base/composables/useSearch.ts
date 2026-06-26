import type { Ref } from "vue";
import { computed, ref, watch } from "vue";
import { SITE_PATH_FRAGMENT } from "~~/queries/sanity.snippets";

export interface SearchResult {
	_id: string;
	_type: "person" | "set" | "show" | "venue" | "article" | string;
	title: string;
	path?: string;
	slug: { current: string };
	image?: {
		asset?: {
			_ref?: string;
			url?: string;
		};
	};
	parentShow?: {
		_id: string;
		title: string;
		slug?: { current?: string } | string;
	};
	datetime?: string;
	additionalTitle?: string;
	_relevanceScore?: number;
}

export interface UseSearchOptions {
	maxResults?: number;
	debounceMs?: number;
}

// Search query for autocomplete - fetches from person, set, show, venue, article
// Fetch more results (100) to allow for better relevance sorting on client side
export const SEARCH_AUTOCOMPLETE_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article", "tag.genre", "tag.subGenre", "tag.global", "tag.mood", "tag.musician", "tag.venue", "tag.crafts", "tag.service", "tag.article"] &&
  title match "*" + $searchTerm + "*" &&
  // Hide venues and persons with poolVisibility:false
  !(_type in ["person", "venue"] && poolVisibility != true) &&
  // Hide shows with title "no-show"
  !(_type == "show" && title == "no-show")
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
      slug
    }
  },
  ${SITE_PATH_FRAGMENT}
}`;

export function useSearch(options: UseSearchOptions = {}) {
	const { to, searchTag } = useAppPath();
	// Increase default max results for better UX with scrolling
	const { maxResults = 20, debounceMs = 150 } = options;

	const searchQuery: Ref<string> = ref("");
	const results: Ref<SearchResult[]> = ref([]);
	const isLoading: Ref<boolean> = ref(false);
	const error: Ref<string | null> = ref(null);
	const isOpen: Ref<boolean> = ref(false);

	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

	// Adaptive debounce state
	let lastKeyTime = 0;
	let keyPressCount = 0;

	const hasResults = computed(() => results.value.length > 0);
	const hasQuery = computed(() => searchQuery.value.trim().length > 0);

	// Calculate relevance score for a result based on search query
	const calculateRelevanceScore = (title: string, query: string): number => {
		if (!title || !query) return 0;
		const titleLower = title.toLowerCase();
		const queryLower = query.toLowerCase().trim();

		// Exact match gets highest score
		if (titleLower === queryLower) return 100;

		// Starts with query gets high score
		if (titleLower.startsWith(queryLower)) return 80;

		// Word starts with query (e.g., "John Smith" for query "smith")
		const words = titleLower.split(/\s+/);
		if (words.some((word) => word.startsWith(queryLower))) return 60;

		// Contains query gets medium score
		if (titleLower.includes(queryLower)) return 40;

		// Partial match (at least first 2 characters match at word start)
		if (
			queryLower.length >= 2 &&
			words.some((word) => word.startsWith(queryLower.substring(0, 2)))
		)
			return 20;

		return 10;
	};

	// Sort results by relevance score
	const sortByRelevance = (
		searchResults: SearchResult[],
		query: string,
	): SearchResult[] => {
		if (!query || !searchResults || searchResults.length === 0)
			return searchResults;

		return [...searchResults]
			.map((result) => ({
				...result,
				_relevanceScore: calculateRelevanceScore(result.title, query),
			}))
			.sort((a, b) => {
				// First sort by relevance score (descending)
				const scoreA = a._relevanceScore || 0;
				const scoreB = b._relevanceScore || 0;
				if (scoreB !== scoreA) return scoreB - scoreA;

				// Then sort alphabetically for equal scores
				return (a.title || "").localeCompare(b.title || "");
			});
	};

	// Calculate adaptive debounce based on typing speed
	const getAdaptiveDebounce = (): number => {
		const now = Date.now();
		const timeSinceLastKey = now - lastKeyTime;

		// If typing fast (< 100ms between keys), increase debounce
		if (timeSinceLastKey < 100) {
			keyPressCount++;
			// Max out at 400ms for very fast typing to reduce DB load
			return Math.min(debounceMs + keyPressCount * 40, 400);
		} else {
			// Reset gradually if typing slowly
			keyPressCount = Math.max(0, keyPressCount - 1);
			return debounceMs;
		}
	};

	// Localized route for a search result
	const getResultPath = (result: SearchResult): string => {
		if (result._type.startsWith("tag.")) {
			return searchTag(result.title);
		}

		return to(result.path) ?? to("/") ?? "/";
	};

	// Get a friendly label for the content type
	const getTypeLabel = (type: SearchResult["_type"]): string => {
		if (type.startsWith("tag.")) return "Tag";
		switch (type) {
			case "person":
			case "venue":
				return "Pool";
			case "show":
			case "set":
				return "Shows";
			case "article":
				return "Words";
			default:
				return "Content";
		}
	};

	// Get type color class
	const getTypeColor = (type: SearchResult["_type"]): string => {
		if (type.startsWith("tag.")) return "type-tag";
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

	// Perform the search with relevance sorting
	const performSearch = async (query: string) => {
		if (!query.trim()) {
			results.value = [];
			return;
		}

		isLoading.value = true;
		error.value = null;

		try {
			const sanity = useSanity();
			// Fetch more results to allow for relevance sorting
			const fetchLimit = Math.max(maxResults * 3, 50);
			const searchResults = await sanity.fetch<SearchResult[]>(
				SEARCH_AUTOCOMPLETE_QUERY,
				{
					searchTerm: query.trim(),
					limit: fetchLimit,
				},
			);

			// Sort by relevance and limit to maxResults
			const sortedResults = sortByRelevance(searchResults || [], query);
			results.value = sortedResults.slice(0, maxResults);
		} catch (err) {
			console.error("Search error:", err);
			error.value = "Failed to perform search";
			results.value = [];
		} finally {
			isLoading.value = false;
		}
	};

	// Debounced search watcher with adaptive timing
	watch(searchQuery, (newQuery) => {
		// Track typing speed for adaptive debounce
		const now = Date.now();
		const adaptiveDelay = getAdaptiveDebounce();
		lastKeyTime = now;

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		if (!newQuery.trim()) {
			results.value = [];
			isLoading.value = false;
			keyPressCount = 0;
			return;
		}

		isLoading.value = true;

		debounceTimeout = setTimeout(() => {
			performSearch(newQuery);
		}, adaptiveDelay);
	});

	// Clear search
	const clearSearch = () => {
		searchQuery.value = "";
		results.value = [];
		error.value = null;
		keyPressCount = 0;
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
