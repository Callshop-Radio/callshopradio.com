import { e as useI18n, f as useLocalePath, u as useMainStore, m as __nuxt_component_0$1, _ as _export_sfc, a as useHead, n as useSanity } from './server.mjs';
import { defineComponent, computed, ref, watch, useSSRContext, mergeProps, unref } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'lru-cache';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@sanity/client';
import 'vue-router';
import '@sanity/client/csm';
import '@sanity/visual-editing-csm';
import '@sanity/image-url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'unhead/plugins';
import 'unhead/utils';
import 'devalue';
import 'unlazy';
import 'hls.js';
import 'embla-carousel-vue';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ModuleSearchResults",
  __ssrInlineRender: true,
  props: {
    results: { type: Array, default: () => [] },
    searchQuery: { type: String, default: "" },
    isLoading: { type: Boolean, default: false },
    activeContentType: { type: String, default: "all" },
    availableTags: { type: Object, default: null }
  },
  setup(__props) {
    const { locale } = useI18n();
    useLocalePath();
    const mainStore = useMainStore();
    const props = __props;
    computed(() => {
      const type = props.activeContentType;
      if (type === "person" || type === "venue") return "Pool";
      if (type === "set" || type === "show") return "sets";
      if (type === "article") return "Words";
      return "sets";
    });
    const MAIN_CITIES = ["Vienna", "Düsseldorf", "Leipzig"];
    const activeFilters = ref(/* @__PURE__ */ new Set());
    const activeGenres = ref(/* @__PURE__ */ new Set());
    const activeSubGenres = ref(/* @__PURE__ */ new Set());
    ref(null);
    ref(false);
    ref(true);
    ref(0);
    const sortMode = ref("new");
    const artworkUrls = ref(/* @__PURE__ */ new Map());
    ref(null);
    const getUsedTagIdsInItems = computed(() => {
      const usedTagIds = /* @__PURE__ */ new Set();
      const addTags = (tags) => {
        if (Array.isArray(tags)) {
          tags.forEach((tag) => (tag == null ? void 0 : tag._id) && usedTagIds.add(tag._id));
        }
      };
      props.results.forEach((item) => {
        var _a;
        addTags(item.tags);
        addTags((_a = item.parentShow) == null ? void 0 : _a.tags);
      });
      return usedTagIds;
    });
    const categorizedTags = computed(() => {
      const usedTagIds = getUsedTagIdsInItems.value;
      if (props.availableTags) {
        const filterByUsed = (tags) => (tags == null ? void 0 : tags.filter((t) => usedTagIds.has(t._id))) || [];
        const genres2 = (props.availableTags.genres || []).map((genre) => {
          var _a;
          const isUsed = usedTagIds.has(genre._id);
          const usedSubGenres = ((_a = genre.subGenres) == null ? void 0 : _a.filter((t) => usedTagIds.has(t._id))) || [];
          if (!isUsed && !usedSubGenres.length) return null;
          return { ...genre, subGenres: usedSubGenres };
        }).filter(Boolean);
        return {
          genres: genres2,
          subGenres: [],
          // Subgenres are nested in genres
          cities: filterByUsed(props.availableTags.cities),
          global: filterByUsed(props.availableTags.global),
          mood: filterByUsed(props.availableTags.mood)
        };
      }
      const genres = [];
      const subGenres = [];
      const cities = [];
      const global = [];
      const mood = [];
      const addUnique = (arr, tag) => {
        if ((tag == null ? void 0 : tag._id) && !arr.some((t) => t._id === tag._id)) {
          arr.push(tag);
        }
      };
      props.results.forEach((item) => {
        var _a;
        const allTags = [...item.tags || [], ...((_a = item.parentShow) == null ? void 0 : _a.tags) || []];
        allTags.forEach((tag) => {
          if (tag.parentGenre) {
            addUnique(genres, tag.parentGenre);
          }
          if (!(tag == null ? void 0 : tag._type)) return;
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
    const poolTags = computed(() => {
      const musicians = [];
      const venues = [];
      const crafts = [];
      const articles = [];
      const addUnique = (arr, tag) => {
        if ((tag == null ? void 0 : tag._id) && !arr.some((t) => t._id === tag._id)) {
          arr.push(tag);
        }
      };
      props.results.forEach((item) => {
        var _a;
        const allTags = [...item.tags || [], ...((_a = item.parentShow) == null ? void 0 : _a.tags) || []];
        allTags.forEach((tag) => {
          if (!(tag == null ? void 0 : tag._type)) return;
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
              break;
            // Service tags also for venues
            case "tag.article":
              addUnique(articles, tag);
              break;
          }
        });
      });
      return { musicians, venues, crafts, articles };
    });
    computed(() => {
      var _a;
      const flattenedSubGenres = ((_a = categorizedTags.value.subGenres) == null ? void 0 : _a.length) ? categorizedTags.value.subGenres : categorizedTags.value.genres.flatMap((g) => g.subGenres || []);
      const showsTags = [
        ...categorizedTags.value.genres,
        ...flattenedSubGenres,
        ...categorizedTags.value.mood
      ];
      const poolTagsFlat = [
        ...poolTags.value.musicians,
        ...poolTags.value.venues,
        ...poolTags.value.crafts
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
          hasContent: showsTags.length > 0
        },
        pool: {
          tags: poolTagsFlat,
          musicians: poolTags.value.musicians,
          venues: poolTags.value.venues,
          crafts: poolTags.value.crafts,
          color: "blue",
          label: "Pool",
          hasContent: poolTagsFlat.length > 0
        },
        words: {
          tags: wordsTags,
          articles: poolTags.value.articles,
          color: "green",
          label: "Words",
          hasContent: wordsTags.length > 0
        }
      };
    });
    function getItemTags(item, type) {
      var _a;
      const tags = [];
      const addTags = (source) => {
        if (!Array.isArray(source)) return;
        source.forEach((tag) => {
          if (tag && (!type || tag._type === type) && !tags.some((t) => t._id === tag._id)) {
            tags.push(tag);
          }
        });
      };
      addTags(item.tags);
      addTags((_a = item.parentShow) == null ? void 0 : _a.tags);
      return tags;
    }
    const getItemCityTags = (item) => getItemTags(item, "tag.city");
    function itemHasTag(item, tagId) {
      return getItemTags(item).some((t) => t._id === tagId);
    }
    function itemHasCityByName(item, cityName) {
      const cityTags = getItemCityTags(item);
      return cityTags.some((t) => {
        const tagTitle = parseI18nObj(t.title) || t.title || t.short || "";
        return tagTitle.toLowerCase() === cityName.toLowerCase();
      });
    }
    function itemMatchesFilters(item) {
      if (activeGenres.value.size > 0) {
        if (activeSubGenres.value.size > 0) {
          for (const subGenreId of activeSubGenres.value) {
            if (!itemHasTag(item, subGenreId)) return false;
          }
        } else {
          const itemTags = getItemTags(item);
          const itemTagIds = new Set(itemTags.map((t) => t._id));
          let matchesGenre = false;
          for (const genreId of activeGenres.value) {
            if (itemTagIds.has(genreId)) {
              matchesGenre = true;
              break;
            }
            if (itemTags.some((t) => t._type === "tag.subGenre")) {
              matchesGenre = true;
              break;
            }
          }
          if (!matchesGenre) return false;
        }
      }
      if (activeFilters.value.size === 0) return true;
      for (const filterId of activeFilters.value) {
        if (filterId === "others") {
          const hasMainCity = MAIN_CITIES.some((city) => itemHasCityByName(item, city));
          if (hasMainCity) return false;
        } else if (MAIN_CITIES.includes(filterId)) {
          if (!itemHasCityByName(item, filterId)) return false;
        } else if (!itemHasTag(item, filterId)) {
          return false;
        }
      }
      return true;
    }
    const filteredItems = computed(() => {
      const items = props.results.filter(itemMatchesFilters);
      const sortFns = {
        new: (a, b) => new Date(b.datetime || b._updatedAt || b._createdAt || 0).getTime() - new Date(a.datetime || a._updatedAt || a._createdAt || 0).getTime(),
        alpha: (a, b) => {
          var _a, _b;
          return (a.title || a.name || ((_a = a.parentShow) == null ? void 0 : _a.title) || "").toLowerCase().localeCompare(
            (b.title || b.name || ((_b = b.parentShow) == null ? void 0 : _b.title) || "").toLowerCase()
          );
        }
      };
      return items.sort(sortFns[sortMode.value]);
    });
    computed(() => {
      const pool = [];
      const shows = [];
      const words = [];
      filteredItems.value.forEach((item) => {
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
    computed(() => filteredItems.value);
    function getSoundcloudArtwork(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      const artworkUrl = (_c = (_b = (_a = item == null ? void 0 : item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0]) == null ? void 0 : _c.artwork_url;
      if (artworkUrl) {
        return artworkUrl.replace("-large", "-t500x500");
      }
      const fallbacks = mainStore == null ? void 0 : mainStore.siteFallbacks;
      return ((_f = (_e = (_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.image) == null ? void 0 : _e.asset) == null ? void 0 : _f.url) || ((_i = (_h = (_g = fallbacks == null ? void 0 : fallbacks.fallbackSet) == null ? void 0 : _g.image) == null ? void 0 : _h.asset) == null ? void 0 : _i.url) || "";
    }
    function loadArtworkUrl(item) {
      if (!item) return;
      const url = getSoundcloudArtwork(item);
      artworkUrls.value.set(item._id, url);
    }
    watch(() => props.results, () => {
      props.results.forEach((item) => {
        if (item._type === "set" && !artworkUrls.value.has(item._id)) {
          loadArtworkUrl(item);
        }
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      _push(ssrRenderComponent(_component_ClientOnly, _attrs, {}, _parent));
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleSearchResults.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-44d7c603"]]), { __name: "ModuleSearchResults" });

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
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Search | Callshop Radio",
      meta: [
        {
          name: "description",
          content: "Search for shows, artists, venues, and articles on Callshop Radio."
        }
      ],
      bodyAttrs: {
        class: "search-page"
      }
    });
    useLocalePath();
    const searchQuery = ref("");
    const results = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    const activeContentTypes = ref(/* @__PURE__ */ new Set());
    const autocompleteResults = ref([]);
    const showAutocomplete = ref(false);
    const selectedAutocompleteIndex = ref(-1);
    const suggestionsHidden = ref(false);
    const skipAutocompleteReset = ref(false);
    ref(/* @__PURE__ */ new Set());
    ref(null);
    const availableTags = ref(null);
    ref(null);
    let autocompleteTimeout = null;
    let searchTimeout = null;
    let hideTimeout = null;
    const contentTypeOptions = [
      { value: "all", label: "All" },
      { value: "shows", label: "Shows" },
      { value: "pool", label: "Pool" },
      { value: "article", label: "Words" }
    ];
    const isValidSearchQuery = (query) => {
      if (!query) return false;
      const trimmed = query.trim();
      return trimmed.length > 0;
    };
    const hasQuery = computed(() => isValidSearchQuery(searchQuery.value));
    computed(() => results.value.length > 0);
    const filteredResults = computed(() => {
      if (activeContentTypes.value.size === 0) return results.value;
      return results.value.filter((item) => {
        if (activeContentTypes.value.has(item._type)) return true;
        if (activeContentTypes.value.has("pool") && ["person", "venue"].includes(item._type))
          return true;
        if (activeContentTypes.value.has("shows") && ["show", "set"].includes(item._type))
          return true;
        return false;
      });
    });
    const activeContentType = computed(() => {
      const types = Array.from(activeContentTypes.value);
      if (types.length === 0) return "all";
      if (types.length === 1) return types[0];
      const hasPool = types.some(
        (t) => t === "pool" || t === "person" || t === "venue"
      );
      const hasShows = types.some(
        (t) => t === "shows" || t === "show" || t === "set"
      );
      const hasWords = types.some((t) => t === "article");
      if (hasWords && !hasPool && !hasShows) return "article";
      if (hasPool && !hasShows && !hasWords) return "pool";
      if (hasShows && !hasPool && !hasWords) return "shows";
      return "all";
    });
    const categorizedTagsFromResults = computed(() => {
      const showTags = /* @__PURE__ */ new Map();
      const poolTags = /* @__PURE__ */ new Map();
      const articleTags = /* @__PURE__ */ new Map();
      results.value.forEach((item) => {
        var _a;
        const allTags = [...item.tags || [], ...((_a = item.parentShow) == null ? void 0 : _a.tags) || []];
        allTags.forEach((tag) => {
          if (!tag || !tag._id) return;
          if (["tag.genre", "tag.subGenre", "tag.global", "tag.mood"].includes(
            tag._type
          )) {
            showTags.set(tag._id, tag);
          } else if (["tag.musician", "tag.venue", "tag.crafts", "tag.service"].includes(
            tag._type
          )) {
            poolTags.set(tag._id, tag);
          } else if (tag._type === "tag.article") {
            articleTags.set(tag._id, tag);
          }
        });
      });
      return {
        showTags: Array.from(showTags.values()),
        poolTags: Array.from(poolTags.values()),
        articleTags: Array.from(articleTags.values())
      };
    });
    computed(() => {
      const cats = categorizedTagsFromResults.value;
      return cats.showTags.length > 0 || cats.poolTags.length > 0 || cats.articleTags.length > 0;
    });
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
          searchTerm: query.trim()
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
    const performAutocomplete = async (query) => {
      if (!isValidSearchQuery(query)) {
        autocompleteResults.value = [];
        return;
      }
      try {
        const sanity = useSanity();
        const suggestions = await sanity.fetch(AUTOCOMPLETE_QUERY, {
          searchTerm: query.trim()
        });
        autocompleteResults.value = suggestions || [];
        showAutocomplete.value = suggestions && suggestions.length > 0;
        selectedAutocompleteIndex.value = -1;
        if (hideTimeout) clearTimeout(hideTimeout);
        if (showAutocomplete.value) {
          hideTimeout = setTimeout(() => {
            showAutocomplete.value = false;
          }, 1e4);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
        autocompleteResults.value = [];
      }
    };
    watch(searchQuery, (newQuery) => {
      if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
      if (searchTimeout) clearTimeout(searchTimeout);
      if (skipAutocompleteReset.value) {
        suggestionsHidden.value = true;
        skipAutocompleteReset.value = false;
      } else {
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
      autocompleteTimeout = setTimeout(() => {
        performAutocomplete(newQuery);
      }, 150);
      searchTimeout = setTimeout(() => {
        performSearch(newQuery);
      }, 400);
    });
    const isContentTypeActive = (type) => {
      if (type === "all") return activeContentTypes.value.size === 0;
      return activeContentTypes.value.has(type);
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
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ModuleSearchResults = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "search-page" }, _attrs))} data-v-0433423b><section class="search-section" data-v-0433423b><div class="search-container" data-v-0433423b><div class="search-input-wrapper" data-v-0433423b><div class="search-icon" data-v-0433423b><svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-0433423b><circle cx="5.33765" cy="4.59622" r="2.75002" transform="rotate(45 5.33765 4.59622)" data-v-0433423b></circle><path d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z" data-v-0433423b></path></svg></div><input${ssrRenderAttr("value", unref(searchQuery))} type="text" class="search-input" placeholder="Start typing to search..." autocomplete="off" data-v-0433423b>`);
      if (unref(hasQuery)) {
        _push(`<button class="clear-button" aria-label="Clear search" data-v-0433423b><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-0433423b><path d="M18 6 6 18" data-v-0433423b></path><path d="m6 6 12 12" data-v-0433423b></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isLoading)) {
        _push(`<div class="loading-spinner" data-v-0433423b></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showAutocomplete) && unref(autocompleteResults).length > 0 && !unref(suggestionsHidden)) {
        _push(`<div class="autocomplete-dropdown" data-v-0433423b><!--[-->`);
        ssrRenderList(unref(autocompleteResults), (item, index2) => {
          _push(`<button class="${ssrRenderClass([{ "is-selected": index2 === unref(selectedAutocompleteIndex) }, "autocomplete-item"])}" data-v-0433423b><span class="autocomplete-title" data-v-0433423b>${ssrInterpolate(item.title)}</span><span class="${ssrRenderClass([getCategoryClass(item._type), "autocomplete-type"])}" data-v-0433423b>${ssrInterpolate(getCategoryLabel(item._type))}</span></button>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="type-filters" data-v-0433423b><!--[-->`);
      ssrRenderList(contentTypeOptions, (type) => {
        _push(`<button class="${ssrRenderClass([{
          "is-active": isContentTypeActive(type.value),
          [`type-${type.value}`]: true
        }, "type-filter-btn"])}" data-v-0433423b><span class="type-label" data-v-0433423b>${ssrInterpolate(type.label)}</span></button>`);
      });
      _push(`<!--]--></div></div></section><section class="results-section" data-v-0433423b>`);
      if (unref(hasQuery)) {
        _push(ssrRenderComponent(_component_ModuleSearchResults, {
          results: unref(filteredResults),
          "search-query": unref(searchQuery),
          "is-loading": unref(isLoading),
          "active-content-type": unref(activeContentType),
          "available-tags": unref(availableTags)
        }, null, _parent));
      } else {
        _push(`<div class="empty-state" data-v-0433423b><div class="empty-state-content" data-v-0433423b><p class="empty-state-text" data-v-0433423b> Type to search for shows, people, venues, or articles </p></div></div>`);
      }
      _push(`</section></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/search/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0433423b"]]);

export { index as default };
