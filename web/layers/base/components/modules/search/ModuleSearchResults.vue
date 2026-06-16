<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { ContentItem, Image, Tag } from "~/types/sanity";

const { locale: _locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();
const { getSoundcloudArtwork, playTrack: _playTrack } = useSoundcloudArtwork();

const props = defineProps({
	results: { type: Array as () => ContentItem[], default: () => [] },
	searchQuery: { type: String, default: "" },
	isLoading: { type: Boolean, default: false },
	activeContentType: { type: String, default: "all" },
	availableTags: { type: Object, default: null },
});

// Compute the category type for CSS class
const categoryType = computed(() => {
	const type = props.activeContentType;
	if (type === "person" || type === "venue") return "Pool";
	if (type === "set" || type === "show") return "sets";
	if (type === "article") return "Words";
	return "sets"; // Default to shows style for "all"
});

// ==================== CONSTANTS ====================
const MAIN_CITIES = ["Vienna", "Düsseldorf", "Leipzig"];
const SCROLL_THRESHOLD = 30;

// Tag-Typ zu Farbe Mapping
const TAG_TYPE_COLORS: Record<string, string> = {
	"tag.genre": "pink",
	"tag.subGenre": "pink",
	"tag.mood": "pink",
	"tag.musician": "blue",
	"tag.venue": "blue",
	"tag.crafts": "blue",
	"tag.article": "green",
	"tag.city": "neutral",
	"tag.global": "neutral",
};

// Tag-Typ zu Kategorie Mapping
const _TAG_CATEGORIES = {
	shows: ["tag.genre", "tag.subGenre", "tag.mood"],
	pool: ["tag.musician", "tag.venue", "tag.crafts"],
	words: ["tag.article"],
};

// ==================== STATE ====================
const activeFilters = ref(new Set<string>());
const activeGenres = ref(new Set<string>());
const activeSubGenres = ref(new Set<string>());
const activeFilterType = ref<string | null>(null);
const isOtherCitiesActive = ref(false);
const showFilters = ref(true);
const lastScrollY = ref(0);
const sortMode = ref<"new" | "alpha">("new");
const artworkUrls = ref(new Map<string, string>());
const moduleContainer = ref<HTMLElement | null>(null);

// ==================== COMPUTED: Tags ====================

const getUsedTagIdsInItems = computed(() => {
	const usedTagIds = new Set<string>();
	const addTags = (tags: Tag[] | undefined) => {
		if (Array.isArray(tags)) {
			tags.forEach((tag) => tag?._id && usedTagIds.add(tag._id));
		}
	};
	props.results.forEach((item) => {
		addTags(item.tags);
		addTags(item.parentShow?.tags);
	});
	return usedTagIds;
});

const categorizedTags = computed(() => {
	const usedTagIds = getUsedTagIdsInItems.value;

	// Method 1: Use availableTags (Hierarchy) - Preferred
	if (props.availableTags) {
		const filterByUsed = (tags: Tag[] | undefined) =>
			tags?.filter((t) => usedTagIds.has(t._id)) || [];

		const genres = (props.availableTags.genres || [])
			.map((genre: Tag & { subGenres?: Tag[] }) => {
				const isUsed = usedTagIds.has(genre._id);
				const usedSubGenres =
					genre.subGenres?.filter((t: Tag) => usedTagIds.has(t._id)) || [];
				// Keep genre if it is used OR has used subgenres
				if (!isUsed && !usedSubGenres.length) return null;
				return { ...genre, subGenres: usedSubGenres };
			})
			.filter(Boolean);

		return {
			genres,
			subGenres: [], // Subgenres are nested in genres
			cities: filterByUsed(props.availableTags.cities),
			global: filterByUsed(props.availableTags.global),
			mood: filterByUsed(props.availableTags.mood),
		};
	}

	// Method 2: Extract from results (Fall back)
	const genres: Tag[] = [];
	const subGenres: Tag[] = [];
	const cities: Tag[] = [];
	const global: Tag[] = [];
	const mood: Tag[] = [];

	const addUnique = (arr: Tag[], tag: Tag) => {
		if (tag?._id && !arr.some((t) => t._id === tag._id)) {
			arr.push(tag);
		}
	};

	props.results.forEach((item: ContentItem) => {
		const allTags = [...(item.tags || []), ...(item.parentShow?.tags || [])];
		allTags.forEach((tag: Tag & { parentGenre?: Tag }) => {
			// Check for parentGenre (from modified query)
			if (tag.parentGenre) {
				addUnique(genres, tag.parentGenre);
			}

			if (!tag?._type) return;
			switch (tag._type) {
				case "tag.city":
					addUnique(cities, tag);
					break;
				case "tag.genre":
					addUnique(genres, tag);
					break;
				case "tag.subGenre":
					addUnique(subGenres, tag);
					break;
				case "tag.global":
					addUnique(global, tag);
					break;
				case "tag.mood":
					addUnique(mood, tag);
					break;
			}
		});
	});

	return { genres, subGenres, cities, global, mood };
});

// Pool-specific tags extracted from results
const poolTags = computed(() => {
	const musicians: Tag[] = [];
	const venues: Tag[] = [];
	const crafts: Tag[] = [];
	const articles: Tag[] = [];

	const addUnique = (arr: Tag[], tag: Tag) => {
		if (tag?._id && !arr.some((t) => t._id === tag._id)) {
			arr.push(tag);
		}
	};

	props.results.forEach((item: ContentItem) => {
		const allTags = [...(item.tags || []), ...(item.parentShow?.tags || [])];
		allTags.forEach((tag: Tag) => {
			if (!tag?._type) return;
			switch (tag._type) {
				case "tag.musician":
					addUnique(musicians, tag);
					break;
				case "tag.venue":
					addUnique(venues, tag);
					break;
				case "tag.crafts":
					addUnique(crafts, tag);
					break;
				case "tag.service":
					addUnique(venues, tag);
					break; // Service tags also for venues
				case "tag.article":
					addUnique(articles, tag);
					break;
			}
		});
	});

	return { musicians, venues, crafts, articles };
});

// Get color for a tag based on its type
function _getTagColor(tag: Tag): string {
	if (!tag?._type) return "neutral";
	return TAG_TYPE_COLORS[tag._type] || "neutral";
}

// Group all tags by content type/color for unified filter display
const groupedTagsByColor = computed(() => {
	// Shows/Sets tags (pink)
	// Handle both hierarchical (from availableTags) and flat (fallback) structures
	const flattenedSubGenres = categorizedTags.value.subGenres?.length
		? categorizedTags.value.subGenres
		: categorizedTags.value.genres.flatMap(
				(g: Tag & { subGenres?: Tag[] }) => g.subGenres || [],
			);

	const showsTags = [
		...categorizedTags.value.genres,
		...flattenedSubGenres,
		...categorizedTags.value.mood,
	];

	// Pool tags (blue) - flatten musician, venue, crafts
	const poolTagsFlat = [
		...poolTags.value.musicians,
		...poolTags.value.venues,
		...poolTags.value.crafts,
	];

	const wordsTags = poolTags.value.articles || [];

	return {
		shows: {
			tags: showsTags,
			genres: categorizedTags.value.genres,
			subGenres: flattenedSubGenres,
			mood: categorizedTags.value.mood,
			color: "pink",
			label: "Shows/Sets",
			hasContent: showsTags.length > 0,
		},
		pool: {
			tags: poolTagsFlat,
			musicians: poolTags.value.musicians,
			venues: poolTags.value.venues,
			crafts: poolTags.value.crafts,
			color: "blue",
			label: "Pool",
			hasContent: poolTagsFlat.length > 0,
		},
		words: {
			tags: wordsTags,
			articles: poolTags.value.articles,
			color: "green",
			label: "Words",
			hasContent: wordsTags.length > 0,
		},
	};
});

// Helper for accessing pool tags by type name (avoids TypeScript casting in template)
function getPoolTagsByType(typeName: string): Tag[] {
	const pool = groupedTagsByColor.value.pool;
	if (typeName === "musicians") return pool.musicians;
	if (typeName === "venues") return pool.venues;
	if (typeName === "crafts") return pool.crafts;
	return [];
}

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
const _getItemNonCityTags = (item: ContentItem) =>
	(item.tags || []).filter((t: Tag) => t._type !== "tag.city");

function getTagTitle(title: Tag["title"]): string {
	return getI18nLabel(title);
}

function _isMainCity(cityTag: Tag): boolean {
	if (!cityTag?.title) return false;
	const cityName = getTagTitle(cityTag.title);
	return MAIN_CITIES.includes(cityName);
}

function getTagNameById(tagId: string): string {
	if (tagId === "others") return "Elsewhere";

	// Check city tags
	const city = categorizedTags.value.cities.find((t: Tag) => t._id === tagId);
	if (city) return getTagTitle(city.title);

	// Check genre tags
	const genre = categorizedTags.value.genres.find((t: Tag) => t._id === tagId);
	if (genre) return genre.title || "Genre";

	// Check subgenre tags
	const subGenre = categorizedTags.value.subGenres.find(
		(t: Tag) => t._id === tagId,
	);
	if (subGenre) return subGenre.title || "SubGenre";

	// Check pool tags (musicians, venues, crafts)
	const poolTagArrays = [
		poolTags.value.musicians,
		poolTags.value.venues,
		poolTags.value.crafts,
		poolTags.value.articles,
	];
	for (const arr of poolTagArrays) {
		const found = arr.find((t: Tag) => t._id === tagId);
		if (found) return found.title || "Tag";
	}

	// Check if it's a main city name (string filter)
	if (MAIN_CITIES.includes(tagId)) return tagId;

	return "Unknown Filter";
}

// ==================== FILTER LOGIC ====================
function toggleFilter(tagId: string) {
	const isActive = activeFilters.value.has(tagId);

	if (isActive) {
		activeFilters.value.delete(tagId);
		if (tagId === "others") isOtherCitiesActive.value = false;
	} else {
		activeFilters.value.add(tagId);
		if (tagId === "others") isOtherCitiesActive.value = true;
	}
}

function toggleGenreFilter(genreId: string) {
	if (activeGenres.value.has(genreId)) {
		activeGenres.value.delete(genreId);
		// Clear subgenres for this genre (if we had genre->subgenre mapping we'd use it)
	} else {
		activeGenres.value.add(genreId);
	}
}

function toggleSubGenreFilter(subGenreId: string) {
	if (activeSubGenres.value.has(subGenreId)) {
		activeSubGenres.value.delete(subGenreId);
		activeFilters.value.delete(subGenreId);
	} else {
		activeSubGenres.value.add(subGenreId);
		activeFilters.value.add(subGenreId);
	}
}

function toggleFilterType(type: string) {
	activeFilterType.value = activeFilterType.value === type ? null : type;
}

function resetFilters() {
	activeFilters.value.clear();
	activeGenres.value.clear();
	activeSubGenres.value.clear();
	activeFilterType.value = null;
	isOtherCitiesActive.value = false;
}

// ==================== ITEM MATCHING ====================
function itemHasTag(item: ContentItem, tagId: string): boolean {
	return getItemTags(item).some((t) => t._id === tagId);
}

// Check if item has a city tag matching the city name
function itemHasCityByName(item: ContentItem, cityName: string): boolean {
	const cityTags = getItemCityTags(item);
	return cityTags.some((t) => {
		const tagTitle = parseI18nObj(t.title) || t.title || t.short || "";
		return tagTitle.toLowerCase() === cityName.toLowerCase();
	});
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
			const itemTags = getItemTags(item);
			const itemTagIds = new Set(itemTags.map((t) => t._id));

			// Check if item has any of the selected genres or related subGenres
			let matchesGenre = false;
			for (const genreId of activeGenres.value) {
				if (itemTagIds.has(genreId)) {
					matchesGenre = true;
					break;
				}
				// Also check if item has any subgenre (by checking _type)
				if (itemTags.some((t) => t._type === "tag.subGenre")) {
					matchesGenre = true;
					break;
				}
			}
			if (!matchesGenre) return false;
		}
	}

	// Normal filters check (AND logic - cities and other tags)
	if (activeFilters.value.size === 0) return true;

	for (const filterId of activeFilters.value) {
		if (filterId === "others") {
			// Elsewhere: item must NOT have any main city tag
			const hasMainCity = MAIN_CITIES.some((city) =>
				itemHasCityByName(item, city),
			);
			if (hasMainCity) return false;
		} else if (MAIN_CITIES.includes(filterId)) {
			// City filter: check by city name
			if (!itemHasCityByName(item, filterId)) return false;
		} else if (!itemHasTag(item, filterId)) {
			// Regular tag filter
			return false;
		}
	}
	return true;
}

// ==================== SORTING ====================
function changeSortMode(mode: "new" | "alpha") {
	sortMode.value = mode;
}

const filteredItems = computed(() => {
	const items = props.results.filter(itemMatchesFilters);

	const sortFns = {
		new: (a: ContentItem, b: ContentItem) =>
			new Date(b.datetime || b._updatedAt || b._createdAt || 0).getTime() -
			new Date(a.datetime || a._updatedAt || a._createdAt || 0).getTime(),
		alpha: (a: ContentItem, b: ContentItem) =>
			(a.title || a.name || a.parentShow?.title || "")
				.toLowerCase()
				.localeCompare(
					(b.title || b.name || b.parentShow?.title || "").toLowerCase(),
				),
	};

	return items.sort(sortFns[sortMode.value]);
});

// Group filtered items by content type for sectioned display
const groupedResults = computed(() => {
	const pool: ContentItem[] = [];
	const shows: ContentItem[] = [];
	const words: ContentItem[] = [];

	filteredItems.value.forEach((item: ContentItem) => {
		switch (item._type) {
			case "person":
			case "venue":
				pool.push(item);
				break;
			case "show":
			case "set":
				shows.push(item);
				break;
			case "article":
				words.push(item);
				break;
		}
	});

	return { pool, shows, words };
});

// Show all filtered items (no pagination limit) - keep for backward compatibility
const _visibleItems = computed(() => filteredItems.value);

// ==================== UI HELPERS ====================
function toggleFiltersVisibility() {
	showFilters.value = !showFilters.value;
}

function handleScroll() {
	const scrollY = window.scrollY;
	const scrollDiff = scrollY - lastScrollY.value;
	if (scrollDiff > SCROLL_THRESHOLD && showFilters.value)
		showFilters.value = false;
	else if (scrollDiff < -20 && !showFilters.value) showFilters.value = true;
	lastScrollY.value = scrollY;
}

function _formatDate(dateString: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

// ==================== IMAGE HANDLING ====================
function _getItemImage(item: ContentItem) {
	if (item.image || item.mainImage) return item.image || item.mainImage;

	const fallbacks = mainStore.siteFallbacks;
	const fallbackMap: Record<string, Image | undefined> = {
		person: fallbacks?.fallbackPerson?.image,
		venue: fallbacks?.fallbackVenue?.image,
		show: fallbacks?.fallbackShow?.image,
		set: fallbacks?.fallbackSet?.image,
		word: fallbacks?.fallbackArticle?.image,
		article: fallbacks?.fallbackArticle?.image,
	};
	return fallbackMap[item._type ?? ""] ?? fallbacks?.fallbackPerson?.image;
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
onMounted(() => {
	// Load artwork for sets
	props.results.forEach((item) => {
		if (item._type === "set") {
			loadArtworkUrl(item);
		}
	});

	lastScrollY.value = window.scrollY;
	window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener("scroll", handleScroll);
});

// Reload artwork when results change
watch(
	() => props.results,
	() => {
		// Load artwork for new set items
		props.results.forEach((item) => {
			if (item._type === "set" && !artworkUrls.value.has(item._id)) {
				loadArtworkUrl(item);
			}
		});
	},
);
</script>

<template>
	<ClientOnly>
		<div
			v-if="results.length > 0 || isLoading"
			ref="moduleContainer"
			:class="`content-grid module-grid search-results ${categoryType.toLowerCase()}`"
		>
			<!-- Filter Panel -->
			<div class="content-grid__filter-section">
				<div class="content-grid__filter-bar">
					<!-- Active Filters -->
					<div class="active-filters">
						<h4
							class="active-filters__title"
							:class="{ active: activeFilters.size > 0 }"
						>
							<span class="close-cross" @click="resetFilters()">
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

					<!-- Cities Filter (always visible) -->
					<div class="filter-cities tags">
						<h4 class="filter-cities__title">City</h4>
						<div class="filter-tags">
							<button
								v-for="city in MAIN_CITIES"
								:key="city"
								class="tag filter-tag filter-tag--city"
								:class="{ 'filter-tag--active': activeFilters.has(city) }"
								@click="toggleFilter(city)"
							>
								{{ city }}
							</button>
							<button
								class="tag filter-tag filter-tag--city"
								:class="{ 'filter-tag--active': isOtherCitiesActive }"
								@click="toggleFilter('others')"
							>
								Elsewhere
							</button>
						</div>
					</div>

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
					</div>
				</div>


				<!-- Filter Tags Panel -->
				<div v-if="filteredItems.length > 0" class="content-grid__filters">
					<div class="filter-container tags">
            
						<!-- Single filter-category containing both primary and secondary tags -->
						<div 
							v-if="groupedTagsByColor.shows.hasContent || groupedTagsByColor.pool.hasContent || groupedTagsByColor.words.hasContent" 
							class="filter-category tags" 
							:class="{ active: showFilters }"
						>
							<!-- PRIMARY TAGS: All parent-level tags side by side, color-coded -->
							<div class="filter-tags filter-tags--primary">
								<!-- Shows/Sets: Genres (Pink) -->
								<button
									v-for="genre in groupedTagsByColor.shows.genres"
									:key="'genre-' + genre._id"
									class="tag filter-tag filter-tag--pink"
									:class="{ 'filter-tag--active': activeGenres.has(genre._id) }"
									@click="toggleGenreFilter(genre._id)"
								>
									{{ genre.title }}
								</button>

								<!-- Shows: Mood (Pink) - Added missing primary filter -->
								<button
									v-for="tag in groupedTagsByColor.shows.mood"
									:key="'mood-' + tag._id"
									class="tag filter-tag filter-tag--pink"
									:class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
									@click="toggleFilter(tag._id)"
								>
									{{ getI18nLabel(tag.title) }}
								</button>
                
								<!-- Pool: Type toggles (Blue) -->
								<button
									v-if="groupedTagsByColor.pool.musicians.length > 0"
									class="tag filter-type filter-type--blue"
									:class="{ 'filter-type--active': activeFilterType === 'musicians' }"
									@click="toggleFilterType('musicians')"
								>
									Musicians
								</button>
								<button
									v-if="groupedTagsByColor.pool.venues.length > 0"
									class="tag filter-type filter-type--blue"
									:class="{ 'filter-type--active': activeFilterType === 'venues' }"
									@click="toggleFilterType('venues')"
								>
									Venues
								</button>
								<button
									v-if="groupedTagsByColor.pool.crafts.length > 0"
									class="tag filter-type filter-type--blue"
									:class="{ 'filter-type--active': activeFilterType === 'crafts' }"
									@click="toggleFilterType('crafts')"
								>
									Crafts
								</button>
                
								<!-- Words: Article tags (Green) -->
								<button
									v-for="tag in groupedTagsByColor.words.articles"
									:key="'article-' + tag._id"
									class="tag filter-tag filter-tag--green"
									:class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
									@click="toggleFilter(tag._id)"
								>
									{{ getI18nLabel(tag.title) }}
								</button>
							</div>
              
							<!-- SECONDARY TAGS: All sub-level tags below primary tags -->
							<div 
								v-if="(activeGenres.size > 0 && groupedTagsByColor.shows.subGenres.length > 0) || (activeFilterType && getPoolTagsByType(activeFilterType).length > 0)" 
								class="filter-subgenres"
							>
								<!-- SubGenres (Pink) - Only show when Genres are active, filtered by parent -->
								<template v-if="activeGenres.size > 0">
									<button
										v-for="subGenre in groupedTagsByColor.shows.subGenres.filter(sg => sg.parentGenre && activeGenres.has(sg.parentGenre._id))"
										:key="'subgenre-' + subGenre._id"
										class="tag filter-tag filter-tag--pink filter-tag--subgenre"
										:class="{ 'filter-tag--active': activeSubGenres.has(subGenre._id) }"
										@click="toggleSubGenreFilter(subGenre._id)"
									>
										{{ subGenre.title }}
									</button>
								</template>
                
								<!-- Specific Pool tags (Blue) - when a pool type is selected -->
								<template v-if="activeFilterType">
									<button
										v-for="tag in getPoolTagsByType(activeFilterType)"
										:key="'pool-' + tag._id"
										class="tag filter-tag filter-tag--blue"
										:class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
										@click="toggleFilter(tag._id)"
									>
										{{ getI18nLabel(tag.title) }}
									</button>
								</template>
							</div>
						</div>

					</div>
				</div>
			</div>

			<!-- Loading State -->
			<div v-if="isLoading" class="content-grid__loading">
				<div class="loading-spinner"/>
				<span>Searching...</span>
			</div>

			<!-- Content Sections using ModuleSearchResultBlock -->
			<div v-else class="content-grid__container content-grid__container--sectioned">
        
				<!-- Shows/Sets Section -->
				<ModuleSearchResultBlock
					v-if="groupedResults.shows.length > 0"
					:items="groupedResults.shows"
					type="shows"
				/>
        
				<!-- Pool Section -->
				<ModuleSearchResultBlock
					v-if="groupedResults.pool.length > 0"
					:items="groupedResults.pool"
					type="pool"
				/>
        
				<!-- Words Section -->
				<ModuleSearchResultBlock
					v-if="groupedResults.words.length > 0"
					:items="groupedResults.words"
					type="words"
				/>
        
				<!-- No Results -->
				<div 
					v-if="groupedResults.shows.length === 0 && groupedResults.pool.length === 0 && groupedResults.words.length === 0 && searchQuery && !isLoading" 
					class="content-grid__no-results"
				>
					No matching content for "{{ searchQuery }}".
				</div>
			</div>
		</div>

	</ClientOnly>
</template>

<style lang="postcss" scoped>
.content-grid {
  position: relative;
  margin-top: var(--first-content-distance);
  margin-bottom: var(--first-content-distance);
  max-width: clamp(100%, 100%, var(--page-max-width));
  width: 100%;

  /* Theme colors via CSS custom properties */
  --theme-color: var(--color-pink);

  &.words {
    --theme-color: var(--color-green);
  }
  &.pool {
    --theme-color: var(--color-blue);
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

  &__no-results {
    padding: var(--mid-padding);
    text-align: center;
    margin-bottom: var(--mid-margin);
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--base-padding);
    padding: var(--big-padding);
    color: var(--color-text-light, #888);

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
      border-top-color: var(--color-text);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
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
      height: calc(var(--first-content-distance) + (var(--small-padding) * 2 + var(--small-font-size) / 2));
      background-color: var(--color-bg);
      z-index: -1;
      transform: translateY(calc(-100% + (var(--small-padding) * 2 + var(--small-font-size) / 2)));
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
        background-color: var(--color-grey);
        color: var(--color-dark-grey);
        font-size: var(--small-font-size);
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
      margin: var(--base-padding) auto var(--mid-padding);
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
      
      &--secondary {
        margin-top: var(--small-padding);
      }
    }

    .filter-category {
      &__label {
        display: block;
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-text);
        margin-bottom: var(--small-padding);
        text-align: center;
        opacity: 0.6;
      }
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
      
      /* Color-specific styles */
      &--pink {
        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-pink);
            color: var(--color-bg);
          }
        }
        &.filter-tag--active {
          background-color: var(--color-pink);
          color: var(--color-bg);
        }
      }
      
      &--blue {
        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-blue);
            color: var(--color-bg);
          }
        }
        &.filter-tag--active {
          background-color: var(--color-blue);
          color: var(--color-bg);
        }
      }
      
      &--green {
        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-green);
            color: var(--color-bg);
          }
        }
        &.filter-tag--active {
          background-color: var(--color-green);
          color: var(--color-bg);
        }
      }
    }
    
    .filter-type {
      &--blue {
        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-blue);
            color: var(--color-bg);
          }
        }
        &.filter-type--active {
          background-color: var(--color-blue);
          color: var(--color-bg);
        }
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
        width: 100%;
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

/* Empty State */
.search-empty-state {
  text-align: center;
  padding: var(--big-padding);
  max-width: var(--page-max-width);
  margin: var(--big-margin) auto;

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--base-padding);
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--small-padding);
  }

  p {
    color: var(--color-text-light, #888);
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== CONTENT TYPE SPECIFIC STYLES ==================== */
/* Pool: Portrait aspect ratio */
.module-grid.pool .grid-item__image img {
  aspect-ratio: 3 / 4;
}

/* Words: Card layout with inverted colors */
.module-grid.words .content-grid__items {
  gap: calc(var(--big-padding) * 3);

  .grid-item {
    flex: 1 1 50%;
    max-width: calc(50% - var(--big-padding) * 1.5);
    background-color: var(--color-text);
    border-radius: 12px;
    border: 1px solid var(--color-text);
    overflow: hidden;
    padding: 0;

    .city-tags,
    .grid-item__content__interactive {
      display: none;
    }

    img {
      width: 100%;
      height: auto;
      aspect-ratio: 3 / 2;
      object-fit: cover;
    }

    &__image img {
      aspect-ratio: 3 / 1.5;
    }

    &__content {
      gap: var(--big-padding);
      margin: 0;
      padding: var(--base-margin) var(--mid-padding);

      .grid-item__tags {
        position: absolute;
        top: var(--base-padding);
        right: var(--base-padding);
      }

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
        font-size: var(--large-font-size);
        font-weight: 400;
        font-family: var(--font-text-regular);
        color: var(--color-bg);
      }

      .rich-text {
        color: var(--color-bg);
      }
    }
  }
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .content-grid {
    &__items {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .module-grid--image .grid-item {
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

  .module-grid.words .content-grid__items .grid-item {
    flex: 1 1 100%;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .content-grid__items {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 900px) {
  .search-results .grid-item__content {
    margin: var(--card-content-padding-y) 0 0 0;
    gap: var(--card-content-gap);
  }

  .search-results.words .grid-item__content {
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
