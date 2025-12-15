<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMainStore } from "~/stores/mainStore";
import {
  SET_LIST_QUERY,
  SET_COUNT_QUERY,
  POOL_LIST_QUERY,
  POOL_COUNT_QUERY,
  ARTICLE_LIST_QUERY,
  ARTICLE_COUNT_QUERY,
  SHOW_LIST_QUERY,
  SHOW_COUNT_QUERY,
} from "~~/queries/module.queries";

const { locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();

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

const themeColor = computed(
  () => CONTENT_TYPE_COLORS[contentType.value] || "pink"
);

// ==================== HYBRID DATA LOADING ====================
// Determine if we need to load data ourselves (no pre-loaded items in props)
const needsSelfLoad = computed(() => {
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

// Self-loaded items (only used when needsSelfLoad is true)
const selfLoadedItems = ref<any[]>([]);
const selfLoadedCount = ref(0);
const isLoadingSelf = ref(false);
const selfLoadPage = ref(1);
const SELF_LOAD_PER_PAGE = 50;

// Map module type to query type
const getModuleQueryType = computed(() => {
  if (!props.module) return null;
  const type = props.module.type;
  if (type === 'pool') return 'pool';
  if (type === 'sets') return 'sets';
  if (type === 'shows') return 'shows';
  if (type === 'words') return 'words';
  return null;
});

// Function to load content from Sanity if needed
async function loadContentIfNeeded() {
  if (!needsSelfLoad.value || !getModuleQueryType.value) return;
  
  isLoadingSelf.value = true;
  
  try {
    const sanity = useSanity();
    const type = getModuleQueryType.value;
    const start = (selfLoadPage.value - 1) * SELF_LOAD_PER_PAGE;
    const end = selfLoadPage.value * SELF_LOAD_PER_PAGE;
    
    let query: string;
    let countQuery: string;
    let params: Record<string, any> = { start, end };
    
    switch (type) {
      case 'sets':
        query = SET_LIST_QUERY;
        countQuery = SET_COUNT_QUERY;
        break;
      case 'pool':
        query = POOL_LIST_QUERY;
        countQuery = POOL_COUNT_QUERY;
        const poolType = props.module.poolContentType;
        params.types = poolType === 'all' 
          ? ['person', 'venue'] 
          : poolType === 'persons' 
            ? ['person'] 
            : poolType === 'venues' 
              ? ['venue'] 
              : ['person', 'venue'];
        break;
      case 'shows':
        query = SHOW_LIST_QUERY;
        countQuery = SHOW_COUNT_QUERY;
        break;
      case 'words':
        query = ARTICLE_LIST_QUERY;
        countQuery = ARTICLE_COUNT_QUERY;
        break;
      default:
        return;
    }
    
    const [items, count] = await Promise.all([
      sanity.fetch(query, params),
      selfLoadedCount.value === 0 ? sanity.fetch(countQuery, params) : Promise.resolve(selfLoadedCount.value)
    ]);
    
    if (typeof count === 'number') {
      selfLoadedCount.value = count;
    }
    
    if (selfLoadPage.value === 1) {
      selfLoadedItems.value = items;
    } else {
      selfLoadedItems.value = [...selfLoadedItems.value, ...items];
    }
  } catch (error) {
    console.error('[ModuleContentGrid] Error loading content:', error);
  } finally {
    isLoadingSelf.value = false;
  }
}

// Load more self-loaded items
async function loadMoreSelfItems() {
  if (isLoadingSelf.value) return;
  if (selfLoadedItems.value.length >= selfLoadedCount.value) return;
  selfLoadPage.value++;
  await loadContentIfNeeded();
}

// ==================== COMPUTED: Items ====================
const allItems = computed(() => {
  if (!props.module) return [];
  
  // If we're self-loading, return self-loaded items
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

function filterPoolItems(items: any[], contentType: string) {
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
      : item._type === allowedTypes
  );
}

// ==================== COMPUTED: Tags ====================
const getUsedTagIdsInItems = computed(() => {
  const usedTagIds = new Set<string>();
  allItems.value.forEach((item) => {
    collectTagIds(item.tags, usedTagIds);
    collectTagIds(item.parentShow?.tags, usedTagIds);
  });
  return usedTagIds;
});

function collectTagIds(tags: any[] | undefined, set: Set<string>) {
  if (!Array.isArray(tags)) return;
  tags.forEach((tag) => tag?._id && set.add(tag._id));
}

const categorizedTags = computed(() => {
  const availableTags = props.module?.availableTags;
  if (!availableTags) return { genres: [], cities: [], global: [], mood: [] };

  const usedTagIds = getUsedTagIdsInItems.value;

  const filterByUsed = (tags: any[]) =>
    tags?.filter((t) => usedTagIds.has(t._id)) || [];

  const genres = (availableTags.genres || [])
    .map((genre) => {
      const isUsed = usedTagIds.has(genre._id);
      const usedSubGenres = filterByUsed(genre.subGenres);
      if (!isUsed && !usedSubGenres.length) return null;
      return { ...genre, subGenres: usedSubGenres };
    })
    .filter(Boolean);

  return {
    genres,
    cities: filterByUsed(availableTags.cities),
    global: filterByUsed(availableTags.global),
    mood: filterByUsed(availableTags.mood),
  };
});

const availableTags = computed(() => {
  if (!props.module?.availableTags) return [];
  const usedTagIds = getUsedTagIdsInItems.value;
  return Object.values(props.module.availableTags)
    .flat()
    .filter((tag: any) => tag?._id && usedTagIds.has(tag._id));
});

const poolTags = computed(() => {
  const tags = availableTags.value;
  const byType = (type: string) => tags.filter((t: any) => t._type === type);
  return {
    musicians: byType("tag.musician"),
    venues: byType("tag.venue"),
    crafts: byType("tag.crafts"),
    articles: byType("tag.article"),
  };
});

const getContentTypeSpecificTags = computed(() =>
  availableTags.value.filter((tag: any) => tag._type !== "tag.city")
);

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
  // Handle both string and i18n array formats
  if (!title) return "";
  if (typeof title === "string") return title;
  if (Array.isArray(title)) {
    return parseI18nObj(title) || title[0]?.value || "";
  }
  // Handle object format like { de: "...", en: "..." }
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

function getTagCategory(tagId: string): string {
  if (tagId === "others") return "city";
  const { cities, genres, mood } = categorizedTags.value;
  if (cities.some((t: any) => t._id === tagId)) return "city";
  if (genres.some((t: any) => t._id === tagId)) return "genre";
  for (const genre of genres) {
    if (genre.subGenres?.some((t: any) => t._id === tagId)) return "subGenre";
  }
  if (mood?.some((t: any) => t._id === tagId)) return "mood";

  const tag = availableTags.value.find((t: any) => t._id === tagId);
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
    ...categorizedTags.value.genres.map((g: any) => g.subGenres || []),
    availableTags.value,
  ];

  for (const source of searchSources) {
    const found = source?.find?.((t: any) => t._id === tagId);
    if (found) return getTagTitle(found.title);
  }
  return "Unknown Filter";
}

// ==================== FILTER LOGIC ====================
function toggleFilter(tagId: string) {
  const isActive = activeFilters.value.has(tagId);

  if (isActive) {
    activeFilters.value.delete(tagId);
    if (getTagCategory(tagId) === "subGenre")
      activeSubGenres.value.delete(tagId);
    if (tagId === "others") isOtherCitiesActive.value = false;
  } else {
    activeFilters.value.add(tagId);
    if (tagId === "others") isOtherCitiesActive.value = true;
  }

  visibleItemCount.value = ITEMS_PER_PAGE;
}

function toggleGenreFilter(genreId: string) {
  if (activeGenres.value.has(genreId)) {
    activeGenres.value.delete(genreId);
    const genre = categorizedTags.value.genres.find((g) => g._id === genreId);
    genre?.subGenres?.forEach((sg) => {
      activeSubGenres.value.delete(sg._id);
      activeFilters.value.delete(sg._id);
    });
  } else {
    activeGenres.value.add(genreId);
  }
  visibleItemCount.value = ITEMS_PER_PAGE;
}

function toggleSubGenreFilter(subGenreId: string) {
  if (activeSubGenres.value.has(subGenreId)) {
    activeSubGenres.value.delete(subGenreId);
    activeFilters.value.delete(subGenreId);
  } else {
    activeSubGenres.value.add(subGenreId);
    activeFilters.value.add(subGenreId);
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
  isOtherCitiesActive.value = false;
}

// ==================== ITEM MATCHING ====================
function itemHasTag(item: any, tagId: string): boolean {
  return getItemTags(item).some((t) => t._id === tagId);
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
          (b.title || b.name || b.parentShow?.title || "").toLowerCase()
        ),
    shuffle: null,
  };

  if (sortMode.value === "shuffle")
    return shuffleArray(items, shuffleSeed.value);
  return items.sort(sortFns[sortMode.value]);
});

const visibleItems = computed(() =>
  filteredItems.value.slice(0, visibleItemCount.value)
);
const hasMoreItems = computed(
  () => visibleItems.value.length < filteredItems.value.length
);

function loadMoreItems() {
  visibleItemCount.value += ITEMS_PER_PAGE;
}

// ==================== UI HELPERS ====================
function toggleFiltersVisibility() {
  showFilters.value = !showFilters.value;
}

function handleScroll() {
  const scrollY = window.scrollY;
  const scrollDiff = scrollY - lastScrollY.value;

  let isStuck = false;
  if (filterSection.value) {
    const rect = filterSection.value.getBoundingClientRect();
    const style = window.getComputedStyle(filterSection.value);
    const stickyTop = parseInt(style.top);

    // Check if the element is currently stuck (top position matches sticky offset)
    if (!isNaN(stickyTop) && Math.abs(rect.top - stickyTop) <= 2) {
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
  const routes = {
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

  const fallbacks = mainStore?.siteFallbacks;
  const fallbackMap = {
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

// Non-blocking artwork URL resolution - returns URL directly, browser handles 404s
function getSoundcloudArtwork(item: any): string {
  // Try SoundCloud artwork first (use -t500x500 for better quality without -original issues)
  const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;
  if (artworkUrl) {
    // Use t500x500 instead of original - more reliable
    return artworkUrl.replace("-large", "-t500x500");
  }
  // Fallback chain
  return (
    item?.parentShow?.image?.asset?.url ||
    mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url ||
    ""
  );
}

function loadArtworkUrl(item: any) {
  if (!item) return;
  const url = getSoundcloudArtwork(item);
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
onMounted(async () => {
  // Load content if this module needs self-loading
  if (needsSelfLoad.value && selfLoadedItems.value.length === 0) {
    await loadContentIfNeeded();
  }
  
  // Only load artwork URLs for initially visible items
  if (contentType.value === "sets") {
    visibleItems.value.forEach(loadArtworkUrl);
  }

  lastScrollY.value = window.scrollY;
  window.addEventListener("scroll", handleScroll, { passive: true });
});

// Load artwork URLs when more items become visible
watch(visibleItemCount, () => {
  if (contentType.value === "sets") {
    visibleItems.value.forEach((item: any) => {
      if (!artworkUrls.value.has(item._id)) {
        loadArtworkUrl(item);
      }
    });
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
<template>
  <ClientOnly>
    <div
      v-if="module"
      ref="moduleContainer"
      :class="`content-grid module-grid module-grid--${
        module.style || 'default'
      } ${categoryType.toLowerCase()}`"
    >
      <!-- Filter Panel -->
      <div class="content-grid__filter-section" ref="filterSection">
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
                {{ parseI18nObj(tag.title) }}
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
            <button
              :class="['sort-button', { active: sortMode === 'shuffle' }]"
              @click="changeSortMode('shuffle')"
            >
              <div class="dot"></div>
              Shuffle
            </button>
          </div>
        </div>

        <!-- Filter Tags Panel -->
        <div
          v-if="allItems.length > 0 && module.availableTags"
          class="content-grid__filters"
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
                    {{ tag.title }}
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
                    {{ tag.title }}
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
                <template v-if="contentType === 'sets'">
                  <img
                    v-if="item.image?.asset"
                    :src="item.image.asset.url"
                    :alt="item.title || ''"
                    loading="lazy"
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
                      loading="lazy"
                    />
                  </div>
                </template>
                <template v-else>
                  <img
                    v-if="getItemImage(item)"
                    :src="getItemImage(item).asset?.url"
                    :alt="item.title || ''"
                    loading="lazy"
                  />
                  <img
                    v-else
                    :src="
                      mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
                    "
                    alt="Fallback"
                    loading="lazy"
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
                  v-if="contentType === 'sets' && item.soundcloud"
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
              <div v-if="item.parentShow && contentType === 'sets'">
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
              <div v-if="contentType === 'words'" class="tags read-more">
                <NuxtLink :to="getItemRoute(item)" class="grid-item__link"
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
              <RichText
                v-else-if="
                  !item?.text &&
                  module.poolContentType === 'persons' &&
                  mainStore?.siteFallbacks?.fallbackPerson?.description
                    ?.length > 0
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
                  mainStore?.siteFallbacks?.fallbackVenue?.description?.length >
                    0
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
        <div v-else class="content-grid__no-results">No matching content.</div>

        <!-- Load More -->
        <div v-if="hasMoreItems" class="content-grid__load-more">
          <button @click="loadMoreItems" class="load-more-button">
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
  </ClientOnly>
</template>

<style lang="postcss" scoped>
/* ==================== BASE STYLES ==================== */
.content-grid {
  position: relative;
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

  .filter-toggle__button:hover {
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

  /* Content type specific styles */
  &.pool .grid-item__image img {
    aspect-ratio: 3 / 4;
  }

  &.words .content-grid__items {
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
@media (max-width: 768px) {
  .content-grid {
    &__items {
      grid-template-columns: repeat(2, 1fr);
    }
    &__filters .filter-subgenres {
      margin-left: 0;
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
}

@media (max-width: 480px) {
  .content-grid__items {
    grid-template-columns: 1fr;
  }
}
</style>