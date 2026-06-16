<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
definePageMeta({
	bodyClass: "search-page",
});

// Page SEO
useHead({
	title: "Search | Callshop Radio",
	meta: [
		{
			name: "description",
			content:
				"Search for shows, artists, venues, and articles on Callshop Radio.",
		},
	],
});

const localePath = useLocalePath();

// ==================== STATE ====================
const searchQuery = ref("");
const results = ref([]);
const isLoading = ref(false);
const error = ref(null);
const activeContentTypes = ref(new Set());

// Autocomplete state
const autocompleteResults = ref([]);
const showAutocomplete = ref(false);
const selectedAutocompleteIndex = ref(-1);
const suggestionsHidden = ref(false);
const skipAutocompleteReset = ref(false);

// Tag filter state
const activeTagFilters = ref(new Set());
const expandedTagCategory = ref(null);
const availableTags = ref(null);

const inputRef = ref(null);
let autocompleteTimeout = null;
let searchTimeout = null;
let hideTimeout = null;

// Content type options
const contentTypeOptions = [
	{ value: "all", label: "All" },
	{ value: "shows", label: "Shows" },
	{ value: "pool", label: "Pool" },
	{ value: "article", label: "Words" },
];

// ==================== INPUT VALIDATION ====================
const isValidSearchQuery = (query) => {
	if (!query) return false;
	const trimmed = query.trim();
	// Must have at least 1 non-whitespace character
	return trimmed.length > 0;
};

// ==================== COMPUTED ====================
const hasQuery = computed(() => isValidSearchQuery(searchQuery.value));
const _hasResults = computed(() => results.value.length > 0);

// Filter results by active content types (tag filtering moved to ModuleSearchResults)
const filteredResults = computed(() => {
	if (activeContentTypes.value.size === 0) return results.value;
	return results.value.filter((item) => {
		if (activeContentTypes.value.has(item._type)) return true;
		if (
			activeContentTypes.value.has("pool") &&
			["person", "venue"].includes(item._type)
		)
			return true;
		if (
			activeContentTypes.value.has("shows") &&
			["show", "set"].includes(item._type)
		)
			return true;
		return false;
	});
});

// Determine the primary active content type for visual styling
const activeContentType = computed(() => {
	const types = Array.from(activeContentTypes.value);
	if (types.length === 0) return "all";
	if (types.length === 1) return types[0];
	// If multiple types selected, determine the category
	const hasPool = types.some(
		(t) => t === "pool" || t === "person" || t === "venue",
	);
	const hasShows = types.some(
		(t) => t === "shows" || t === "show" || t === "set",
	);
	const hasWords = types.some((t) => t === "article");
	if (hasWords && !hasPool && !hasShows) return "article";
	if (hasPool && !hasShows && !hasWords) return "pool";
	if (hasShows && !hasPool && !hasWords) return "shows";
	return "all"; // Mixed types, use default shows style
});

// Extract and categorize tags from search results
const categorizedTagsFromResults = computed(() => {
	const showTags = new Map();
	const poolTags = new Map();
	const articleTags = new Map();

	results.value.forEach((item) => {
		// Combine tags from item and parentShow (for sets)
		const allTags = [...(item.tags || []), ...(item.parentShow?.tags || [])];
		allTags.forEach((tag) => {
			if (!tag || !tag._id) return;

			// Show tags: genres, subGenres, global, mood
			if (
				["tag.genre", "tag.subGenre", "tag.global", "tag.mood"].includes(
					tag._type,
				)
			) {
				showTags.set(tag._id, tag);
			}
			// Pool tags: musician, venue, crafts, service
			else if (
				["tag.musician", "tag.venue", "tag.crafts", "tag.service"].includes(
					tag._type,
				)
			) {
				poolTags.set(tag._id, tag);
			}
			// Article tags
			else if (tag._type === "tag.article") {
				articleTags.set(tag._id, tag);
			}
		});
	});

	return {
		showTags: Array.from(showTags.values()),
		poolTags: Array.from(poolTags.values()),
		articleTags: Array.from(articleTags.values()),
	};
});

const _hasTagsToShow = computed(() => {
	const cats = categorizedTagsFromResults.value;
	return (
		cats.showTags.length > 0 ||
		cats.poolTags.length > 0 ||
		cats.articleTags.length > 0
	);
});

// ==================== SEARCH QUERIES ====================
// Autocomplete query (quick, limited results)
const AUTOCOMPLETE_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article", "tag.genre", "tag.subGenre", "tag.global", "tag.mood", "tag.musician", "tag.venue", "tag.crafts", "tag.service", "tag.article"] &&
  title match "*" + $searchTerm + "*" &&
  // Hide venues and persons with poolVisibility:false
  !(_type in ["person", "venue"] && poolVisibility != true) &&
  // Hide shows with title "no-show"
  !(_type == "show" && title == "no-show")
] | order(_updatedAt desc)[0...20] {
  _id,
  _type,
  title,
  "slug": slug,
  _type == "set" => {
    "parentShow": *[_type == "show" && references(^._id)][0]{
      "slug": slug
    }
  }
}`;

// Full search query with substring matching
const FULL_SEARCH_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article"] &&
  (title match "*" + $searchTerm + "*" || $searchTerm in tags[]->title) &&
  // Hide venues and persons with poolVisibility:false
  !(_type in ["person", "venue"] && poolVisibility != true) &&
  // Hide shows with title "no-show"
  !(_type == "show" && title == "no-show")
] | order(_updatedAt desc)[0...200] {
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
  _updatedAt,
  _createdAt,
  additionalTitle,
  useTeaserText,
  textTeaser,
  text,
  description,
  "tags": tags[]-> {
    _id,
    _type,
    title,
    short,
    "parentGenre": *[_type == 'tag.genre' && references(^._id)][0] {
        _id, _type, title
    }
  },
  "soundcloud": soundcloud {
    _type,
    "tracks": tracks[] {
      id,
      artwork_url,
      waveform_url,
      stream_url,
      playback_count,
      title,
      permalink_url
    }
  },
  "persons": persons[]-> {
    _id,
    title,
    slug,
    poolVisibility
  },
  _type == "set" => {
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      "slug": slug,
      image { asset-> },
      "tags": tags[]-> {
        _id,
        _type,
        title,
        short,
        "parentGenre": *[_type == 'tag.genre' && references(^._id)][0] {
            _id, _type, title
        }
      }
    }
  }
}`;

// ==================== METHODS ====================
const performSearch = async (query) => {
	if (!isValidSearchQuery(query)) {
		results.value = [];
		return;
	}

	isLoading.value = true;
	error.value = null;

	try {
		const sanity = useSanity();
		const searchResults = await sanity.fetch(FULL_SEARCH_QUERY, {
			searchTerm: query.trim(),
		});

		results.value = searchResults || [];
	} catch (err) {
		console.error("Search error:", err);
		error.value = "Failed to perform search";
		results.value = [];
	} finally {
		isLoading.value = false;
	}
};

// Autocomplete search (faster, fewer results)
const performAutocomplete = async (query) => {
	if (!isValidSearchQuery(query)) {
		autocompleteResults.value = [];
		return;
	}

	try {
		const sanity = useSanity();
		const suggestions = await sanity.fetch(AUTOCOMPLETE_QUERY, {
			searchTerm: query.trim(),
		});

		autocompleteResults.value = suggestions || [];
		showAutocomplete.value = suggestions && suggestions.length > 0;
		selectedAutocompleteIndex.value = -1;

		// Auto-hide after 10 seconds
		if (hideTimeout) clearTimeout(hideTimeout);
		if (showAutocomplete.value) {
			hideTimeout = setTimeout(() => {
				showAutocomplete.value = false;
			}, 10000);
		}
	} catch (err) {
		console.error("Autocomplete error:", err);
		autocompleteResults.value = [];
	}
};

// Debounced search with autocomplete
watch(searchQuery, (newQuery) => {
	// Clear previous timeouts
	if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
	if (searchTimeout) clearTimeout(searchTimeout);

	// Check if we should skip resetting the hidden state (e.g. on initial load from URL)
	if (skipAutocompleteReset.value) {
		suggestionsHidden.value = true;
		skipAutocompleteReset.value = false;
	} else {
		// Reset hidden state when typing new input
		suggestionsHidden.value = false;
	}

	if (!isValidSearchQuery(newQuery)) {
		results.value = [];
		autocompleteResults.value = [];
		showAutocomplete.value = false;
		isLoading.value = false;
		return;
	}

	isLoading.value = true;

	// Quick autocomplete (150ms)
	autocompleteTimeout = setTimeout(() => {
		performAutocomplete(newQuery);
	}, 150);

	// Full search (400ms) - don't hide autocomplete, let user interact with it
	searchTimeout = setTimeout(() => {
		performSearch(newQuery);
	}, 400);
});

const clearSearch = () => {
	searchQuery.value = "";
	results.value = [];
	autocompleteResults.value = [];
	showAutocomplete.value = false;
	error.value = null;
	activeTagFilters.value.clear();
};

// Content type filter toggle
const toggleContentType = (type) => {
	if (type === "all") {
		activeContentTypes.value.clear();
	} else {
		if (activeContentTypes.value.has(type)) {
			activeContentTypes.value.delete(type);
		} else {
			activeContentTypes.value.add(type);
		}
	}
};

const isContentTypeActive = (type) => {
	if (type === "all") return activeContentTypes.value.size === 0;
	return activeContentTypes.value.has(type);
};

// Tag filter methods
const _toggleTagFilter = (tagId) => {
	if (activeTagFilters.value.has(tagId)) {
		activeTagFilters.value.delete(tagId);
	} else {
		activeTagFilters.value.add(tagId);
	}
};

const _isTagActive = (tagId) => activeTagFilters.value.has(tagId);

const _toggleTagCategory = (category) => {
	expandedTagCategory.value =
		expandedTagCategory.value === category ? null : category;
};

const _resetTagFilters = () => {
	activeTagFilters.value.clear();
};

// Toggle suggestions visibility
const _hideSuggestions = () => {
	suggestionsHidden.value = true;
	showAutocomplete.value = false;
};

// Handle input blur - hide autocomplete after delay
const handleInputBlur = () => {
	setTimeout(() => {
		showAutocomplete.value = false;
	}, 200);
};

// Autocomplete keyboard navigation
const handleKeydown = (event) => {
	if (!showAutocomplete.value || autocompleteResults.value.length === 0) {
		if (event.key === "Escape") {
			showAutocomplete.value = false;
		}
		return;
	}

	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			selectedAutocompleteIndex.value = Math.min(
				selectedAutocompleteIndex.value + 1,
				autocompleteResults.value.length - 1,
			);
			break;
		case "ArrowUp":
			event.preventDefault();
			selectedAutocompleteIndex.value = Math.max(
				selectedAutocompleteIndex.value - 1,
				-1,
			);
			break;
		case "Enter":
			event.preventDefault();
			if (selectedAutocompleteIndex.value >= 0) {
				selectAutocompleteItem(
					autocompleteResults.value[selectedAutocompleteIndex.value],
				);
			} else {
				showAutocomplete.value = false;
				performSearch(searchQuery.value);
			}
			break;
		case "Escape":
			showAutocomplete.value = false;
			break;
	}
};

const selectAutocompleteItem = (item) => {
	showAutocomplete.value = false;

	if (item._type.startsWith("tag.")) {
		searchQuery.value = item.title;
		performSearch(item.title);
		return;
	}

	const path = getResultPath(item);
	if (path) {
		// Check if we should use navigateTo (SPA) or open in new tab
		if (path.startsWith("http")) {
			window.open(path, "_blank");
		} else {
			navigateTo(path);
		}
	}
};

// Get the URL path for a search result
const getResultPath = (item) => {
	if (item._type.startsWith("tag.")) {
		return localePath(`/search?q=${encodeURIComponent(item.title)}`);
	}
	const slug = item.slug?.current || item.slug;
	if (!slug) return null;

	switch (item._type) {
		case "show":
			return localePath(`/shows/${slug}`);
		case "set": {
			// Sets need parent show slug
			const parentSlug =
				item.parentShow?.slug?.current || item.parentShow?.slug;
			return parentSlug
				? localePath(`/shows/${parentSlug}/${slug}`)
				: localePath(`/shows/${slug}`);
		}
		case "person":
			return localePath(`/pool/${slug}`);
		case "venue":
			return localePath(`/pool/${slug}`);
		case "article":
			return localePath(`/words/${slug}`);
		default:
			return null;
	}
};

const _getTypeIcon = (type) => {
	const icons = {
		show: "📻",
		set: "🎵",
		person: "👤",
		venue: "📍",
		article: "📝",
	};
	return icons[type] || "📄";
};

const getCategoryLabel = (type) => {
	if (type.startsWith("tag.")) return "Tag";
	if (["show", "set"].includes(type)) return "Shows";
	if (["person", "venue"].includes(type)) return "Pool";
	if (type === "article") return "Words";
	return type;
};

const getCategoryClass = (type) => {
	if (type.startsWith("tag.")) return "type-tag";
	if (["show", "set"].includes(type)) return "type-shows";
	if (["person", "venue"].includes(type)) return "type-pool";
	if (type === "article") return "type-article";
	return "";
};

// Hide autocomplete on scroll
const hideAutocompleteOnScroll = () => {
	if (showAutocomplete.value) {
		showAutocomplete.value = false;
	}
};

// Focus input on mount and add scroll listener
onMounted(() => {
	// Check for query parameters from URL
	const route = useRoute();
	const queryParam = route.query.q;
	const typeParam = route.query.type;

	// Handle type filter
	if (typeParam && typeof typeParam === "string") {
		if (["shows", "pool", "article"].includes(typeParam)) {
			activeContentTypes.value.add(typeParam);
		}
	}

	// Handle search query
	if (queryParam && typeof queryParam === "string") {
		skipAutocompleteReset.value = true;
		searchQuery.value = queryParam;
		// Trigger search immediately for URL query
		performSearch(queryParam);
	}

	nextTick(() => {
		inputRef.value?.focus();
	});
	window.addEventListener("scroll", hideAutocompleteOnScroll);
	document.addEventListener("click", handleClickOutside);
});

// Handle click outside to hide suggestions
const handleClickOutside = (event) => {
	const searchContainer = document.querySelector(".search-input-wrapper");
	if (searchContainer && !searchContainer.contains(event.target)) {
		showAutocomplete.value = false;
	}
};

onUnmounted(() => {
	if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
	if (searchTimeout) clearTimeout(searchTimeout);
	if (hideTimeout) clearTimeout(hideTimeout);
	window.removeEventListener("scroll", hideAutocompleteOnScroll);
	document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
	<div class="search-page">
		<!-- Search Section -->
		<section class="search-section">
			<div class="search-container">
				<!-- Search Input with Autocomplete -->
				<div class="search-input-wrapper">
					<div class="search-icon">
						<svg
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								cx="5.33765"
								cy="4.59622"
								r="2.75002"
								transform="rotate(45 5.33765 4.59622)"
							/>
							<path
								d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z"
							/>
						</svg>
					</div>
					<input
						ref="inputRef"
						v-model="searchQuery"
						type="text"
						class="search-input"
						placeholder="Start typing to search..."
						autocomplete="off"
						@keydown="handleKeydown"
						@blur="handleInputBlur"
					>
					<button
						v-if="hasQuery"
						class="clear-button"
						aria-label="Clear search"
						@click="clearSearch"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
					<div v-if="isLoading" class="loading-spinner" />

					<!-- Autocomplete Dropdown -->
					<div
						v-if="
							showAutocomplete &&
								autocompleteResults.length > 0 &&
								!suggestionsHidden
						"
						class="autocomplete-dropdown"
					>
						<button
							v-for="(item, index) in autocompleteResults"
							:key="item._id"
							class="autocomplete-item"
							:class="{ 'is-selected': index === selectedAutocompleteIndex }"
							@mousedown.prevent="selectAutocompleteItem(item)"
						>
							<span class="autocomplete-title">{{ item.title }}</span>
							<span
								class="autocomplete-type"
								:class="getCategoryClass(item._type)"
							>{{ getCategoryLabel(item._type) }}</span
							>
						</button>
					</div>
				</div>

				<!-- Type Filters (below search bar) -->
				<div class="type-filters">
					<button
						v-for="type in contentTypeOptions"
						:key="type.value"
						class="type-filter-btn"
						:class="{
							'is-active': isContentTypeActive(type.value),
							[`type-${type.value}`]: true,
						}"
						@click="toggleContentType(type.value)"
					>
						<span class="type-label">{{ type.label }}</span>
					</button>
				</div>
			</div>
		</section>

		<!-- Results Section -->
		<section class="results-section">
			<template v-if="hasQuery">
				<ModuleSearchResults
					:results="filteredResults"
					:search-query="searchQuery"
					:is-loading="isLoading"
					:active-content-type="activeContentType"
					:available-tags="availableTags"
				/>
			</template>

			<!-- Empty State (no query) -->
			<div v-else class="empty-state">
				<div class="empty-state-content">
					<p class="empty-state-text">
						Type to search for shows, people, venues, or articles
					</p>
					<!-- <div class="suggestion-grid">
            <NuxtLink :to="localePath('/shows')" class="suggestion-card shows">
              <span class="card-icon">📻</span>
              <span class="card-title">Shows</span>
              <span class="card-desc">Browse all radio shows</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/pool')" class="suggestion-card pool">
              <span class="card-icon">👥</span>
              <span class="card-title">Pool</span>
              <span class="card-desc">Discover artists & venues</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/words')" class="suggestion-card words">
              <span class="card-icon">📝</span>
              <span class="card-title">Words</span>
              <span class="card-desc">Read articles & stories</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/schedule')" class="suggestion-card schedule">
              <span class="card-icon">📅</span>
              <span class="card-title">Schedule</span>
              <span class="card-desc">See what's playing</span>
            </NuxtLink>
          </div> -->
				</div>
			</div>
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.search-page {
  width: 100%;
  min-height: 70vh;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
}

.search-hero {
  width: 100%;
  padding: var(--big-padding) var(--base-padding);
  text-align: center;
  border-bottom: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));

  .hero-content {
    max-width: var(--page-max-width);
    margin: 0 auto;
  }

  .hero-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: var(--small-padding);
    font-family: var(--font-headline);
  }

  .hero-subtitle {
    font-size: 1.125rem;
    color: var(--color-text-light, #888);
    font-family: var(--font-text);
  }
}

.search-section {
  width: 100%;
  max-width: var(--page-max-width);
  padding: var(--big-padding) var(--base-padding) var(--base-padding);
}

.search-container {
  max-width: 700px;
  margin: 0 auto;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--base-padding);
  padding: var(--base-padding) var(--big-padding);
  background: var(--color-bg);
  border: 1px solid var(--color-text);
  border-radius: 100px;
  transition: all 0.2s ease;
  height: calc(var(--base-font-size) + var(--base-padding) * 2 + 2px);

  &:focus-within {
  }

  .search-icon {
    display: flex;
    align-items: center;
    svg {
      width: var(--base-font-size);
      height: var(--base-font-size);
      path {
        fill: var(--color-text);
      }
      circle {
        stroke: var(--color-text);
      }
    }
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: var(--base-font-size);
    height: calc(var(--base-font-size) + var(--base-padding) * 2);
    color: var(--color-text);
    outline: none;
    font-family: var(--font-text-semibold);
    text-overflow: ellipsis;
    overflow-y: visible;
    white-space: nowrap;

    &::placeholder {
      color: var(--color-text-light, #888);
    }
  }

  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-light, #888);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.15s ease;

    &:hover {
      color: var(--color-text);
      background: rgba(0, 0, 0, 0.08);
    }
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
    border-top-color: var(--color-text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.type-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--small-padding);
  margin-top: var(--base-padding);
  padding: 0;
}

.type-filter-btn {
  color: var(--color-text);
  font-size: var(--small-font-size);
  font-family: var(--font-text-semibold);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
  padding: var(--small-padding) var(--base-padding);
  background-color: var(--color-bg);
  border-radius: 100px;
  border: 0.09325rem solid var(--color-text);
  &.type-shows {
    border-color: var(--color-pink);
    color: var(--color-pink);
    &:hover {
      border-color: var(--color-pink);
      color: var(--color-white);
      background: var(--color-pink);
    }
  }

  &.type-pool {
    border-color: var(--color-blue);
    color: var(--color-blue);
    &:hover {
      border-color: var(--color-blue);
      color: var(--color-white);
      background: var(--color-blue);
    }
  }

  &.type-article {
    border-color: var(--color-green);
    color: var(--color-green);
    &:hover {
      border-color: var(--color-green);
      color: var(--color-white);
      background: var(--color-green);
    }
  }

  &.is-active {
    background: var(--color-text);
    color: var(--color-bg);
    border-color: var(--color-text);

    &.type-shows {
      background: var(--color-pink);
      border-color: var(--color-pink);
    }

    &.type-pool {
      background: var(--color-blue);
      border-color: var(--color-blue);
    }

    &.type-article {
      background: var(--color-green);
      border-color: var(--color-green);
    }
  }

  .type-icon {
    font-size: 1rem;
  }
}

/* Autocomplete Dropdown */
.search-input-wrapper {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.15));
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  max-height: 200px;
  z-index: 99999;
}

.hide-suggestions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px var(--big-padding);
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  border: none;
  border-bottom: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
  font-size: 0.75rem;
  font-family: var(--font-text);
  color: var(--color-text-light, #888);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
    color: var(--color-text);
  }
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: var(--small-padding);
  width: 100%;
  padding: var(--small-padding) var(--big-padding);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover,
  &.is-selected {
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
  }

  .autocomplete-icon {
    font-size: 1.25rem;
  }

  .autocomplete-title {
    flex: 1;
    font-size: var(--base-font-size);
    font-family: var(--font-text-semibold);
    color: var(--color-text);
  }

  .autocomplete-type {
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    color: var(--color-text-light, #888);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    padding: var(--small-padding) var(--base-padding);
    background-color: var(--color-bg);
    border-radius: 100px;
    border: 0.09325rem solid var(--color-text);

    &.type-shows {
      border-color: var(--color-pink);
      color: var(--color-pink);
      &:hover {
        border-color: var(--color-pink);
        color: var(--color-white);
        background: var(--color-pink);
      }
    }

    &.type-pool {
      border-color: var(--color-blue);
      color: var(--color-blue);
      &:hover {
        border-color: var(--color-blue);
        color: var(--color-white);
        background: var(--color-blue);
      }
    }

    &.type-article {
      border-color: var(--color-green);
      color: var(--color-green);
      &:hover {
        border-color: var(--color-green);
        color: var(--color-white);
        background: var(--color-green);
      }
    }

    &.type-tag {
      border-color: var(--color-text);
      color: var(--color-text);
      &:hover {
        border-color: var(--color-text);
        color: var(--color-bg);
        background: var(--color-text);
      }
    }
  }
}

/* Tag Filters Section */
.tag-filters-section {
  margin-top: var(--big-padding);
  padding-top: var(--base-padding);
  border-top: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
}

.tag-filter-row {
  margin-bottom: var(--base-padding);
}

.tag-category-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.15));
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: var(--font-text);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-text);
  }

  &.is-expanded {
    border-color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
  }

  .category-icon {
    font-size: 1.1rem;
  }

  .category-label {
    flex: 1;
    text-align: left;
    font-weight: 500;
  }

  .category-count {
    color: var(--color-text-light, #888);
    font-size: 0.85rem;
  }

  .expand-icon {
    font-size: 1.25rem;
    font-weight: 300;
  }
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: var(--base-padding) var(--small-padding);
  margin-top: 8px;
  background: color-mix(in srgb, var(--color-text) 3%, transparent);
  border-radius: 8px;
}

.tag-chip {
  padding: 6px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.2));
  border-radius: 100px;
  font-size: 0.8rem;
  font-family: var(--font-text);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
  }

  &.is-active {
    background: var(--color-text);
    color: var(--color-bg);
    border-color: var(--color-text);
  }
}

.active-tag-filters {
  display: flex;
  align-items: center;
  gap: var(--base-padding);
  padding: var(--base-padding) 0;
  margin-top: var(--small-padding);

  .active-label {
    font-size: 0.85rem;
    color: var(--color-text-light, #888);
  }

  .reset-tags-btn {
    padding: 6px 14px;
    background: transparent;
    border: 1px solid var(--color-pink);
    border-radius: 100px;
    font-size: 0.8rem;
    font-family: var(--font-text);
    color: var(--color-pink);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: var(--color-pink);
      color: var(--color-bg);
    }
  }
}

.results-section {
  width: 100%;
  max-width: var(--page-max-width);
}

.empty-state {
  padding: var(--big-padding) 0;
  max-width: 700px;
  margin: 0 auto;
}

.empty-state-content {
  text-align: center;
}

.empty-state-text {
  color: var(--color-text-light, #888);
  font-size: var(--base-font-size);
  font-family: var(--font-text);
  margin-bottom: var(--big-padding);
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--base-padding);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.suggestion-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--big-padding);
  background: var(--color-bg);
  border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  &.shows {
    &:hover {
      border-color: var(--color-pink);
      background: color-mix(in srgb, var(--color-pink) 5%, transparent);
    }
  }

  &.pool {
    &:hover {
      border-color: var(--color-blue);
      background: color-mix(in srgb, var(--color-blue) 5%, transparent);
    }
  }

  &.words {
    &:hover {
      border-color: var(--color-green);
      background: color-mix(in srgb, var(--color-green) 5%, transparent);
    }
  }

  &.schedule {
    &:hover {
      border-color: var(--color-text);
    }
  }

  .card-icon {
    font-size: 2rem;
    margin-bottom: var(--small-padding);
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .card-desc {
    font-size: 0.875rem;
    color: var(--color-text-light, #888);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .suggestion-card:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  .clear-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
