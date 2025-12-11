<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMainStore } from "~/stores/mainStore";

const { locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();

const props = defineProps({
  results: { type: Array, default: () => [] },
  searchQuery: { type: String, default: "" },
  isLoading: { type: Boolean, default: false },
  activeContentType: { type: String, default: "all" },
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
  (props.results as any[]).forEach((item) => {
    collectTagIds(item.tags, usedTagIds);
    collectTagIds(item.parentShow?.tags, usedTagIds);
  });
  return usedTagIds;
});

function collectTagIds(tags: any[] | undefined, set: Set<string>) {
  if (!Array.isArray(tags)) return;
  tags.forEach((tag) => tag?._id && set.add(tag._id));
}

// Extract and categorize all tags from search results
const categorizedTags = computed(() => {
  const genres: any[] = [];
  const subGenres: any[] = [];
  const cities: any[] = [];
  const global: any[] = [];
  const mood: any[] = [];
  const usedTagIds = getUsedTagIdsInItems.value;

  const addUnique = (arr: any[], tag: any) => {
    if (usedTagIds.has(tag._id) && !arr.some((t) => t._id === tag._id)) {
      arr.push(tag);
    }
  };

  (props.results as any[]).forEach((item: any) => {
    const allTags = [...(item.tags || []), ...(item.parentShow?.tags || [])];
    allTags.forEach((tag: any) => {
      if (!tag?._type) return;
      switch (tag._type) {
        case "tag.city": addUnique(cities, tag); break;
        case "tag.genre": addUnique(genres, tag); break;
        case "tag.subGenre": addUnique(subGenres, tag); break;
        case "tag.global": addUnique(global, tag); break;
        case "tag.mood": addUnique(mood, tag); break;
      }
    });
  });

  return { genres, subGenres, cities, global, mood };
});

// Pool-specific tags extracted from results
const poolTags = computed(() => {
  const musicians: any[] = [];
  const venues: any[] = [];
  const crafts: any[] = [];
  const articles: any[] = [];
  const usedTagIds = getUsedTagIdsInItems.value;

  const addUnique = (arr: any[], tag: any) => {
    if (usedTagIds.has(tag._id) && !arr.some((t) => t._id === tag._id)) {
      arr.push(tag);
    }
  };

  (props.results as any[]).forEach((item: any) => {
    const allTags = [...(item.tags || []), ...(item.parentShow?.tags || [])];
    allTags.forEach((tag: any) => {
      if (!tag?._type) return;
      switch (tag._type) {
        case "tag.musician": addUnique(musicians, tag); break;
        case "tag.venue": addUnique(venues, tag); break;
        case "tag.crafts": addUnique(crafts, tag); break;
        case "tag.article": addUnique(articles, tag); break;
      }
    });
  });

  return { musicians, venues, crafts, articles };
});

// ==================== TAG HELPERS ====================
function getItemTags(item: any, type?: string): any[] {
  const tags: any[] = [];
  const addTags = (source: any[] | undefined) => {
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

const getItemCityTags = (item: any) => getItemTags(item, "tag.city");
const getItemNonCityTags = (item: any) =>
  (item.tags || []).filter((t: any) => t._type !== "tag.city");

function getTagTitle(title: any): string {
  if (!title) return "";
  if (typeof title === "string") return title;
  if (Array.isArray(title)) {
    return parseI18nObj(title) || title[0]?.value || "";
  }
  if (typeof title === "object") {
    return title.de || title.en || Object.values(title)[0] || "";
  }
  return String(title);
}

function isMainCity(cityTag: any): boolean {
  if (!cityTag?.title) return false;
  const cityName = getTagTitle(cityTag.title);
  return MAIN_CITIES.includes(cityName);
}

function getTagNameById(tagId: string): string {
  if (tagId === "others") return "Elsewhere";
  const city = categorizedTags.value.cities.find((t: any) => t._id === tagId);
  if (city) return getTagTitle(city.title);
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
function itemHasTag(item: any, tagId: string): boolean {
  return getItemTags(item).some((t) => t._id === tagId);
}

// Check if item has a city tag matching the city name
function itemHasCityByName(item: any, cityName: string): boolean {
  const cityTags = getItemCityTags(item);
  return cityTags.some((t) => {
    const tagTitle = parseI18nObj(t.title) || t.title || t.short || "";
    return tagTitle.toLowerCase() === cityName.toLowerCase();
  });
}

function itemMatchesFilters(item: any): boolean {
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
      const hasMainCity = MAIN_CITIES.some((city) => itemHasCityByName(item, city));
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
  const items = (props.results as any[]).filter(itemMatchesFilters);

  const sortFns = {
    new: (a: any, b: any) =>
      new Date(b.datetime || b._updatedAt || b._createdAt || 0).getTime() -
      new Date(a.datetime || a._updatedAt || a._createdAt || 0).getTime(),
    alpha: (a: any, b: any) =>
      (a.title || a.name || a.parentShow?.title || "")
        .toLowerCase()
        .localeCompare(
          (b.title || b.name || b.parentShow?.title || "").toLowerCase()
        ),
  };

  return items.sort(sortFns[sortMode.value]);
});

// Show all filtered items (no pagination limit)
const visibleItems = computed(() => filteredItems.value);

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

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==================== ROUTING ====================
function getItemRoute(item: any): string {
  if (!item?.slug) return "/";
  const slug = item.slug.current;
  const routes: Record<string, string> = {
    person: `/pool/${slug}`,
    venue: `/pool/${slug}`,
    set: item.parentShow?.slug?.current
      ? `/shows/${item.parentShow.slug.current}/${slug}`
      : `/shows/${slug}`,
    article: `/words/${slug}`,
    show: `/shows/${slug}`,
  };
  return localePath(routes[item._type] || `/${item._type}/${slug}`);
}

// ==================== IMAGE HANDLING ====================
function getItemImage(item: any) {
  if (item.image || item.mainImage) return item.image || item.mainImage;

  const fallbacks = mainStore?.siteFallbacks as any;
  const fallbackMap: Record<string, any> = {
    person: fallbacks?.fallbackPerson?.image,
    venue: fallbacks?.fallbackVenue?.image,
    show: fallbacks?.fallbackShow?.image,
    set: fallbacks?.fallbackSet?.image,
    word: fallbacks?.fallbackArticle?.image,
    article: fallbacks?.fallbackArticle?.image,
  };
  return fallbackMap[item._type] || fallbacks?.fallbackPerson?.image;
}

async function checkImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function getSoundcloudArtwork(item: any): Promise<string> {
  const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;
  if (artworkUrl) {
    const originalUrl = artworkUrl.replace("-large", "-original");
    if (await checkImage(originalUrl)) return originalUrl;
  }
  const fallbacks = mainStore?.siteFallbacks as any;
  return (
    item?.parentShow?.image?.asset?.url ||
    fallbacks?.fallbackSet?.image?.asset?.url ||
    ""
  );
}

async function loadArtworkUrl(item: any) {
  if (!item) return;
  const url = await getSoundcloudArtwork(item);
  artworkUrls.value.set(item._id, url);
}

function playTrack(item: any) {
  const track = item?.soundcloud?.tracks?.[0];
  if (!track) return;
  if (!track.permalink_url && track.id) {
    track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
  }
  mainStore.currentTrack = track;
}

// ==================== LIFECYCLE ====================
onMounted(() => {
  // Load artwork for sets
  (props.results as any[]).forEach((item) => {
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
watch(() => props.results, () => {
  // Load artwork for new set items
  (props.results as any[]).forEach((item) => {
    if (item._type === "set" && !artworkUrls.value.has(item._id)) {
      loadArtworkUrl(item);
    }
  });
});
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
              <span @click="resetFilters()" class="close-cross">
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

          <!-- Sort Options -->
          <div class="sort-options">
            <h4 class="sort-options__title">Sort</h4>
            <button
              :class="['sort-button', { active: sortMode === 'new' }]"
              @click="changeSortMode('new')"
            >
              <div class="dot"></div>
              New
            </button>
            <button
              :class="['sort-button', { active: sortMode === 'alpha' }]"
              @click="changeSortMode('alpha')"
            >
              <div class="dot"></div>
              A–Z
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Tags Panel (outside sort bar, like ModuleContentGrid) -->
      <div v-if="showFilters && filteredItems.length > 0" class="content-grid__filters">
        <div class="filter-container tags">
          <!-- For "All" content type: Show flat list of all first-level tags -->
          <template v-if="activeContentType === 'all'">
            <!-- Genres (flat) -->
            <div v-if="categorizedTags.genres?.length > 0" class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-tags">
                <button
                  v-for="genre in categorizedTags.genres"
                  :key="genre._id"
                  class="tag filter-tag filter-tag--genre"
                  :class="{ 'filter-tag--active': activeGenres.has(genre._id) }"
                  @click="toggleGenreFilter(genre._id)"
                >
                  {{ genre.title }}
                </button>
              </div>
              <!-- SubGenres when genres selected -->
              <div v-if="activeGenres.size > 0 && categorizedTags.subGenres?.length > 0" class="filter-subgenres">
                <button
                  v-for="subGenre in categorizedTags.subGenres"
                  :key="subGenre._id"
                  class="tag filter-tag filter-tag--subgenre"
                  :class="{ 'filter-tag--active': activeSubGenres.has(subGenre._id) }"
                  @click="toggleSubGenreFilter(subGenre._id)"
                >
                  {{ subGenre.title }}
                </button>
              </div>
            </div>

            <!-- Pool type labels -->
            <div v-if="poolTags.musicians?.length > 0 || poolTags.venues?.length > 0 || poolTags.crafts?.length > 0" class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-tags">
                <button
                  v-if="poolTags.musicians.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'musicians' }"
                  @click="toggleFilterType('musicians')"
                >
                  Musicians
                </button>
                <button
                  v-if="poolTags.venues.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'venues' }"
                  @click="toggleFilterType('venues')"
                >
                  Venues
                </button>
                <button
                  v-if="poolTags.crafts.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'crafts' }"
                  @click="toggleFilterType('crafts')"
                >
                  Crafts
                </button>
              </div>
              <!-- Pool type specific tags -->
              <div v-if="activeFilterType && poolTags[activeFilterType]?.length > 0" class="filter-tags">
                <button
                  v-for="tag in poolTags[activeFilterType]"
                  :key="tag._id"
                  class="tag filter-tag"
                  :class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
                  @click="toggleFilter(tag._id)"
                >
                  {{ tag.title }}
                </button>
              </div>
            </div>

            <!-- Article tags -->
            <div v-if="poolTags.articles?.length > 0" class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-tags">
                <button
                  v-for="tag in poolTags.articles"
                  :key="tag._id"
                  class="tag filter-tag"
                  :class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
                  @click="toggleFilter(tag._id)"
                >
                  {{ tag.title }}
                </button>
              </div>
            </div>
          </template>

          <!-- For Shows/Sets: Genre → SubGenre hierarchy -->
          <template v-else-if="activeContentType === 'show' || activeContentType === 'set'">
            <div v-if="categorizedTags.genres?.length > 0" class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-genres">
                <button
                  v-for="genre in categorizedTags.genres"
                  :key="genre._id"
                  class="tag filter-tag filter-tag--genre"
                  :class="{ 'filter-tag--active': activeGenres.has(genre._id) }"
                  @click="toggleGenreFilter(genre._id)"
                >
                  {{ genre.title }}
                </button>
              </div>
              <div v-if="activeGenres.size > 0" class="filter-subgenres">
                <button
                  v-for="subGenre in categorizedTags.subGenres"
                  :key="subGenre._id"
                  class="tag filter-tag filter-tag--subgenre"
                  :class="{ 'filter-tag--active': activeSubGenres.has(subGenre._id) }"
                  @click="toggleSubGenreFilter(subGenre._id)"
                >
                  {{ subGenre.title }}
                </button>
              </div>
            </div>
          </template>

          <!-- For Articles: Flat article tags -->
          <template v-else-if="activeContentType === 'article'">
            <div v-if="poolTags.articles?.length > 0" class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-tags">
                <button
                  v-for="tag in poolTags.articles"
                  :key="tag._id"
                  class="tag filter-tag"
                  :class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
                  @click="toggleFilter(tag._id)"
                >
                  {{ tag.title }}
                </button>
              </div>
            </div>
          </template>

          <!-- For Pool (person/venue): Type → Specific tags -->
          <template v-else-if="activeContentType === 'person' || activeContentType === 'venue'">
            <div class="filter-category tags" :class="{ active: showFilters }">
              <div class="filter-tags">
                <button
                  v-if="poolTags.musicians.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'musicians' }"
                  @click="toggleFilterType('musicians')"
                >
                  Musicians
                </button>
                <button
                  v-if="poolTags.venues.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'venues' }"
                  @click="toggleFilterType('venues')"
                >
                  Venues
                </button>
                <button
                  v-if="poolTags.crafts.length > 0"
                  class="tag filter-type"
                  :class="{ 'filter-type--active': activeFilterType === 'crafts' }"
                  @click="toggleFilterType('crafts')"
                >
                  Crafts
                </button>
              </div>
              <div v-if="activeFilterType && poolTags[activeFilterType]?.length > 0" class="filter-tags">
                <button
                  v-for="tag in poolTags[activeFilterType]"
                  :key="tag._id"
                  class="tag filter-tag"
                  :class="{ 'filter-tag--active': activeFilters.has(tag._id) }"
                  @click="toggleFilter(tag._id)"
                >
                  {{ tag.title }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="content-grid__loading">
        <div class="loading-spinner"></div>
        <span>Searching...</span>
      </div>

      <!-- Content Grid -->
      <div v-else class="content-grid__container">
        <div v-if="visibleItems.length > 0" class="content-grid__items">
          <div
            v-for="item in visibleItems"
            :key="item._id"
            :class="`grid-item grid-item--default`"
          >
            <!-- City Tags -->
            <div class="grid-item__tags city-tags">
              <span
                v-for="tag in getItemCityTags(item)"
                :key="tag._id"
                class="tag city"
                >{{ parseI18nObj(tag?.short) }}</span
              >
            </div>

            <!-- Image -->
            <NuxtLink
              v-if="item?.slug"
              :to="getItemRoute(item)"
              class="grid-item__link"
            >
              <div class="grid-item__image">
                <template v-if="item._type === 'set'">
                  <img
                    v-if="item.image?.asset"
                    :src="item.image.asset.url"
                    :alt="item.title || ''"
                  />
                  <div
                    v-else-if="item.soundcloud"
                    class="track-artwork"
                    @vue:mounted="loadArtworkUrl(item)"
                  >
                    <img
                      v-if="artworkUrls.get(item._id)"
                      :src="artworkUrls.get(item._id)"
                      alt="Track Artwork"
                    />
                  </div>
                </template>
                <template v-else>
                  <img
                    v-if="getItemImage(item)"
                    :src="getItemImage(item).asset?.url"
                    :alt="item.title || ''"
                  />
                  <img
                    v-else
                    :src="
                      (mainStore?.siteFallbacks as any)?.fallbackSet?.image?.asset?.url
                    "
                    alt="Fallback"
                  />
                </template>
              </div>
            </NuxtLink>

            <!-- Content -->
            <div class="grid-item__content">
              <section class="grid-item__content__interactive">
                <div
                  v-if="item.datetime || item.publishedAt"
                  class="grid-item__date"
                >
                  {{ formatDate(item.datetime || item.publishedAt) }}
                </div>
                <button
                  v-if="item._type === 'set' && item.soundcloud"
                  @click.prevent="playTrack(item)"
                  class="play-button"
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
              <div v-if="item.parentShow && item._type === 'set'">
                <NuxtLink
                  v-if="item.parentShow?.title !== 'No Show'"
                  :to="localePath(`/shows/${item.parentShow?.slug.current}`)"
                  class="grid-item__link"
                >
                  <h3 class="grid-item__title show-title">
                    {{ item.parentShow?.title }}
                  </h3>
                </NuxtLink>
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
                      :to="localePath(`/pool/${artist?.slug?.current}`)"
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
              <div v-if="item._type === 'article'" class="tags read-more">
                <NuxtLink :to="getItemRoute(item)" class="grid-item__link"
                  ><h3 class="tag">Read More</h3></NuxtLink
                >
              </div>

              <!-- Title -->
              <NuxtLink :to="getItemRoute(item)" class="grid-item__link">
                <h3 v-if="item._type !== 'set'" class="grid-item__title">
                  {{ item.title || item.name }}
                </h3>
              </NuxtLink>

              <!-- Teaser Text -->
              <RichText
                v-if="item?.useTeaserText && item?.textTeaser"
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
                  (item.description[0]?.value || item.description[1]?.value)
                "
                :blocks="
                  limitTextBlocks(
                    parseI18nObj(item?.description)?.slice(0, 1),
                    100
                  )
                "
              />

              <!-- Non-City Tags -->
              <div
                v-if="getItemNonCityTags(item).length > 0"
                class="grid-item__tags tags"
              >
                <span
                  v-for="tag in getItemNonCityTags(item)"
                  :key="tag._id"
                  class="tag"
                  >{{ tag.title }}</span
                >
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery && !isLoading" class="content-grid__no-results">
          No matching content for "{{ searchQuery }}".
        </div>
      </div>
    </div>

    <!-- No Results / Empty State -->
    <div v-else-if="searchQuery && !isLoading" class="search-empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No results found</h3>
      <p>
        We couldn't find anything matching "{{ searchQuery }}". Try different
        keywords or browse our content.
      </p>
    </div>
  </ClientOnly>
</template>

<style lang="postcss" scoped>
/* ==================== BASE STYLES ==================== */
.content-grid {
  position: relative;
  margin-top: var(--first-content-distance);
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
</style>
