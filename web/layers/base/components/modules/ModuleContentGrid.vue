<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { ContentItem, Tag } from "~/types/sanity";
import {
	ARTICLE_COUNT_QUERY,
	ARTICLE_LIST_QUERY,
	POOL_COUNT_QUERY,
	POOL_LIST_QUERY,
	SET_COUNT_QUERY,
	SET_LIST_QUERY,
	SHOW_COUNT_QUERY,
	SHOW_LIST_QUERY,
} from "~~/queries/module.queries";

const { locale: _locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();

const { getItemImage } = useContentImage();
const { getItemRoute, getShowRoute, getPoolRoute } = useContentRoute();
const { getSoundcloudArtwork, playTrack } = useSoundcloudArtwork();
const { navigateToTagSearch } = useTagNavigation();

const props = defineProps({
	module: { type: Object, required: true },
});

// ==================== CONSTANTS ====================
const MAIN_CITIES = ["Düsseldorf", "Leipzig", "Vienna"];
const ITEMS_PER_PAGE = 9;
const SCROLL_THRESHOLD = 30;

// Color mapping for different content types
const CONTENT_TYPE_COLORS = {
	sets: "pink",
	shows: "pink",
	words: "green",
	pool: "blue",
	persons: "blue",
	venues: "blue",
	all: "blue",
} as const;

// ==================== STATE ====================
const activeFilters = ref(new Set<string>());
const activeGenres = ref(new Set<string>());
const activeSubGenres = ref(new Set<string>());
const isOtherCitiesActive = ref(false);
const activeFilterType = ref<string | null>(null);
const showFilters = ref(true);
const showMobileFilters = ref(false);
const lastScrollY = ref(0);
const sortMode = ref<"new" | "shuffle" | "alpha">("new");
const shuffleSeed = ref(Date.now());
const visibleItemCount = ref(ITEMS_PER_PAGE);
const artworkUrls = ref(new Map<string, string>());
const moduleContainer = ref<HTMLElement | null>(null);
const filterSection = ref<HTMLElement | null>(null);

// ==================== COMPUTED: Content Type ====================
const contentType = computed(() => {
	if (!props.module) return null;
	const type = props.module.type || null;
	if (type === "pool" && props.module.poolContentType) {
		return props.module.poolContentType;
	}
	return type;
});

const categoryType = computed(() => {
	const type = contentType.value;
	if (["persons", "venues", "all"].includes(type)) return "Pool";
	if (type === "sets") return "sets";
	if (type === "shows") return "Shows";
	if (type === "words") return "Words";
	return "";
});

const _themeColor = computed(
	() => CONTENT_TYPE_COLORS[contentType.value] || "pink",
);

// ==================== HYBRID DATA LOADING ====================
// Determine if we need to load data ourselves (no pre-loaded items in props)
// Determine if we need to load data ourselves (no pre-loaded items in props OR filtering active)
const forceSelfLoad = ref(false);

const needsSelfLoad = computed(() => {
	if (forceSelfLoad.value) return true;
	if (!props.module) return false;
	const { type, poolItems, setItems, showItems, articleItems } = props.module;

	const hasItems = {
		pool: poolItems?.length > 0,
		sets: setItems?.length > 0,
		shows: showItems?.length > 0,
		words: articleItems?.length > 0,
	};

	return !hasItems[type];
});

// Self-loaded items state
// selfLoadedCount uses useState so the SSR-computed count survives
// hydration (a plain ref(0) would reset on the client and cause hydration
// mismatches in the `hasMoreItems` template branch).
const selfLoadedCountKey = `module-content-grid-count-${
	props.module?._key || props.module?.type
}-${props.module?.poolContentType || "default"}`;
const selfLoadedCount = useState<number>(selfLoadedCountKey, () => 0);
const isLoadingSelf = ref(false);
const selfLoadPage = ref(1);
const SELF_LOAD_PER_PAGE = ITEMS_PER_PAGE;

// Map module type to query type
const getModuleQueryType = computed(() => {
	if (!props.module) return null;
	const type = props.module.type;
	if (type === "pool") return "pool";
	if (type === "sets") return "sets";
	if (type === "shows") return "shows";
	if (type === "words") return "words";
	return null;
});

// Build query config for SSR-compatible data fetching
// Build query config for SSR-compatible data fetching
const buildQueryConfig = () => {
	const type = getModuleQueryType.value;
	if (!type) return null;

	const start = (selfLoadPage.value - 1) * SELF_LOAD_PER_PAGE;
	const end = selfLoadPage.value * SELF_LOAD_PER_PAGE;

	// Prepare filters
	const filterTags: string[] = [];
	const filterOrTags: string[][] = [];

	// 1. Handle Active Filters (AND logic, but "others" is special)
	if (activeFilters.value.size > 0) {
		activeFilters.value.forEach((tagId) => {
			if (tagId === "others") {
				// Special "Others" logic: OR of all non-main cities
				// Find all city tags that are NOT main cities
				const otherCityIds = categorizedTags.value.cities
					.filter((c: Tag) => !isMainCity({ title: c.title }))
					.map((c: Tag) => c._id);

				if (otherCityIds.length > 0) {
					filterOrTags.push(otherCityIds);
				}
			} else {
				filterTags.push(tagId);
			}
		});
	}

	// 2. Handle Genres/Subgenres
	// If subgenres are active, they are already in activeFilters (handled above).
	// If only top-level genres are active, we need OR logic for them and their subgenres.
	if (activeGenres.value.size > 0 && activeSubGenres.value.size === 0) {
		const genreOrGroup: string[] = [];
		activeGenres.value.forEach((genreId) => {
			genreOrGroup.push(genreId);
			// Add subgenres of this genre
			const genre = categorizedTags.value.genres.find(
				(g: Tag & { subGenres?: Tag[] }) => g._id === genreId,
			);
			genre?.subGenres?.forEach((sg: Tag) => genreOrGroup.push(sg._id));
		});
		if (genreOrGroup.length > 0) {
			filterOrTags.push(genreOrGroup);
		}
	}

	const params: Record<string, unknown> = {
		start,
		end,
		filterTags,
		filterOrTags,
	};

	switch (type) {
		case "sets":
			return { query: SET_LIST_QUERY, countQuery: SET_COUNT_QUERY, params };
		case "pool": {
			const poolType = props.module.poolContentType;
			params.types =
				poolType === "all"
					? ["person", "venue"]
					: poolType === "persons"
						? ["person"]
						: poolType === "venues"
							? ["venue"]
							: ["person", "venue"];
			return { query: POOL_LIST_QUERY, countQuery: POOL_COUNT_QUERY, params };
		}
		case "shows":
			return { query: SHOW_LIST_QUERY, countQuery: SHOW_COUNT_QUERY, params };
		case "words":
			return {
				query: ARTICLE_LIST_QUERY,
				countQuery: ARTICLE_COUNT_QUERY,
				params,
			};
		default:
			return null;
	}
};

// SSR-compatible data loading with useAsyncData
const { data: selfLoadedItems, pending: isLoadingInitial } = await useAsyncData(
	`module-content-grid-${props.module?._key || props.module?.type}-${
		props.module?.poolContentType || "default"
	}`,
	async () => {
		if (!needsSelfLoad.value) return [];

		// Safety check for query config
		const config = buildQueryConfig();
		if (!config) return [];

		try {
			const sanity = useSanity();
			// Increase timeout or handle slow connections if needed, but default fetch should be okay.
			// We wrap in try/catch to ensure page doesn't crash on one module failure.
			const [items, count] = await Promise.all([
				sanity.fetch(config.query, config.params),
				sanity.fetch(config.countQuery, config.params),
			]);

			if (typeof count === "number") {
				selfLoadedCount.value = count;
			}

			return items || [];
		} catch (error) {
			console.error("[ModuleContentGrid] SSR Data Fetch Error:", error);
			// Return empty array on error so page can still render other parts
			return [];
		}
	},
	{
		default: () => [],
		lazy: false,
	},
);

// Function to load more content (client-side only for pagination)
// Function to load content based on current filters/page
async function fetchActiveContent(reset = false) {
	const config = buildQueryConfig();
	if (!config) return;

	isLoadingSelf.value = true;
	if (reset) {
		selfLoadPage.value = 1;
		config.params.start = 0;
		config.params.end = SELF_LOAD_PER_PAGE;
		// We are entering filtered mode
		forceSelfLoad.value = true;
	}

	try {
		const sanity = useSanity();
		// Use the dynamic buildModuleQuery from queries file to construct the final query
		// Note: We need to import buildModuleQuery logic or use the strings provided.
		// However, buildQueryConfig currently returns static strings.
		// We updated module.queries.ts to export buildModuleQuery which returns the object.
		// Let's use buildModuleQuery directly instead of local switch if possible,
		// OR update buildQueryConfig to call buildModuleQuery?
		// Let's use the local switch result and inject logic here?
		// NO, the updated module queries rely on `buildModuleQuery` to assemble the GROQ.

		// RE-IMPORT from module.queries.ts
		const { buildModuleQuery } = await import("~~/queries/module.queries");

		const queryData = buildModuleQuery(
			getModuleQueryType.value as "sets" | "pool" | "shows" | "words",
			{
				start: config.params.start,
				end: config.params.end,
				contentType: config.params.types,
				filterTags: config.params.filterTags,
				filterOrTags: config.params.filterOrTags,
			},
		);

		const [items, count] = await Promise.all([
			sanity.fetch(queryData.query, queryData.params),
			sanity.fetch(queryData.countQuery, queryData.params),
		]);

		if (typeof count === "number") {
			selfLoadedCount.value = count;
		}

		if (reset) {
			selfLoadedItems.value = items || [];
		} else {
			if (selfLoadedItems.value) {
				selfLoadedItems.value = [...selfLoadedItems.value, ...(items || [])];
			}
		}
	} catch (error) {
		console.error("[ModuleContentGrid] Error fetching content:", error);
	} finally {
		isLoadingSelf.value = false;
	}
}

// Function to load more content (client-side only for pagination)
async function loadMoreSelfContent() {
	if (isLoadingSelf.value) return;
	selfLoadPage.value++;
	await fetchActiveContent(false);
}

// Watchers for filtering
watch(
	[activeFilters, activeGenres, activeSubGenres],
	() => {
		// Debounce could be added here if needed
		fetchActiveContent(true);
	},
	{ deep: true },
);

// Load more self-loaded items (renamed for clarity)
async function _loadMoreSelfItems() {
	if (isLoadingSelf.value) return;
	const currentItems = selfLoadedItems.value || [];
	if (currentItems.length >= selfLoadedCount.value) return;
	await loadMoreSelfContent();
}

// ==================== COMPUTED: Items ====================
// ==================== COMPUTED: Items ====================
const allItems = computed(() => {
	if (!props.module) return [];

	// If we're self-loading (either initial empty or filtered), return self-loaded items
	if (needsSelfLoad.value) {
		return selfLoadedItems.value;
	}

	// Otherwise use props data (existing behavior)
	const {
		type,
		poolItems,
		setItems,
		showItems,
		articleItems,
		poolContentType,
	} = props.module;

	const itemsMap = {
		pool: () => filterPoolItems(poolItems || [], poolContentType),
		sets: () => setItems || [],
		shows: () => showItems || [],
		words: () => articleItems || [],
	};

	return itemsMap[type]?.() || [];
});

function filterPoolItems(items: ContentItem[], contentType: string) {
	if (!items?.length) return [];
	const typeMap = {
		persons: "person",
		venues: "venue",
		all: ["venue", "person"],
	};
	const allowedTypes = typeMap[contentType];
	if (!allowedTypes) return items;
	return items.filter((item) =>
		Array.isArray(allowedTypes)
			? allowedTypes.includes(item._type)
			: item._type === allowedTypes,
	);
}

// ==================== COMPUTED: Tags ====================
// ==================== COMPUTED: Tags ====================
const _getUsedTagIdsInItems = computed(() => {
	// DEPRECATED: We now show all available tags regardless of content
	// Keeping this function only if other logic needed it, but clearing it out
	// to avoid confusion.
	return new Set<string>();
});

function _collectTagIds(tags: Tag[] | undefined, set: Set<string>) {
	if (!Array.isArray(tags)) return;
	tags.forEach((tag) => tag?._id && set.add(tag._id));
}

const categorizedTags = computed(() => {
	const availableTags = props.module?.availableTags;
	if (!availableTags) return { genres: [], cities: [], global: [], mood: [] };

	// Return full available tags without filtering
	const genres = (availableTags.genres || []).map(
		(genre: Tag & { subGenres?: Tag[] }) => {
			// Always include subgenres
			return { ...genre, subGenres: genre.subGenres || [] };
		},
	);

	return {
		genres,
		cities: availableTags.cities || [],
		global: availableTags.global || [],
		mood: availableTags.mood || [],
	};
});

const availableTags = computed(() => {
	if (!props.module?.availableTags) return [];
	// Return all tags flattened
	return Object.values(props.module.availableTags)
		.flat()
		.filter((tag: Tag) => tag?._id);
});

const poolTags = computed(() => {
	const tags = availableTags.value;
	const byType = (type: string) => tags.filter((t: Tag) => t._type === type);
	return {
		musicians: byType("tag.musician"),
		venues: byType("tag.venue"),
		crafts: byType("tag.crafts"),
		articles: byType("tag.article"),
	};
});

const getContentTypeSpecificTags = computed(() =>
	availableTags.value.filter((tag: Tag) => tag._type !== "tag.city"),
);

// ==================== TAG HELPERS ====================
function getItemTags(item: ContentItem, type?: string): Tag[] {
	const tags: Tag[] = [];
	const addTags = (source: Tag[] | undefined) => {
		if (!Array.isArray(source)) return;
		source.forEach((tag) => {
			if (
				tag &&
				(!type || tag._type === type) &&
				!tags.some((t) => t._id === tag._id)
			) {
				tags.push(tag);
			}
		});
	};
	addTags(item.tags);
	addTags(item.parentShow?.tags);
	return tags;
}

const getItemCityTags = (item: ContentItem) => getItemTags(item, "tag.city");
const getItemNonCityTags = (item: ContentItem) =>
	(item.tags || []).filter((t: Tag) => t._type !== "tag.city");

function getTagTitle(title: Tag["title"]): string {
	return getI18nLabel(title);
}

function isMainCity(cityTag: Tag): boolean {
	if (!cityTag?.title) return false;
	const cityName = getTagTitle(cityTag.title);
	return MAIN_CITIES.includes(cityName);
}

function getTagCategory(tagId: string): string {
	if (tagId === "others") return "city";
	const { cities, genres, mood } = categorizedTags.value;
	if (cities.some((t: Tag) => t._id === tagId)) return "city";
	if (genres.some((t: Tag) => t._id === tagId)) return "genre";
	for (const genre of genres) {
		if (genre.subGenres?.some((t: Tag) => t._id === tagId)) return "subGenre";
	}
	if (mood?.some((t: Tag) => t._id === tagId)) return "mood";

	const tag = availableTags.value.find((t: Tag) => t._id === tagId);
	const typeMap: Record<string, string> = {
		"tag.musician": "musician",
		"tag.venue": "venue",
		"tag.crafts": "crafts",
		"tag.article": "article",
	};
	return typeMap[tag?._type] || "global";
}

function getTagNameById(tagId: string): string {
	if (tagId === "others") return "Elsewhere";

	const searchSources = [
		categorizedTags.value.cities,
		categorizedTags.value.genres,
		categorizedTags.value.mood,
		categorizedTags.value.global,
		...categorizedTags.value.genres.map(
			(g: Tag & { subGenres?: Tag[] }) => g.subGenres || [],
		),
		availableTags.value,
	];

	for (const source of searchSources) {
		const found = source?.find?.((t: Tag) => t._id === tagId);
		if (found) return getTagTitle(found.title);
	}
	return "Unknown Filter";
}

// ==================== FILTER LOGIC ====================
// History to track the order of applied filters for "Remove last filter" functionality
type FilterAction = { type: "filter" | "genre" | "subGenre"; id: string };
const filterHistory = ref<FilterAction[]>([]);

function addToHistory(type: "filter" | "genre" | "subGenre", id: string) {
	// Remove if exists to ensure unique and move to end (though usually we toggle off before re-adding)
	const index = filterHistory.value.findIndex(
		(f) => f.type === type && f.id === id,
	);
	if (index > -1) filterHistory.value.splice(index, 1);
	filterHistory.value.push({ type, id });
}

function removeFromHistory(type: "filter" | "genre" | "subGenre", id: string) {
	const index = filterHistory.value.findIndex(
		(f) => f.type === type && f.id === id,
	);
	if (index > -1) filterHistory.value.splice(index, 1);
}

function removeLastFilter() {
	// Try to remove from activeFilters (Tags) first
	if (activeFilters.value.size > 0) {
		const lastFilter = [...activeFilters.value].pop();
		if (lastFilter) toggleFilter(lastFilter);
		return;
	}

	// Then SubGenres
	if (activeSubGenres.value.size > 0) {
		const lastSub = [...activeSubGenres.value].pop();
		if (lastSub) toggleSubGenreFilter(lastSub);
		return;
	}

	// Then Genres
	if (activeGenres.value.size > 0) {
		const lastGenre = [...activeGenres.value].pop();
		if (lastGenre) toggleGenreFilter(lastGenre);
		return;
	}

	// Fallback cleanup
	if (filterHistory.value.length > 0) {
		filterHistory.value = [];
	}
}

function toggleFilter(tagId: string) {
	const isActive = activeFilters.value.has(tagId);

	if (isActive) {
		activeFilters.value.delete(tagId);
		removeFromHistory("filter", tagId);

		if (getTagCategory(tagId) === "subGenre") {
			activeSubGenres.value.delete(tagId);
			removeFromHistory("subGenre", tagId);
		}
		if (tagId === "others") isOtherCitiesActive.value = false;
	} else {
		activeFilters.value.add(tagId);
		addToHistory("filter", tagId);

		if (tagId === "others") isOtherCitiesActive.value = true;
	}

	visibleItemCount.value = ITEMS_PER_PAGE;
}

function toggleGenreFilter(genreId: string) {
	if (activeGenres.value.has(genreId)) {
		activeGenres.value.delete(genreId);
		removeFromHistory("genre", genreId);

		const genre = categorizedTags.value.genres.find(
			(g: Tag & { subGenres?: Tag[] }) => g._id === genreId,
		);
		genre?.subGenres?.forEach((sg: Tag) => {
			activeSubGenres.value.delete(sg._id);
			activeFilters.value.delete(sg._id);
			removeFromHistory("subGenre", sg._id);
			removeFromHistory("filter", sg._id);
		});
	} else {
		activeGenres.value.add(genreId);
		addToHistory("genre", genreId);
	}
	visibleItemCount.value = ITEMS_PER_PAGE;
}

function toggleSubGenreFilter(subGenreId: string) {
	if (activeSubGenres.value.has(subGenreId)) {
		activeSubGenres.value.delete(subGenreId);
		removeFromHistory("subGenre", subGenreId);
		activeFilters.value.delete(subGenreId);
		removeFromHistory("filter", subGenreId);
	} else {
		activeSubGenres.value.add(subGenreId);
		addToHistory("subGenre", subGenreId);
		activeFilters.value.add(subGenreId);
		addToHistory("filter", subGenreId);
	}
	visibleItemCount.value = ITEMS_PER_PAGE;
}

function toggleFilterType(type: string) {
	activeFilterType.value = activeFilterType.value === type ? null : type;
}

function resetFilters() {
	activeFilters.value.clear();
	activeGenres.value.clear();
	activeSubGenres.value.clear();
	filterHistory.value = [];
	isOtherCitiesActive.value = false;
}

// ==================== ITEM MATCHING ====================
function itemHasTag(item: ContentItem, tagId: string): boolean {
	return getItemTags(item).some((t) => t._id === tagId);
}

function itemMatchesFilters(item: ContentItem): boolean {
	// Genre filter check
	if (activeGenres.value.size > 0) {
		if (activeSubGenres.value.size > 0) {
			// SubGenres selected: item must have ALL selected subgenres
			for (const subGenreId of activeSubGenres.value) {
				if (!itemHasTag(item, subGenreId)) return false;
			}
		} else {
			// Only genres selected: item must have at least one genre or its subgenres
			const allowedIds = new Set<string>();
			activeGenres.value.forEach((gId) => {
				allowedIds.add(gId);
				categorizedTags.value.genres
					.find((g) => g._id === gId)
					?.subGenres?.forEach((sg) => allowedIds.add(sg._id));
			});
			if (!getItemTags(item).some((t) => allowedIds.has(t._id))) return false;
		}
	}

	// Normal filters check (AND logic)
	// Normal filters check (AND logic)
	// When using server-side filtering, 'itemMatchesFilters' mainly serves to double-check
	// or handle "Others" if not fully handled server-side?
	// However, since we now fetch EXACT data, this check might filter out things we just fetched?
	// Example: If I implemented "Others" as "OR", but client side checks "!isMainCity".
	// It should be consistent.
	// BUT: if we are in server-side mode (forceSelfLoad), we should TRUST the server result?
	// If we run 'itemMatchesFilters' on server-fetched data, we might accidentally hide items
	// if our client-side logic is stricter or different.
	if (forceSelfLoad.value) return true;

	if (activeFilters.value.size === 0) return true;

	for (const filterId of activeFilters.value) {
		if (filterId === "others") {
			const cityTags = getItemCityTags(item);
			if (cityTags.length > 0 && !cityTags.every((t) => !isMainCity(t)))
				return false;
		} else if (!itemHasTag(item, filterId)) {
			return false;
		}
	}
	return true;
}

// ==================== SORTING ====================
function changeSortMode(mode: "new" | "shuffle" | "alpha") {
	if (mode === "shuffle") shuffleSeed.value = Date.now();
	sortMode.value = mode;
}

function seededRandom(seed: number) {
	return () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
}

function shuffleArray<T>(array: T[], seed: number): T[] {
	const arr = [...array];
	const rng = seededRandom(seed);
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

const filteredItems = computed(() => {
	const items = allItems.value.filter(itemMatchesFilters);

	const sortFns = {
		new: (a, b) =>
			new Date(b.datetime || b._updatedAt || b._createdAt || 0).getTime() -
			new Date(a.datetime || a._updatedAt || a._createdAt || 0).getTime(),
		alpha: (a, b) =>
			(a.title || a.name || a.parentShow?.title || "")
				.toLowerCase()
				.localeCompare(
					(b.title || b.name || b.parentShow?.title || "").toLowerCase(),
				),
		shuffle: null,
	};

	if (sortMode.value === "shuffle")
		return shuffleArray(items, shuffleSeed.value);
	return items.sort(sortFns[sortMode.value]);
});

const visibleItems = computed(() => {
	return filteredItems.value.slice(0, visibleItemCount.value);
});

const hasMoreItems = computed(() => {
	if (visibleItems.value.length < filteredItems.value.length) return true;
	if (
		needsSelfLoad.value &&
		(selfLoadedItems.value?.length ?? 0) < selfLoadedCount.value
	) {
		return true;
	}
	return false;
});

async function loadMoreItems() {
	const nextVisibleCount = visibleItemCount.value + ITEMS_PER_PAGE;

	if (needsSelfLoad.value) {
		while (
			(selfLoadedItems.value?.length ?? 0) < nextVisibleCount &&
			(selfLoadedItems.value?.length ?? 0) < selfLoadedCount.value
		) {
			await loadMoreSelfContent();
		}
	}

	visibleItemCount.value = nextVisibleCount;
}

// ==================== UI HELPERS ====================
function toggleFiltersVisibility() {
	showFilters.value = !showFilters.value;
}

function toggleMobileFilters() {
	showMobileFilters.value = !showMobileFilters.value;
	if (showMobileFilters.value) {
		showFilters.value = true;
		document.body.style.overflow = "hidden";
	} else {
		document.body.style.overflow = "";
	}
}

function handleScroll() {
	if (showMobileFilters.value) return;

	const scrollY = window.scrollY;
	const scrollDiff = scrollY - lastScrollY.value;

	let isStuck = false;
	if (filterSection.value) {
		const rect = filterSection.value.getBoundingClientRect();
		const style = window.getComputedStyle(filterSection.value);
		const stickyTop = parseInt(style.top, 10);

		// Check if the element is currently stuck (top position matches sticky offset)
		if (!Number.isNaN(stickyTop) && Math.abs(rect.top - stickyTop) <= 2) {
			isStuck = true;
		}
	}

	if (isStuck) {
		if (scrollDiff > SCROLL_THRESHOLD && showFilters.value) {
			showFilters.value = false;
		} else if (scrollDiff < -20 && !showFilters.value) {
			showFilters.value = true;
		}
	} else {
		// If not stuck (e.g. at/near top of page), ensure filters are visible
		if (!showFilters.value) showFilters.value = true;
	}

	lastScrollY.value = scrollY;
}

function formatDate(dateString: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

async function _checkImage(url: string): Promise<boolean> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
	});
}

function loadArtworkUrl(item: ContentItem) {
	if (!item) return;
	const url = getSoundcloudArtwork(item);
	artworkUrls.value.set(item._id, url);
}

// ==================== LIFECYCLE ====================
// Client-side only setup (scroll handling, artwork loading)
onMounted(() => {
	// Load artwork URLs for initially visible items (client-only)
	if (contentType.value === "sets") {
		visibleItems.value.forEach(loadArtworkUrl);
	}

	lastScrollY.value = window.scrollY;
	window.addEventListener("scroll", handleScroll, { passive: true });
});

// Load artwork URLs when more items become visible
watch(visibleItemCount, () => {
	if (contentType.value === "sets") {
		visibleItems.value.forEach((item: ContentItem) => {
			if (!artworkUrls.value.has(item._id)) {
				loadArtworkUrl(item);
			}
		});
	}
});

onUnmounted(() => {
	window.removeEventListener("scroll", handleScroll);
	// Reset body overflow on unmount
	document.body.style.overflow = "";
});
</script>
<template>
	<div v-if="isLoadingInitial && needsSelfLoad" class="module-loading">
		<div class="loading-skeleton">
			<div class="skeleton-header"/>
			<div class="skeleton-grid">
				<div
					v-for="i in 9"
					:key="i"
					class="skeleton-item"/>
			</div>
		</div>
	</div>
	<div
		v-if="module"
		ref="moduleContainer"
		:class="`content-grid module-grid module-grid--${
			module.style || 'default'
		} ${categoryType.toLowerCase()}`"
	>
		<!-- Mobile: compact filter toggle -->
		<button
			class="content-grid__mobile-filter-trigger"
			:class="{ 'is-open': showMobileFilters }"
			:aria-expanded="showMobileFilters"
			aria-label="Toggle filters"
			@click="toggleMobileFilters"
		>
			<svg
				class="content-grid__mobile-filter-trigger__icon"
				width="35"
				height="29"
				viewBox="0 0 35 29"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path d="M0 14.5C0 6.49187 6.49187 0 14.5 0H35V29H14.5C6.49187 29 0 22.5081 0 14.5Z" fill="currentColor"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M17.6303 6.88281C21.8519 6.88281 25.2797 10.3106 25.2797 14.5323C25.2797 18.7545 21.8519 22.1823 17.6303 22.1823C13.4081 22.1823 9.98047 18.7545 9.98047 14.5323C9.98047 10.3106 13.4081 6.88281 17.6303 6.88281ZM17.6303 9.18605C14.6791 9.18605 12.2837 11.5817 12.2837 14.5323C12.2837 17.4834 14.6791 19.879 17.6303 19.879C20.5808 19.879 22.9765 17.4834 22.9765 14.5323C22.9765 11.5817 20.5808 9.18605 17.6303 9.18605Z" fill="#2C2C2C"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M26.5871 14.8919C26.3889 14.8919 26.228 14.7313 26.228 14.5327C26.228 14.3349 26.3889 14.1738 26.5871 14.1738H27.7087C27.9068 14.1738 28.0676 14.3349 28.0676 14.5327C28.0676 14.7313 27.9068 14.8919 27.7087 14.8919H26.5871Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M7.35904 14.8919C7.16092 14.8919 7 14.7313 7 14.5327C7 14.3349 7.16092 14.1738 7.35904 14.1738H8.48066C8.67877 14.1738 8.83953 14.3349 8.83953 14.5327C8.83953 14.7313 8.67877 14.8919 8.48066 14.8919H7.35904Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M17.8929 5.48081C17.8929 5.67892 17.7322 5.83984 17.5336 5.83984C17.3359 5.83984 17.1748 5.67892 17.1748 5.48081V4.35919C17.1748 4.16107 17.3359 4.00032 17.5336 4.00032C17.7322 4.00032 17.8929 4.16107 17.8929 4.35919V5.48081Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M17.8929 24.7093C17.8929 24.9074 17.7322 25.0684 17.5336 25.0684C17.3359 25.0684 17.1748 24.9074 17.1748 24.7093V23.5877C17.1748 23.3896 17.3359 23.2288 17.5336 23.2288C17.7322 23.2288 17.8929 23.3896 17.8929 23.5877V24.7093Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M24.1894 8.38476C24.0493 8.52485 23.8219 8.52502 23.6815 8.3846C23.5417 8.24478 23.5415 8.01707 23.6816 7.87698L24.4747 7.08388C24.6148 6.94379 24.8424 6.94404 24.9822 7.08385C25.1226 7.22428 25.1226 7.45156 24.9825 7.59165L24.1894 8.38476Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M10.5932 21.9824C10.4531 22.1225 10.2257 22.1227 10.0853 21.9823C9.94547 21.8424 9.94533 21.6147 10.0854 21.4746L10.8785 20.6815C11.0186 20.5414 11.2462 20.5417 11.386 20.6815C11.5264 20.8219 11.5264 21.0492 11.3863 21.1893L10.5932 21.9824Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M23.6812 21.1874C23.5411 21.0473 23.5409 20.8199 23.6813 20.6795C23.8211 20.5397 24.0488 20.5396 24.1889 20.6797L24.982 21.4728C25.1221 21.6129 25.1219 21.8404 24.9821 21.9803C24.8416 22.1207 24.6144 22.1206 24.4743 21.9805L23.6812 21.1874Z" fill="white"/>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M10.085 7.59369C9.94488 7.45359 9.94471 7.22619 10.0851 7.08577C10.2249 6.94596 10.4527 6.94582 10.5927 7.08591L11.3858 7.87901C11.5259 8.0191 11.5257 8.2467 11.3859 8.38651C11.2454 8.52693 11.0182 8.52688 10.8781 8.38679L10.085 7.59369Z" fill="white"/>
				<g class="content-grid__mobile-filter-trigger__knob">
					<circle cx="17.5" cy="15.5" r="6.5" fill="#4B4A4A"/>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M16.2842 7.73676C16.2842 6.99383 16.8873 6.39062 17.6304 6.39062C18.373 6.39062 18.9765 6.99383 18.9765 7.73676L18.9765 13.1117C18.9765 13.8549 18.373 14.4578 17.6304 14.4578C16.8873 14.4578 16.2842 13.8549 16.2842 13.1117L16.2842 7.73676Z" fill="white"/>
				</g>
			</svg>
			<span v-if="activeFilters.size > 0" class="filter-count">{{ activeFilters.size }}</span>
		</button>

		<Transition name="mobile-filter-backdrop">
			<div
				v-if="showMobileFilters"
				class="content-grid__mobile-filter-backdrop"
				@click="toggleMobileFilters"
			/>
		</Transition>

		<!-- Desktop Filter Panel -->
		<div
			ref="filterSection"
			class="content-grid__filter-section"
			:class="{ 'is-mobile-open': showMobileFilters }"
		>
			<div class="content-grid__filter-bar content-grid__filter-bar--desktop">
				<!-- Active Filters -->
				<div class="active-filters">
					<h4
						class="active-filters__title"
						:class="{ active: activeFilters.size > 0 }"
					>
						<span class="close-cross" @click="removeLastFilter()">
							<svg
								width="10"
								height="10"
								viewBox="0 0 8 8"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="4"
									cy="4"
									r="4"
									fill="black" />
								<rect
									x="1.77783"
									y="2.4082"
									width="0.888889"
									height="5.33333"
									transform="rotate(-45 1.77783 2.4082)"
									fill="#E8E8E8"
								/>
								<path
									d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
									fill="#E8E8E8"
								/>
							</svg>
						</span>
						<span @click="toggleFiltersVisibility"
						>Tags&nbsp;<span class="toggle-arrow">{{
							showFilters ? "↑" : "↓"
						}}</span></span
						>
					</h4>
					<div class="active-filters__list tags">
						<div
							v-for="filterId in activeFilters"
							:key="filterId"
							class="active-filter tag"
						>
							<span class="active-filter__name" @click="toggleFilter(filterId)">
								{{ getTagNameById(filterId) }}
								<span class="close-cross">
									<svg
										width="10"
										height="10"
										viewBox="0 0 8 8"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle
											cx="4"
											cy="4"
											r="4"
											fill="black" />
										<rect
											x="1.77783"
											y="2.4082"
											width="0.888889"
											height="5.33333"
											transform="rotate(-45 1.77783 2.4082)"
											fill="#E8E8E8"
										/>
										<path
											d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
											fill="#E8E8E8"
										/>
									</svg>
								</span>
							</span>
						</div>
					</div>
				</div>

				<!-- Cities Filter -->
				<div
					v-if="categorizedTags.cities?.length > 0"
					class="filter-cities tags"
				>
					<h4 class="filter-cities__title">City</h4>
					<div class="filter-tags">
						<button
							v-for="tag in categorizedTags.cities.filter(isMainCity)"
							:key="tag._id"
							class="tag filter-tag filter-tag--city"
							:class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
							@click="toggleFilter(tag._id)"
						>
							{{ getI18nLabel(tag.title) }}
						</button>
						<button
							v-if="categorizedTags.cities.some((tag) => !isMainCity(tag))"
							class="tag filter-tag filter-tag--city"
							:class="{ 'filter-tag--active': isOtherCitiesActive }"
							@click="toggleFilter('others')"
						>
							Elsewhere
						</button>
					</div>
				</div>

				<!-- Sort Options -->
				<div class="sort-options">
					<h4 class="sort-options__title">Sort</h4>
					<button
						:class="['sort-button', { active: sortMode === 'new' }]"
						@click="changeSortMode('new')"
					>
						<div class="dot"/>
						New
					</button>
					<button
						:class="['sort-button', { active: sortMode === 'alpha' }]"
						@click="changeSortMode('alpha')"
					>
						<div class="dot"/>
						A–Z
					</button>
					<button
						:class="['sort-button', { active: sortMode === 'shuffle' }]"
						@click="changeSortMode('shuffle')"
					>
						<div class="dot"/>
						Shuffle
					</button>
				</div>
			</div>

			<!-- Mobile filter panel -->
			<div v-if="showMobileFilters" class="content-grid__mobile-filter">
				<div
					v-if="categorizedTags.cities?.length > 0"
					class="content-grid__mobile-filter-block content-grid__mobile-filter-block--city"
				>
					<h4 class="content-grid__mobile-filter-block__title">City</h4>
					<div class="content-grid__mobile-filter-block__panel">
						<div class="content-grid__mobile-filter-cities__tags">
							<button
								v-for="tag in categorizedTags.cities.filter(isMainCity)"
								:key="tag._id"
								class="tag filter-tag filter-tag--city"
								:class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
								@click="toggleFilter(tag._id)"
							>
								{{ getI18nLabel(tag.title) }}
							</button>
							<button
								v-if="categorizedTags.cities.some((tag) => !isMainCity(tag))"
								class="tag filter-tag filter-tag--city"
								:class="{ 'filter-tag--active': isOtherCitiesActive }"
								@click="toggleFilter('others')"
							>
								Elsewhere
							</button>
						</div>
					</div>
				</div>

				<div
					class="content-grid__mobile-filter-block content-grid__mobile-filter-block--tags"
					:class="{
						'has-filter-tags': module.availableTags,
						'has-active-filters': activeFilters.size > 0,
					}"
				>
					<h4 class="content-grid__mobile-filter-block__title">Tags</h4>
					<div
						v-if="activeFilters.size > 0"
						class="content-grid__mobile-filter-block__panel"
					>
						<div class="content-grid__mobile-filter-active">
							<button
								type="button"
								class="content-grid__mobile-filter-active__clear"
								aria-label="Remove last filter"
								@click="removeLastFilter"
							>
								<svg
									width="10"
									height="10"
									viewBox="0 0 8 8"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<circle cx="4" cy="4" r="4" fill="black" />
									<rect
										x="1.77783"
										y="2.4082"
										width="0.888889"
										height="5.33333"
										transform="rotate(-45 1.77783 2.4082)"
										fill="#E8E8E8"
									/>
									<path
										d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
										fill="#E8E8E8"
									/>
								</svg>
							</button>
							<div class="active-filters__list tags">
								<div
									v-for="filterId in activeFilters"
									:key="filterId"
									class="active-filter tag"
								>
									<span
										class="active-filter__name"
										@click="toggleFilter(filterId)"
									>
										{{ getTagNameById(filterId) }}
										<span class="close-cross">
											<svg
												width="10"
												height="10"
												viewBox="0 0 8 8"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<circle cx="4" cy="4" r="4" fill="black" />
												<rect
													x="1.77783"
													y="2.4082"
													width="0.888889"
													height="5.33333"
													transform="rotate(-45 1.77783 2.4082)"
													fill="#E8E8E8"
												/>
												<path
													d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
													fill="#E8E8E8"
												/>
											</svg>
										</span>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="content-grid__mobile-filter-bar">
					<div class="mobile-sort-options">
						<button
							:class="['sort-button', { active: sortMode === 'new' }]"
							@click="changeSortMode('new')"
						>
							<div class="dot" />
							New
						</button>
						<button
							:class="['sort-button', { active: sortMode === 'alpha' }]"
							@click="changeSortMode('alpha')"
						>
							<div class="dot" />
							A–Z
						</button>
						<button
							:class="['sort-button', { active: sortMode === 'shuffle' }]"
							@click="changeSortMode('shuffle')"
						>
							<div class="dot" />
							Shuffle
						</button>
					</div>
				</div>
			</div>

			<!-- Filter Tags Panel -->
			<div
				v-if="module.availableTags"
				class="content-grid__filters"
				:class="{
					'content-grid__filters--in-mobile-panel': showMobileFilters,
					'content-grid__filters--no-active-above':
						showMobileFilters && activeFilters.size === 0,
				}"
			>
				<div class="filter-container tags">
					<!-- Sets: Genre Filter -->
					<template v-if="contentType === 'sets'">
						<div
							v-if="categorizedTags.genres?.length > 0"
							class="filter-category tags"
							:class="{ active: showFilters }"
						>
							<div class="filter-genres">
								<div
									v-for="genre in categorizedTags.genres"
									:key="genre._id"
									class="filter-genre"
								>
									<button
										class="tag filter-tag filter-tag--genre"
										:class="{
											'filter-tag--active': activeGenres.has(genre._id),
										}"
										@click="toggleGenreFilter(genre._id)"
									>
										{{ genre.title }}
									</button>
								</div>
							</div>
							<div class="filter-subgenres">
								<div v-if="activeGenres.size > 0" class="filter-subgenre">
									<div class="filter-subgenre__tags">
										<template
											v-for="genre in categorizedTags.genres.filter((g) =>
												activeGenres.has(g._id)
											)"
											:key="genre._id"
										>
											<button
												v-for="subGenre in genre.subGenres || []"
												:key="subGenre._id"
												class="tag filter-tag filter-tag--subgenre"
												:class="{
													'filter-tag--active': activeSubGenres.has(
														subGenre._id
													),
												}"
												@click="toggleSubGenreFilter(subGenre._id)"
											>
												{{ subGenre.title }}
											</button>
										</template>
									</div>
								</div>
							</div>
						</div>
					</template>

					<!-- Words: Article Tags -->
					<template v-else-if="contentType === 'words'">
						<div
							v-if="poolTags.articles.length > 0"
							class="filter-category tags"
							:class="{ active: showFilters }"
						>
							<div class="filter-tags tags">
								<button
									v-for="tag in poolTags.articles"
									:key="tag._id"
									class="filter-tag tag"
									:class="{
										'filter-tag--active': activeFilters.has(tag._id),
									}"
									@click="toggleFilter(tag._id)"
								>
									{{ getI18nLabel(tag.title) }}
								</button>
							</div>
						</div>
					</template>

					<!-- Pool: Type Filters -->
					<template v-else>
						<div
							v-if="getContentTypeSpecificTags.length > 0"
							class="filter-category tags"
							:class="{ active: showFilters }"
						>
							<div class="filter-tags tags">
								<button
									v-if="poolTags.musicians.length > 0"
									class="filter-type tag"
									:class="{
										'filter-type--active': activeFilterType === 'musicians',
									}"
									@click="toggleFilterType('musicians')"
								>
									Musicians
								</button>
								<button
									v-if="poolTags.venues.length > 0"
									class="filter-type tag"
									:class="{
										'filter-type--active': activeFilterType === 'venues',
									}"
									@click="toggleFilterType('venues')"
								>
									Venues
								</button>
								<button
									v-if="poolTags.crafts.length > 0"
									class="filter-type tag"
									:class="{
										'filter-type--active': activeFilterType === 'crafts',
									}"
									@click="toggleFilterType('crafts')"
								>
									Crafts
								</button>
							</div>
							<div
								v-if="
									activeFilterType && poolTags[activeFilterType]?.length > 0
								"
								class="filter-tags tags"
							>
								<button
									v-for="tag in poolTags[activeFilterType]"
									:key="tag._id"
									class="filter-tag tag"
									:class="{
										'filter-tag--active': activeFilters.has(tag._id),
									}"
									@click="toggleFilter(tag._id)"
								>
									{{ getI18nLabel(tag.title) }}
								</button>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>

		<!-- Content Grid -->
		<div class="content-grid__container">
			<div v-if="visibleItems.length > 0" class="content-grid__items">
				<div
					v-for="item in visibleItems"
					:key="item._id"
					:class="`grid-item grid-item--${module.style || 'default'}`"
				>
					<!-- City Tags -->
					<div
						v-if="contentType !== 'words'"
						class="grid-item__tags city-tags"
					>
						<span
							v-for="tag in getItemCityTags(item)"
							:key="tag._id"
							class="tag city"
						>{{ getI18nLabel(tag?.short) }}</span
						>
					</div>

					<!-- Image -->
					<NuxtLink
						v-if="item?.slug"
						:to="getItemRoute(item)"
						class="grid-item__link"
					>
						<div class="grid-item__image">
							<template v-if="contentType === 'sets'">
								<img
									v-if="item.image?.asset"
									:src="item.image.asset.url"
									:alt="item.title || ''"
									loading="lazy"
								>
								<div
									v-else-if="item.soundcloud"
									class="track-artwork"
									@vue:mounted="loadArtworkUrl(item)"
								>
									<img
										v-if="artworkUrls.get(item._id)"
										:src="artworkUrls.get(item._id)"
										alt="Track Artwork"
										loading="lazy"
									>
								</div>
							</template>
							<template v-else>
								<img
									v-if="getItemImage(item)"
									:src="getItemImage(item).asset?.url"
									:alt="item.title || ''"
									loading="lazy"
								>
								<img
									v-else
									:src="
										mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
									"
									alt="Fallback"
									loading="lazy"
								>
							</template>
						</div>
					</NuxtLink>

					<!-- Content -->
					<div class="grid-item__content">
						<section
							v-if="contentType !== 'words'"
							class="grid-item__content__interactive"
						>
							<div
								v-if="item.datetime || item.publishedAt"
								class="grid-item__date"
							>
								{{ formatDate(item.datetime || item.publishedAt) }}
							</div>
							<button
								v-if="contentType === 'sets' && item.soundcloud"
								class="play-button"
								@click.prevent="playTrack(item)"
							>
								<span class="sr-only">Play</span>
								<svg
									width="9"
									height="12"
									viewBox="0 0 9 12"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M9 6L0 11.1962L0 0.803847L9 6Z"
										fill="currentColor"
									/>
								</svg>
							</button>
						</section>

						<!-- Set Content -->
						<div v-if="item.parentShow && contentType === 'sets'">
							<!-- Only show parent show link if NOT no-show -->
							<NuxtLink
								v-if="
									item.parentShow?.title?.toLowerCase() !== 'no-show' &&
										item.parentShow?.slug
								"
								:to="getShowRoute(item.parentShow)"
								class="grid-item__link"
							>
								<h3 class="grid-item__title show-title">
									{{ item.parentShow?.title }}
								</h3>
							</NuxtLink>
							<!-- If no-show: show only set title -->
							<h3 v-else-if="item?.title" class="grid-item__title show-title">
								{{ item?.title }}
							</h3>
							<div v-if="item.persons?.length > 0" class="show-artists">
								<h3
									v-for="(artist, index) in item.persons"
									:key="artist._id"
									class="grid-item__artist"
								>
									<NuxtLink
										v-if="artist?.poolVisibility"
										:to="getPoolRoute(artist)"
										class="grid-item__link"
									>
										{{ artist.title
										}}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
									</NuxtLink>
									<span v-else
									>{{ artist.title
									}}{{
										index < item.persons.length - 1 ? "," : ""
									}}&nbsp;</span
									>
								</h3>
							</div>
						</div>

						<!-- Words: Read More -->
						<div v-if="contentType === 'words'" class="tags read-more">
							<NuxtLink
								:to="getItemRoute(item)"
								class="grid-item__link"
							><h3 class="tag">Read More</h3></NuxtLink
							>
						</div>

						<!-- Title -->
						<NuxtLink :to="getItemRoute(item)" class="grid-item__link">
							<h3 v-if="contentType !== 'sets'" class="grid-item__title">
								{{ item.title || item.name }}
							</h3>
						</NuxtLink>

						<!-- Teaser Text -->
						<RichText
							v-if="contentType === 'words'"
							:blocks="parseI18nObj(item?.textTeaser)"
						/>
						<RichText
							v-else-if="item?.useTeaserText && item?.textTeaser"
							:blocks="parseI18nObj(item?.textTeaser)"
						/>
						<RichText
							v-else-if="!item?.useTeaserText && item?.text?.length > 0"
							:blocks="parseI18nObj(item?.text)?.slice(0, 1)"
						/>
						<RichText
							v-else-if="
								!item?.text &&
									item?.description?.length > 0 &&
								parseI18nObj(item?.description)
							"
							:blocks="
								limitTextBlocks(
									parseI18nObj(item?.description)?.slice(0, 1),
									100
								)
							"
						/>
						<RichText
							v-else-if="
								!item?.text &&
									module.poolContentType === 'persons' &&
									mainStore?.siteFallbacks?.fallbackPerson?.description?.length >
									0
							"
							:blocks="
								limitTextBlocks(
									parseI18nObj(
										mainStore?.siteFallbacks?.fallbackPerson?.description
									)?.slice(0, 1),
									100
								)
							"
						/>
						<RichText
							v-else-if="
								!item?.text &&
									module.poolContentType === 'venues' &&
									mainStore?.siteFallbacks?.fallbackVenue?.description?.length > 0
							"
							:blocks="
								limitTextBlocks(
									parseI18nObj(
										mainStore?.siteFallbacks?.fallbackVenue?.description
									)?.slice(0, 1),
									100
								)
							"
						/>

						<!-- Words: Non-City Tags -->
						<div
							v-if="
								contentType === 'words' &&
									module.showTags &&
									getItemNonCityTags(item).length > 0
							"
							class="grid-item__tags tags"
						>
							<button
								v-for="tag in getItemNonCityTags(item)"
								:key="tag._id"
								class="tag clickable"
								@click.prevent="navigateToTagSearch(tag, item)"
							>
								{{ getI18nLabel(tag?.title) }}
							</button>
						</div>

						<!-- Non-City Tags -->
						<div
							v-else-if="getItemNonCityTags(item).length > 0"
							class="grid-item__tags tags"
						>
							<span
								v-for="tag in getItemNonCityTags(item)"
								:key="tag._id"
								class="tag"
							>{{ getI18nLabel(tag.title) }}</span
							>
						</div>
					</div>
				</div>
			</div>
			<div v-else class="content-grid__no-results">
				<p>No matching content.</p>
				<div class="no-results-buttons">
					<button
						v-if="filterHistory.length > 0"
						class="action-btn"
						@click="removeLastFilter"
					>
						Remove last filter
					</button>
					<button
						v-if="activeFilters.size > 0 || activeGenres.size > 0"
						class="action-btn"
						@click="resetFilters"
					>
						Clear all filters
					</button>
				</div>
			</div>

			<!-- Load More -->
			<div v-if="hasMoreItems" class="content-grid__load-more">
				<button class="load-more-button" @click="loadMoreItems">
					<svg
						width="15"
						height="15"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M7.67578 0.541016V14.8113" stroke-width="5" />
						<path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" />
					</svg>
				</button>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
/* ==================== LOADING SKELETON ==================== */
.module-loading {
  width: 100%;
  max-width: var(--page-max-width);
  padding: var(--mid-padding);
}

.loading-skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  width: 200px;
  height: 24px;
  background: var(--color-fg-muted, #e0e0e0);
  border-radius: 4px;
  margin-bottom: var(--mid-margin, 1rem);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--mid-gap, 1rem);
}

.skeleton-item {
  aspect-ratio: 1 / 1;
  background: var(--color-fg-muted, #e0e0e0);
  border-radius: 4px;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ==================== BASE STYLES ==================== */
.content-grid {
  position: relative;
  max-width: clamp(100%, 100%, var(--page-max-width));
  width: 100%;

  /* Theme colors via CSS custom properties */
  --theme-color: var(--color-pink);

  /* Mobile filter trigger - hidden on desktop */
  &__mobile-filter-trigger {
    display: none;
  }

  &__mobile-filter {
    display: none;
  }

  &__mobile-filter-backdrop {
    display: none;
  }

  &.words {
    --theme-color: var(--color-green);
  }
  &.pool {
    --theme-color: var(--color-blue);
  }
  &.shows,
  &.sets {
    --theme-color: var(--color-pink);
  }

  /* Shared active states using theme color */
  .active-filters__title.active,
  .sort-options button.active,
  .sort-options button:hover {
    color: var(--theme-color);
  }

  .sort-options button.active .dot,
  .sort-options button:hover .dot {
    background-color: var(--theme-color);
  }

  .filter-cities .filter-tag.filter-tag--active,
  .filter-cities .filter-tag:hover {
    @media (min-width: 1024px) {
      background-color: var(--theme-color);
      color: var(--color-bg);
    }
  }

  .filter-toggle__button:hover {
    @media (min-width: 1024px) {
      background-color: var(--theme-color);
      color: var(--color-bg);
    }
  }

  &__no-results {
    padding: 30svh var(--mid-padding);
    text-align: center;
    margin-bottom: var(--mid-margin);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--small-padding);

    .no-results-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--small-padding);
      margin-top: var(--small-margin);
    }

    .action-btn {
      padding: var(--small-padding) var(--mid-padding);
      border: 1px solid var(--color-text);
      border-radius: 100px;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-text);
      font-size: var(--small-font-size);
      text-transform: uppercase;
      transition: all 0.2s ease;

      &:hover {
        background: var(--color-text);
        color: var(--color-bg);
      }
    }
  }

  &__filter-section {
    position: sticky;
    top: calc(var(--nav-height) + var(--first-content-distance));
    z-index: 9999;
    padding-bottom: var(--small-padding);
    margin-left: calc(var(--big-margin) * -1);
    margin-right: calc(var(--big-margin) * -1);
    padding-left: var(--big-margin);
    padding-right: var(--big-margin);
    border-radius: 100px;
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(
        var(--first-content-distance) +
          (var(--small-padding) * 2 + var(--small-font-size) / 2)
      );
      background-color: var(--color-bg);
      z-index: -1;
      transform: translateY(
        calc(-100% + (var(--small-padding) * 2 + var(--small-font-size) / 2))
      );
    }
  }

  &__filter-bar {
    position: relative;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    padding: var(--small-padding) 0;
    background-color: var(--color-text);
    border-radius: 100px;
    z-index: 50;

    .active-filters {
      width: calc(33% - var(--big-margin) / 2 + (var(--mid-margin) / 2) - 1px);
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      padding: 0 0 0 var(--mid-margin);
      border-right: 1px solid var(--color-grey);
      overflow-x: scroll;
      -ms-overflow-style: none;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }

      &__title {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        justify-content: center;
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
        height: var(--small-font-size);
        cursor: pointer;

        .toggle-arrow {
          position: absolute;
          font-size: var(--small-font-size);
          transform: translate(0, -1px);
        }

        &.active {
          cursor: pointer;
          .close-cross {
            display: block;
          }
        }

        .close-cross {
          display: none;
          position: absolute;
          transform: translate(calc(-100% - 12px), -0.5px);
          filter: invert(1);
        }
      }

      &__list {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: center;
        overflow: scroll;
        gap: 0 var(--small-padding);
        position: relative;
        -ms-overflow-style: none;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .active-filter {
        background-color: var(--theme-color);
        color: white;
        font-size: var(--small-font-size);
        letter-spacing: var(--button-letter-spacing);
        font-family: var(--font-text);
        position: relative;
        min-width: max-content;

        .close-cross {
          transform: translate(0, -1px);
          right: 6px;
          position: absolute;
        }

        &__name {
          min-width: max-content;
          cursor: pointer;
          font-size: var(--small-font-size);
          letter-spacing: var(--button-letter-spacing);
          font-family: var(--font-text);
          padding: 0 8px 0 0;
        }
      }
    }

    .filter-cities {
      width: calc(33% + var(--big-margin) / 2 + (var(--mid-margin) / 2));
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      padding: 0 calc(var(--mid-margin) / 2);

      &__title {
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
      }

      .filter-tags {
        display: flex;
        flex-flow: row nowrap;
        overflow-x: visible;
        justify-content: flex-start;
        align-items: center;
        gap: 0 var(--small-padding);

        .filter-tag {
          background-color: var(--color-dark-grey);
          color: var(--color-text);
          @media (prefers-color-scheme: dark) {
            background-color: var(--color-dark-grey);
          }
        }
      }
    }

    .sort-options {
      width: calc(33% - var(--big-margin) / 2 + (var(--mid-margin) / 2));
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--mid-margin);
      padding: 0 var(--mid-margin) 0 calc(var(--mid-margin) / 2);
      border-left: 1px solid var(--color-grey);

      &__title {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        justify-content: center;
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
        pointer-events: none;
      }

      button {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: center;
        gap: var(--small-padding);
        background-color: transparent;
        font-size: var(--small-font-size);
        color: var(--color-dark-grey);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        @media (prefers-color-scheme: dark) {
          color: var(--color-bg);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-dark-grey);
          @media (prefers-color-scheme: dark) {
            background-color: var(--color-bg);
          }
        }
      }
    }
  }

  &__filters {
    .filter-container {
      display: flex;
      flex-direction: column;
      gap: var(--mid-padding);
    }

    .filter-category {
      width: var(--page-max-width);
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      row-gap: var(--small-padding);
      background-color: var(--color-bg-transparent);
      transform: translate(0, calc(var(--mid-padding) * -1.75));
      padding: calc(var(--mid-padding) * 1.75) 0 var(--mid-padding);
      backdrop-filter: blur(10px);
      border-bottom-right-radius: 1.56125rem;
      border-bottom-left-radius: 1.56125rem;
      border: 1px solid var(--color-bg);
      z-index: 1;
      transition: all 0.2s ease;
      opacity: 0;
      &.active {
        opacity: 1;
      }
    }

    .filter-genres,
    .filter-tags {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      justify-content: center;
      margin: var(--base-padding) auto 0;
      max-width: 66%;
      width: 66%;
      gap: var(--small-padding);
    }

    .filter-genre,
    .filter-type {
      display: flex;
      flex-flow: row wrap;
      gap: calc(var(--small-padding) / 2);
    }

    .filter-type {
      background-color: var(--color-bg);
      color: var(--color-text);
      &--active {
        background-color: var(--color-text);
        color: var(--color-bg);
      }
    }

    .filter-subgenres {
      margin-left: var(--mid-padding);
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      gap: var(--small-padding);

      .filter-subgenre {
        width: 100%;
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        align-items: center;
        gap: var(--small-padding);

        &__tags {
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: var(--small-padding);
        }
      }
    }

    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
      cursor: pointer;
      width: 100%;
      justify-content: center;
      align-items: center;
    }

    .filter-tag {
      font-size: var(--small-font-size);
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--color-bg);
      color: var(--color-text);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-text);
          color: var(--color-bg);
        }
      }

      &--active {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      &--subgenre {
        font-size: var(--small-font-size);
      }
    }
  }

  &__container {
    min-width: calc(var(--page-max-width) + var(--big-margin));
    margin: calc(var(--big-margin) * 2) 0 0 calc(var(--big-margin) * -0.5);
    display: flex;
    flex-direction: column;
  }

  &__items {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 calc(var(--big-margin) / 2);
    gap: calc(var(--big-margin) / 2) calc(var(--big-margin) * 1.9875);
  }

  &__load-more {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--mid-margin);

    .load-more-button {
      display: flex;
      align-items: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--big-padding);
      margin: 0 calc(var(--big-margin) / 2 + 0.6rem) 0.6rem 0;
      background-color: var(--color-bg);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-text-semibold);
      border-radius: 100px;

      &:hover {
        @media (min-width: 1024px) {
          color: var(--color-bg);
        }
      }
    }
  }
}

/* ==================== GRID ITEM STYLES ==================== */
.module-grid {
  .grid-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    max-width: calc(100% / 3 - var(--big-margin) * 1.325);
    width: 100%;
    padding: 0 0 calc(var(--big-margin) / 2) 0;

    &:last-of-type {
      justify-self: flex-start;
      margin: 0 auto 0 0;
    }

    &__link {
      display: contents;
      text-decoration: none;
      color: inherit;
    }

    &__image {
      position: relative;
      overflow: hidden;

      img {
        width: 100% !important;
        height: auto;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        transition: transform 0.2s ease;
      }

      &:hover img {
        @media (min-width: 1024px) {
          transform: scale(1.05);
        }
      }
    }

    :deep(img) {
      @apply object-cover max-w-full w-100;
    }

    &__content {
      width: 100%;
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-items: stretch;
      flex-grow: 1;
      margin: var(--mid-padding) 0 0 0;
      gap: var(--mid-padding);

      .grid-item__tags {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-end;
        align-content: flex-end;
        gap: var(--small-margin);
        flex-grow: 1;
      }

      &__interactive {
        width: 100%;
        display: flex;
        flex-flow: row wrap;
        justify-content: space-between;
        align-items: center;

        .grid-item__date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }

        .play-button {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 0 0 auto;
          color: transparent;
          background-color: var(--color-text);
          border-radius: 100px;
          border: none;
          padding: 4px;
          width: calc(var(--base-font-size) + 4px);
          height: calc(var(--base-font-size) + 4px);

          svg {
            height: var(--base-font-size);
            transform: translate(1px, 0);
            path {
              fill: var(--color-bg);
            }
          }
        }
      }

      .grid-item__title,
      .grid-item__artist {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .show-artists {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: var(--mid-padding);
      }
    }
  }

  /* Content type specific styles */
  &.pool .grid-item__image img {
    aspect-ratio: 3 / 4;
  }

  &.words {
    .content-grid__items {
      gap: calc(var(--big-padding) * 3);
    }

    .tag {
      &.city {
        background-color: var(--color-green);
        color: var(--color-white);
      }
    }

    .grid-item {
      position: relative;
      flex: 1 1 50%;
      max-width: calc(50% - var(--big-padding) * 1.5);
      background-color: var(--color-text);
      border-radius: 12px;
      border: 1px solid var(--color-text);
      overflow: hidden;
      padding: 0;
      margin-right: 0;

      .grid-item__content__interactive,
      .city-tags {
        display: none;
      }

      &__link {
        color: var(--color-bg);
      }

      &__image {
        width: 100%;

        img {
          aspect-ratio: 3 / 1.5 !important;
          width: 100%;
        }
      }

      &__content {
        position: relative;
        gap: var(--big-padding);
        margin: 0;
        padding: var(--base-margin) var(--mid-padding);
        color: var(--color-bg);

        .read-more {
          position: absolute;
          transform: translate(0, calc(var(--base-margin) * -1 - 50%));
          .tag {
            border: 1px solid var(--color-text);
            background-color: var(--color-bg);
            color: var(--color-text);
          }
        }

        .grid-item__title {
          color: var(--color-bg);
        }

        .grid-item__tags {
          position: absolute;
          top: var(--base-padding);
          right: var(--base-padding);
          color: var(--color-bg);
          flex-grow: 0;

          .tag {
            background-color: transparent;
            color: var(--color-bg);
            padding: 2px 8px;
            border: 1px solid var(--color-bg);

            &:hover {
              background-color: var(--color-bg);
              color: var(--color-text);
            }
          }
        }

        .rich-text,
        .rich-text * {
          color: var(--color-bg);
        }
      }
    }
  }

  &__title {
    @apply text-2xl font-bold mb-4;
  }
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--mid-margin);
  }
}


/* ==================== RESPONSIVE ==================== */
/* Tablet: 2 Spalten */
@media (max-width: 1100px) {
  .content-grid {
    --mobile-filter-trigger-height: 29px;

    &__filter-bar--desktop {
      display: none;
    }

    &__filter-section {
      display: none;
      margin-left: 0;
      margin-right: 0;
      padding-left: 0;
      padding-right: 0;
      padding-bottom: 0;

      &::before {
        display: none;
      }

      &.is-mobile-open {
        display: flex;
        flex-direction: column;
        gap: var(--mid-padding);
        position: fixed;
        top: calc(
          var(--nav-height) + var(--big-padding) +
            var(--mobile-filter-trigger-height)
        );
        left: var(--mid-padding);
        right: var(--mid-padding);
        z-index: 9998;
        max-height: calc(
          100dvh - var(--nav-height) - var(--big-padding) -
            var(--mobile-filter-trigger-height) - var(--big-padding)
        );
        overflow: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: var(--mid-padding);
        border-radius: 1.56125rem;
        border: 1px solid var(--color-bg);
        background-color: var(--color-bg-transparent);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        animation: content-grid-filter-panel-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)
          both;
      }
    }

    &__mobile-filter-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 9997;
      background-color: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);

      @media (prefers-color-scheme: dark) {
        background-color: rgba(0, 0, 0, 0.25);
      }
    }

    &__mobile-filter-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: calc(var(--nav-height) + var(--big-padding));
      right: 0;
      z-index: 9999;
      width: 35px;
      height: var(--mobile-filter-trigger-height);
      padding: 0;
      color: var(--theme-color);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &__icon {
        display: block;
        width: 35px;
        height: var(--mobile-filter-trigger-height);
      }

      &__knob {
        transform-box: fill-box;
        transform-origin: center;
        transition: transform 0.2s ease;
      }

      .filter-count {
        position: absolute;
        top: -2px;
        left: -2px;
        background-color: var(--color-text);
        color: var(--color-bg);
        border-radius: 50%;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-family: var(--font-text-semibold);
        padding: 0 3px;
        border: 1px solid var(--color-bg);
      }

      &.is-open {
        opacity: 0.85;

        .content-grid__mobile-filter-trigger__knob {
          transform: rotate(-90deg);
        }
      }

      &:hover:not(.is-open) .content-grid__mobile-filter-trigger__knob {
        transform: scale(1.05);
      }
    }

    &__mobile-filter {
      display: contents;
    }

    &__mobile-filter-block {
      display: flex;
      flex-direction: column;
      gap: var(--small-padding);

      &__title {
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-text);
        padding-left: var(--small-padding);
        margin: 0;
      }

      &__panel {
        background-color: rgba(255, 255, 255, 0.45);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--color-bg);
        border-radius: 1.56125rem;
        padding: var(--mid-padding);
        overflow: hidden;

        @media (prefers-color-scheme: dark) {
          background-color: rgba(0, 0, 0, 0.35);
        }
      }

      &--city {
        order: 1;
      }

      &--tags {
        order: 2;

        &.has-active-filters.has-filter-tags .content-grid__mobile-filter-block__panel {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom: none;
        }
      }
    }

    &__mobile-filter-cities {
      &__tags {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: center;
        gap: var(--small-padding);
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
          display: none;
        }

        .filter-tag--city {
          flex-shrink: 0;
          background-color: var(--color-dark-grey);
          color: var(--color-text);
          padding: var(--small-padding) var(--mid-padding);
          border-radius: 100px;
          border: 1px solid transparent;
          font-size: var(--small-font-size);
          text-transform: uppercase;
          font-family: var(--font-text);
          cursor: pointer;
          transition: all 0.2s ease;

          &.filter-tag--active {
            background-color: var(--theme-color);
            color: var(--color-bg);
            border-color: transparent;
          }
        }
      }
    }

    &__mobile-filter-active {
      display: flex;
      align-items: flex-start;
      gap: var(--small-padding);
      padding: 0;

      &__clear {
        flex-shrink: 0;
        display: none;;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        margin-top: var(--small-padding);
        padding: 0;
        background: transparent;
        border: none;
        cursor: pointer;
      }

      .active-filters__list {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-start;
        align-content: flex-start;
        gap: var(--small-padding);
        flex: 1;
        min-width: 0;
      }

      .active-filter.tag {
        flex-shrink: 0;
        background-color: var(--theme-color);
        color: var(--color-bg);
        border: 1px solid var(--theme-color);
        border-radius: 100px;
        font-size: var(--small-font-size);
        letter-spacing: var(--button-letter-spacing);
        font-family: var(--font-text);
        text-transform: uppercase;
        padding: var(--small-padding) calc(var(--base-padding) + 10px)
          var(--small-padding) var(--base-padding);
        position: relative;
        min-width: max-content;

        .close-cross {
          transform: translate(0, -1px);
          right: 6px;
          position: absolute;
        }

        &__name {
          min-width: max-content;
          cursor: pointer;
          font-size: var(--small-font-size);
          letter-spacing: var(--button-letter-spacing);
          font-family: var(--font-text);
          padding: 0;
        }
      }
    }

    &__mobile-filter-bar {
      order: 4;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--small-padding) var(--mid-padding);
      background-color: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--color-bg);
      border-radius: 100px;

      @media (prefers-color-scheme: dark) {
        background-color: rgba(0, 0, 0, 0.35);
      }

      .mobile-sort-options {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--mid-margin);
        flex-wrap: wrap;

        .sort-button {
          display: flex;
          align-items: center;
          gap: var(--small-padding);
          background-color: transparent;
          border: none;
          font-size: var(--small-font-size);
          color: var(--color-text);
          text-transform: uppercase;
          font-family: var(--font-text-semibold);
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 0;

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--color-dark-grey);
            transition: background-color 0.2s ease;
          }

          &.active {
            color: var(--theme-color);

            .dot {
              background-color: var(--theme-color);
            }
          }
        }
      }
    }

    &__filters {
      &--in-mobile-panel {
        order: 3;
        margin-top: calc(var(--mid-padding) * -1);
        padding: var(--mid-padding);
        background-color: rgba(255, 255, 255, 0.45);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--color-bg);
        border-top: none;
        border-radius: 0 0 1.56125rem 1.56125rem;

        @media (prefers-color-scheme: dark) {
          background-color: rgba(0, 0, 0, 0.35);
        }

        &.content-grid__filters--no-active-above {
          margin-top: 0;
          border-top: 1px solid var(--color-bg);
          border-radius: 1.56125rem;
        }

        .filter-container {
          gap: var(--mid-padding);
        }

        .filter-category {
          position: static;
          width: 100%;
          transform: none;
          opacity: 1;
          padding: 0;
          border: none;
          border-radius: 0;
          background: transparent;
          backdrop-filter: none;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          row-gap: var(--mid-padding);
        }

        .filter-genres,
        .filter-tags {
          max-width: 100%;
          width: 100%;
          margin: 0;
          justify-content: flex-start;
        }

        .filter-subgenres {
          margin-left: 0;
          width: 100%;
        }

        .filter-type {
          background-color: var(--color-bg);
          color: var(--color-text);
          border: 1px solid var(--color-text);

          &--active {
            background-color: var(--color-text);
            color: var(--color-bg);
          }
        }

        .filter-tag:not(.filter-tag--city) {
          background-color: var(--color-bg);
          color: var(--color-text);
          border: 1px solid var(--color-text);

          &.filter-tag--active {
            background-color: var(--color-text);
            color: var(--color-bg);
          }
        }

        .filter-tag--genre {
          background-color: var(--color-bg);
          color: var(--color-text);
          border: 1px solid var(--color-text);

          &.filter-tag--active {
            background-color: var(--color-text);
            color: var(--color-bg);
          }
        }
      }

      &:not(&--in-mobile-panel) {
        .filter-category {
          position: static;
          width: 100%;
          transform: none;
          opacity: 1;
          padding: var(--mid-padding);
          border-radius: 0 0 1.56125rem 1.56125rem;
          border: none;
          border-top: 1px solid var(--color-grey);
          background-color: var(--color-bg-transparent);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          row-gap: var(--small-padding);
        }

        .filter-genres {
          max-width: 100%;
          width: 100%;
          margin: 0;
        }

        .filter-tags {
          max-width: 100%;
          width: 100%;
          margin: 0;
        }

        .filter-subgenres {
          margin-left: 0;
          width: 100%;
        }
      }
    }

    &__container {
      margin-top: 0;
    }

    /* Grid Layout: 2 Spalten */
    &__items {
      gap: calc(var(--big-margin) / 2) calc(var(--big-margin));
    }
  }

  .module-grid {
    .grid-item {
      max-width: calc(50% - calc(var(--big-margin) / 2));
      
      &:nth-child(3n) {
        margin-right: auto;
      }
      
      &:nth-child(2n) {
        margin-right: 0;
      }
    }
    
    &--image .grid-item {
      flex-direction: column;
      :deep(img),
      :deep(.video-wrapper) {
        width: 100%;
      }
      &__content {
        width: 100%;
        padding: var(--mid-padding) 0 0 0;
      }
    }
    
    &.words {
      .grid-item {
        max-width: calc(50% - var(--big-padding) * 1.5);
      }
    }
  }
}

/* Pool & Words: einspaltig auf Mobile */
@media (max-width: 900px) {
  .content-grid.module-grid {
    &.pool,
    &.words {
      .grid-item {
        flex: 1 1 100%;
        max-width: 100%;
        width: 100%;
      }
    }

    &.words .content-grid__items .grid-item {
      flex: 1 1 100%;
      max-width: 100%;
      width: 100%;
    }
  }
}

/* Mobil: 1 Spalte */
@media (max-width: 600px) {
  .content-grid {
    &__filter-section.is-mobile-open {
      left: var(--small-padding);
      right: var(--small-padding);
      padding: var(--mid-padding) var(--small-padding);
      max-height: calc(
        100dvh - var(--nav-height) - var(--big-padding) -
          var(--mobile-filter-trigger-height) - var(--big-padding)
      );
    }

    &__mobile-filter-cities {
      &__tags .filter-tag--city {
        font-size: 11px;
        padding: 6px 12px;
      }
    }

    &__mobile-filter-bar .mobile-sort-options {
      gap: var(--mid-padding);

      .sort-button {
        font-size: 11px;

        .dot {
          width: 8px;
          height: 8px;
        }
      }
    }

    &__items {
      gap: calc(var(--big-margin) / 2);
    }
  }
  
  .module-grid {
    .grid-item {
      max-width: 100%;
      flex: 1 1 100%;
      width: 100%;
      
      &:nth-child(2n),
      &:nth-child(3n) {
        margin-right: 0;
      }
    }
    
    &.words {
      .grid-item,
      .content-grid__items .grid-item {
        flex: 1 1 100%;
        max-width: 100%;
        width: 100%;
      }
    }

    &.pool .grid-item {
      flex: 1 1 100%;
      max-width: 100%;
      width: 100%;
    }
  }
}

.mobile-filter-backdrop-enter-active,
.mobile-filter-backdrop-leave-active {
  transition: opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-filter-backdrop-enter-from,
.mobile-filter-backdrop-leave-to {
  opacity: 0;
}

@keyframes content-grid-filter-panel-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-filter-backdrop-enter-active,
  .mobile-filter-backdrop-leave-active {
    transition: none;
  }

  .content-grid__filter-section.is-mobile-open {
    animation: none;
  }
}

@media screen and (max-width: 900px) {
  .content-grid .grid-item__content {
    margin: var(--card-content-padding-y) 0 0 0;
    gap: var(--card-content-gap);
  }

  .content-grid.words .content-grid__items .grid-item__content {
    gap: var(--card-content-gap);
    padding: var(--card-content-padding-y) var(--card-content-padding-x);

    .read-more {
      transform: translate(
        0,
        calc(var(--card-content-padding-y) * -1 - 50%)
      );
    }
  }
}
</style>