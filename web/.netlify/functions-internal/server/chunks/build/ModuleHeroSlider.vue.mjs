import { I as IMAGE_QUERY, R as RICH_TEXT_QUERY, e as useI18n, f as useLocalePath, u as useMainStore, q as useAsyncData, i as __nuxt_component_0$1, d as __nuxt_component_1$2, n as useSanity, _ as _export_sfc, p as useRouter, h as __nuxt_component_2$1, l as useSwipe } from './server.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { defineComponent, ref, computed, withAsyncContext, watch, unref, withCtx, createVNode, createBlock, openBlock, Fragment, createCommentVNode, toDisplayString, createTextVNode, useSSRContext, mergeProps } from 'vue';
import { ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderAttrs, ssrRenderStyle } from 'vue/server-renderer';

const limitTextBlocks = (blocks, maxLength = 100) => {
  if (!blocks || !Array.isArray(blocks)) return blocks;
  const limitedBlocks = JSON.parse(JSON.stringify(blocks));
  for (const block of limitedBlocks) {
    if (block.children && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (child.text && child.text.length > maxLength) {
          child.text = child.text.substring(0, maxLength) + "…";
        }
      }
    }
  }
  return limitedBlocks;
};

const SET_BASE_FILTER = "_type == 'set' && datetime != null";
const SET_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  slug,
  datetime,
  _updatedAt,
  _createdAt,
  image ${IMAGE_QUERY},
  "soundcloud": soundcloud{
    _type,
    "tracks": tracks[]{
      id,
      created_at,
      duration,
      tag_list,
      streamable,
      purchase_url,
      genre,
      title,
      description,
      release_year,
      release_month,
      release_day,
      license,
      uri,
      permalink_url,
      "user": user{
        id,
        username,
        permalink_url
      },
      artwork_url,
      waveform_url,
      stream_url,
      playback_count,
      favoritings_count
    }
  },
  "tags": tags[]->{
    ...,
    _id,
    _type,
    title,
    short
  } | order(lower(title)),
  persons[]->{
    ...,
    _id,
    title
  },
  "parentShow": *[_type == "show" && references(^._id)][0]{
    ...,
    _id,
    title,
    slug,
    image { asset-> },
    "tags": tags[]->{
      ...,
      _id,
      _type,
      title,
      short
    } | order(lower(title)),
  }
}`;
const SET_LIST_QUERY = `*[${SET_BASE_FILTER}] | order(datetime desc)[$start...$end] ${SET_PROJECTION}`;
const SET_COUNT_QUERY = `
count(*[_type == 'set' && datetime != null])
`;
const POOL_BASE_FILTER = "_type in $types && poolVisibility == true";
const POOL_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  name,
  slug,
  image ${IMAGE_QUERY},
  datetime,
  _updatedAt,
  _createdAt,
  "tags": tags[]->{
    ...,
    _id,
    title
  } | order(lower(title)),
  location
}`;
const POOL_LIST_QUERY = `*[${POOL_BASE_FILTER}] | order(_updatedAt desc)[$start...$end] ${POOL_PROJECTION}`;
const POOL_COUNT_QUERY = `
count(*[_type in $types && poolVisibility == true])
`;
const ARTICLE_BASE_FILTER = "_type == 'article'";
const ARTICLE_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  datetime,
  slug,
  image ${IMAGE_QUERY},
  useTeaserText,
  textTeaser[] ${RICH_TEXT_QUERY},
  text[] ${RICH_TEXT_QUERY},
  description[] ${RICH_TEXT_QUERY},
  _updatedAt,
  _createdAt,
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title))
}`;
const ARTICLE_LIST_QUERY = `*[${ARTICLE_BASE_FILTER}] | order(datetime desc)[$start...$end] ${ARTICLE_PROJECTION}`;
const ARTICLE_COUNT_QUERY = `
count(*[_type == 'article'])
`;
const SHOW_BASE_FILTER = "_type == 'show'";
const SHOW_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  slug,
  datetime,
  _updatedAt,
  _createdAt,
  image ${IMAGE_QUERY},
  description[] ${RICH_TEXT_QUERY},
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title))
}`;
const SHOW_LIST_QUERY = `*[${SHOW_BASE_FILTER}] | order(datetime desc)[$start...$end] ${SHOW_PROJECTION}`;
const SHOW_COUNT_QUERY = `
count(*[_type == 'show'])
`;
const buildModuleQuery = (type, options = {}) => {
  const { start = 0, end = 24, filterTags = [], filterOrTags = [] } = options;
  let filterString = "";
  if (filterTags.length > 0) {
    filterTags.forEach((tagId) => {
      filterString += ` && references("${tagId}")`;
    });
  }
  if (filterOrTags.length > 0) {
    filterOrTags.forEach((group) => {
      if (group.length > 0) {
        const quotedIds = group.map((id) => `"${id}"`).join(", ");
        filterString += ` && references(${quotedIds})`;
      }
    });
  }
  const buildParams = { start, end };
  const getQuery = (baseFilter, projection, orderBy = "order(datetime desc)") => ({
    query: `*[${baseFilter}${filterString}] | ${orderBy}[$start...$end] ${projection}`,
    countQuery: `count(*[${baseFilter}${filterString}])`,
    params: buildParams
  });
  switch (type) {
    case "sets":
      return getQuery(SET_BASE_FILTER, SET_PROJECTION);
    case "pool":
      const poolParams = {
        ...buildParams,
        types: options.contentType ? Array.isArray(options.contentType) ? options.contentType : [options.contentType] : ["person", "venue"]
      };
      return {
        query: `*[${POOL_BASE_FILTER}${filterString}] | order(_updatedAt desc)[$start...$end] ${POOL_PROJECTION}`,
        countQuery: `count(*[${POOL_BASE_FILTER}${filterString}])`,
        params: poolParams
      };
    case "shows":
      return getQuery(SHOW_BASE_FILTER, SHOW_PROJECTION);
    case "words":
      return getQuery(ARTICLE_BASE_FILTER, ARTICLE_PROJECTION);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

const module_queries = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ARTICLE_BASE_FILTER: ARTICLE_BASE_FILTER,
  ARTICLE_COUNT_QUERY: ARTICLE_COUNT_QUERY,
  ARTICLE_LIST_QUERY: ARTICLE_LIST_QUERY,
  ARTICLE_PROJECTION: ARTICLE_PROJECTION,
  POOL_BASE_FILTER: POOL_BASE_FILTER,
  POOL_COUNT_QUERY: POOL_COUNT_QUERY,
  POOL_LIST_QUERY: POOL_LIST_QUERY,
  POOL_PROJECTION: POOL_PROJECTION,
  SET_BASE_FILTER: SET_BASE_FILTER,
  SET_COUNT_QUERY: SET_COUNT_QUERY,
  SET_LIST_QUERY: SET_LIST_QUERY,
  SET_PROJECTION: SET_PROJECTION,
  SHOW_BASE_FILTER: SHOW_BASE_FILTER,
  SHOW_COUNT_QUERY: SHOW_COUNT_QUERY,
  SHOW_LIST_QUERY: SHOW_LIST_QUERY,
  SHOW_PROJECTION: SHOW_PROJECTION,
  buildModuleQuery: buildModuleQuery
});

const ITEMS_PER_PAGE = 9;
const SELF_LOAD_PER_PAGE = 50;
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "ModuleContentGrid",
  __ssrInlineRender: true,
  props: {
    module: { type: Object, required: true }
  },
  async setup(__props) {
    let __temp, __restore;
    const { locale } = useI18n();
    const localePath = useLocalePath();
    const mainStore = useMainStore();
    const props = __props;
    const MAIN_CITIES = ["Düsseldorf", "Leipzig", "Vienna"];
    const CONTENT_TYPE_COLORS = {
      sets: "pink",
      shows: "pink",
      words: "green",
      pool: "blue",
      persons: "blue",
      venues: "blue",
      all: "blue"
    };
    const activeFilters = ref(/* @__PURE__ */ new Set());
    const activeGenres = ref(/* @__PURE__ */ new Set());
    const activeSubGenres = ref(/* @__PURE__ */ new Set());
    const isOtherCitiesActive = ref(false);
    const activeFilterType = ref(null);
    const showFilters = ref(true);
    ref(0);
    const sortMode = ref("new");
    const shuffleSeed = ref(Date.now());
    const visibleItemCount = ref(ITEMS_PER_PAGE);
    const artworkUrls = ref(/* @__PURE__ */ new Map());
    ref(null);
    ref(null);
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
    computed(
      () => CONTENT_TYPE_COLORS[contentType.value] || "pink"
    );
    const forceSelfLoad = ref(false);
    const needsSelfLoad = computed(() => {
      if (forceSelfLoad.value) return true;
      if (!props.module) return false;
      const { type, poolItems, setItems, showItems, articleItems } = props.module;
      const hasItems = {
        pool: (poolItems == null ? void 0 : poolItems.length) > 0,
        sets: (setItems == null ? void 0 : setItems.length) > 0,
        shows: (showItems == null ? void 0 : showItems.length) > 0,
        words: (articleItems == null ? void 0 : articleItems.length) > 0
      };
      return !hasItems[type];
    });
    const selfLoadedCount = ref(0);
    const isLoadingSelf = ref(false);
    const selfLoadPage = ref(1);
    const getModuleQueryType = computed(() => {
      if (!props.module) return null;
      const type = props.module.type;
      if (type === "pool") return "pool";
      if (type === "sets") return "sets";
      if (type === "shows") return "shows";
      if (type === "words") return "words";
      return null;
    });
    const buildQueryConfig = () => {
      const type = getModuleQueryType.value;
      if (!type) return null;
      const start = (selfLoadPage.value - 1) * SELF_LOAD_PER_PAGE;
      const end = selfLoadPage.value * SELF_LOAD_PER_PAGE;
      const filterTags = [];
      const filterOrTags = [];
      if (activeFilters.value.size > 0) {
        activeFilters.value.forEach((tagId) => {
          if (tagId === "others") {
            const otherCityIds = categorizedTags.value.cities.filter((c) => !isMainCity({ title: c.title })).map((c) => c._id);
            if (otherCityIds.length > 0) {
              filterOrTags.push(otherCityIds);
            }
          } else {
            filterTags.push(tagId);
          }
        });
      }
      if (activeGenres.value.size > 0 && activeSubGenres.value.size === 0) {
        const genreOrGroup = [];
        activeGenres.value.forEach((genreId) => {
          var _a;
          genreOrGroup.push(genreId);
          const genre = categorizedTags.value.genres.find(
            (g) => g._id === genreId
          );
          (_a = genre == null ? void 0 : genre.subGenres) == null ? void 0 : _a.forEach((sg) => genreOrGroup.push(sg._id));
        });
        if (genreOrGroup.length > 0) {
          filterOrTags.push(genreOrGroup);
        }
      }
      let params = {
        start,
        end,
        filterTags,
        filterOrTags
      };
      switch (type) {
        case "sets":
          return { query: SET_LIST_QUERY, countQuery: SET_COUNT_QUERY, params };
        case "pool":
          const poolType = props.module.poolContentType;
          params.types = poolType === "all" ? ["person", "venue"] : poolType === "persons" ? ["person"] : poolType === "venues" ? ["venue"] : ["person", "venue"];
          return { query: POOL_LIST_QUERY, countQuery: POOL_COUNT_QUERY, params };
        case "shows":
          return { query: SHOW_LIST_QUERY, countQuery: SHOW_COUNT_QUERY, params };
        case "words":
          return {
            query: ARTICLE_LIST_QUERY,
            countQuery: ARTICLE_COUNT_QUERY,
            params
          };
        default:
          return null;
      }
    };
    const { data: selfLoadedItems, pending: isLoadingInitial } = ([__temp, __restore] = withAsyncContext(async () => {
      var _a, _b, _c;
      return useAsyncData(
        `module-content-grid-${((_a = props.module) == null ? void 0 : _a._key) || ((_b = props.module) == null ? void 0 : _b.type)}-${((_c = props.module) == null ? void 0 : _c.poolContentType) || "default"}`,
        async () => {
          if (!needsSelfLoad.value) return [];
          const config = buildQueryConfig();
          if (!config) return [];
          try {
            const sanity = useSanity();
            const [items, count] = await Promise.all([
              sanity.fetch(config.query, config.params),
              sanity.fetch(config.countQuery, config.params)
            ]);
            if (typeof count === "number") {
              selfLoadedCount.value = count;
            }
            return items || [];
          } catch (error) {
            console.error("[ModuleContentGrid] SSR Data Fetch Error:", error);
            return [];
          }
        },
        {
          default: () => [],
          lazy: false
          // Load immediately for SSR
          // server: true // explicit
        }
      );
    }), __temp = await __temp, __restore(), __temp);
    async function fetchActiveContent(reset = false) {
      const config = buildQueryConfig();
      if (!config) return;
      isLoadingSelf.value = true;
      if (reset) {
        selfLoadPage.value = 1;
        config.params.start = 0;
        config.params.end = SELF_LOAD_PER_PAGE;
        forceSelfLoad.value = true;
      }
      try {
        const sanity = useSanity();
        const { buildModuleQuery: buildModuleQuery2 } = await Promise.resolve().then(function () { return module_queries; });
        const queryData = buildModuleQuery2(getModuleQueryType.value, {
          start: config.params.start,
          end: config.params.end,
          contentType: config.params.types,
          filterTags: config.params.filterTags,
          filterOrTags: config.params.filterOrTags
        });
        const [items, count] = await Promise.all([
          sanity.fetch(queryData.query, queryData.params),
          sanity.fetch(queryData.countQuery, queryData.params)
        ]);
        if (typeof count === "number") {
          selfLoadedCount.value = count;
        }
        if (reset) {
          selfLoadedItems.value = items || [];
        } else {
          if (selfLoadedItems.value) {
            selfLoadedItems.value = [...selfLoadedItems.value, ...items || []];
          }
        }
      } catch (error) {
        console.error("[ModuleContentGrid] Error fetching content:", error);
      } finally {
        isLoadingSelf.value = false;
      }
    }
    watch(
      [activeFilters, activeGenres, activeSubGenres],
      () => {
        fetchActiveContent(true);
      },
      { deep: true }
    );
    const allItems = computed(() => {
      var _a;
      if (!props.module) return [];
      if (needsSelfLoad.value) {
        return selfLoadedItems.value;
      }
      const {
        type,
        poolItems,
        setItems,
        showItems,
        articleItems,
        poolContentType
      } = props.module;
      const itemsMap = {
        pool: () => filterPoolItems(poolItems || [], poolContentType),
        sets: () => setItems || [],
        shows: () => showItems || [],
        words: () => articleItems || []
      };
      return ((_a = itemsMap[type]) == null ? void 0 : _a.call(itemsMap)) || [];
    });
    function filterPoolItems(items, contentType2) {
      if (!(items == null ? void 0 : items.length)) return [];
      const typeMap = {
        persons: "person",
        venues: "venue",
        all: ["venue", "person"]
      };
      const allowedTypes = typeMap[contentType2];
      if (!allowedTypes) return items;
      return items.filter(
        (item) => Array.isArray(allowedTypes) ? allowedTypes.includes(item._type) : item._type === allowedTypes
      );
    }
    computed(() => {
      return /* @__PURE__ */ new Set();
    });
    const categorizedTags = computed(() => {
      var _a;
      const availableTags2 = (_a = props.module) == null ? void 0 : _a.availableTags;
      if (!availableTags2) return { genres: [], cities: [], global: [], mood: [] };
      const genres = (availableTags2.genres || []).map((genre) => {
        return { ...genre, subGenres: genre.subGenres || [] };
      });
      return {
        genres,
        cities: availableTags2.cities || [],
        global: availableTags2.global || [],
        mood: availableTags2.mood || []
      };
    });
    const availableTags = computed(() => {
      var _a;
      if (!((_a = props.module) == null ? void 0 : _a.availableTags)) return [];
      return Object.values(props.module.availableTags).flat().filter((tag) => tag == null ? void 0 : tag._id);
    });
    const poolTags = computed(() => {
      const tags = availableTags.value;
      const byType = (type) => tags.filter((t) => t._type === type);
      return {
        musicians: byType("tag.musician"),
        venues: byType("tag.venue"),
        crafts: byType("tag.crafts"),
        articles: byType("tag.article")
      };
    });
    const getContentTypeSpecificTags = computed(
      () => availableTags.value.filter((tag) => tag._type !== "tag.city")
    );
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
    const getItemNonCityTags = (item) => (item.tags || []).filter((t) => t._type !== "tag.city");
    function getTagTitle(title) {
      var _a;
      if (!title) return "";
      if (typeof title === "string") return title;
      if (Array.isArray(title)) {
        return parseI18nObj(title) || ((_a = title[0]) == null ? void 0 : _a.value) || "";
      }
      if (typeof title === "object") {
        return title.de || title.en || Object.values(title)[0] || "";
      }
      return String(title);
    }
    function isMainCity(cityTag) {
      if (!(cityTag == null ? void 0 : cityTag.title)) return false;
      const cityName = getTagTitle(cityTag.title);
      return MAIN_CITIES.includes(cityName);
    }
    function getTagNameById(tagId) {
      var _a;
      if (tagId === "others") return "Elsewhere";
      const searchSources = [
        categorizedTags.value.cities,
        categorizedTags.value.genres,
        categorizedTags.value.mood,
        categorizedTags.value.global,
        ...categorizedTags.value.genres.map((g) => g.subGenres || []),
        availableTags.value
      ];
      for (const source of searchSources) {
        const found = (_a = source == null ? void 0 : source.find) == null ? void 0 : _a.call(source, (t) => t._id === tagId);
        if (found) return getTagTitle(found.title);
      }
      return "Unknown Filter";
    }
    const filterHistory = ref([]);
    function itemHasTag(item, tagId) {
      return getItemTags(item).some((t) => t._id === tagId);
    }
    function itemMatchesFilters(item) {
      if (activeGenres.value.size > 0) {
        if (activeSubGenres.value.size > 0) {
          for (const subGenreId of activeSubGenres.value) {
            if (!itemHasTag(item, subGenreId)) return false;
          }
        } else {
          const allowedIds = /* @__PURE__ */ new Set();
          activeGenres.value.forEach((gId) => {
            var _a, _b;
            allowedIds.add(gId);
            (_b = (_a = categorizedTags.value.genres.find((g) => g._id === gId)) == null ? void 0 : _a.subGenres) == null ? void 0 : _b.forEach((sg) => allowedIds.add(sg._id));
          });
          if (!getItemTags(item).some((t) => allowedIds.has(t._id))) return false;
        }
      }
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
    function seededRandom(seed) {
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    }
    function shuffleArray(array, seed) {
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
        new: (a, b) => new Date(b.datetime || b._updatedAt || b._createdAt || 0).getTime() - new Date(a.datetime || a._updatedAt || a._createdAt || 0).getTime(),
        alpha: (a, b) => {
          var _a, _b;
          return (a.title || a.name || ((_a = a.parentShow) == null ? void 0 : _a.title) || "").toLowerCase().localeCompare(
            (b.title || b.name || ((_b = b.parentShow) == null ? void 0 : _b.title) || "").toLowerCase()
          );
        },
        shuffle: null
      };
      if (sortMode.value === "shuffle")
        return shuffleArray(items, shuffleSeed.value);
      return items.sort(sortFns[sortMode.value]);
    });
    const visibleItems = computed(() => {
      return filteredItems.value.slice(0, visibleItemCount.value);
    });
    const hasMoreItems = computed(
      () => visibleItems.value.length < filteredItems.value.length
    );
    function formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
    function getItemRoute(item) {
      var _a, _b;
      if (!(item == null ? void 0 : item.slug)) return "/";
      const slug = item.slug.current;
      const routes = {
        person: `/pool/${slug}`,
        venue: `/pool/${slug}`,
        set: ((_b = (_a = item.parentShow) == null ? void 0 : _a.slug) == null ? void 0 : _b.current) ? `/shows/${item.parentShow.slug.current}/${slug}` : `/shows/${slug}`,
        article: `/words/${slug}`,
        show: `/shows/${slug}`
      };
      return localePath(routes[item._type] || `/${item._type}/${slug}`);
    }
    function getItemImage(item) {
      var _a, _b, _c, _d, _e, _f, _g;
      if (item.image || item.mainImage) return item.image || item.mainImage;
      const fallbacks = mainStore == null ? void 0 : mainStore.siteFallbacks;
      const fallbackMap = {
        person: (_a = fallbacks == null ? void 0 : fallbacks.fallbackPerson) == null ? void 0 : _a.image,
        venue: (_b = fallbacks == null ? void 0 : fallbacks.fallbackVenue) == null ? void 0 : _b.image,
        show: (_c = fallbacks == null ? void 0 : fallbacks.fallbackShow) == null ? void 0 : _c.image,
        set: (_d = fallbacks == null ? void 0 : fallbacks.fallbackSet) == null ? void 0 : _d.image,
        word: (_e = fallbacks == null ? void 0 : fallbacks.fallbackArticle) == null ? void 0 : _e.image,
        article: (_f = fallbacks == null ? void 0 : fallbacks.fallbackArticle) == null ? void 0 : _f.image
      };
      return fallbackMap[item._type] || ((_g = fallbacks == null ? void 0 : fallbacks.fallbackPerson) == null ? void 0 : _g.image);
    }
    function getSoundcloudArtwork(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const artworkUrl = (_c = (_b = (_a = item == null ? void 0 : item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0]) == null ? void 0 : _c.artwork_url;
      if (artworkUrl) {
        return artworkUrl.replace("-large", "-t500x500");
      }
      return ((_f = (_e = (_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.image) == null ? void 0 : _e.asset) == null ? void 0 : _f.url) || ((_j = (_i = (_h = (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _g.fallbackSet) == null ? void 0 : _h.image) == null ? void 0 : _i.asset) == null ? void 0 : _j.url) || "";
    }
    function loadArtworkUrl(item) {
      if (!item) return;
      const url = getSoundcloudArtwork(item);
      artworkUrls.value.set(item._id, url);
    }
    watch(visibleItemCount, () => {
      if (contentType.value === "sets") {
        visibleItems.value.forEach((item) => {
          if (!artworkUrls.value.has(item._id)) {
            loadArtworkUrl(item);
          }
        });
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_RichText = __nuxt_component_1$2;
      _push(`<!--[-->`);
      if (unref(isLoadingInitial) && needsSelfLoad.value) {
        _push(`<div class="module-loading" data-v-dc907b59><div class="loading-skeleton" data-v-dc907b59><div class="skeleton-header" data-v-dc907b59></div><div class="skeleton-grid" data-v-dc907b59><!--[-->`);
        ssrRenderList(9, (i) => {
          _push(`<div class="skeleton-item" data-v-dc907b59></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.module) {
        _push(`<div class="${ssrRenderClass(`content-grid module-grid module-grid--${__props.module.style || "default"} ${categoryType.value.toLowerCase()}`)}" data-v-dc907b59><div class="content-grid__filter-section" data-v-dc907b59><div class="content-grid__filter-bar" data-v-dc907b59><div class="active-filters" data-v-dc907b59><h4 class="${ssrRenderClass([{ active: activeFilters.value.size > 0 }, "active-filters__title"])}" data-v-dc907b59><span class="close-cross" data-v-dc907b59><svg width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-dc907b59><circle cx="4" cy="4" r="4" fill="black" data-v-dc907b59></circle><rect x="1.77783" y="2.4082" width="0.888889" height="5.33333" transform="rotate(-45 1.77783 2.4082)" fill="#E8E8E8" data-v-dc907b59></rect><path d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z" fill="#E8E8E8" data-v-dc907b59></path></svg></span><span data-v-dc907b59>Tags <span class="toggle-arrow" data-v-dc907b59>${ssrInterpolate(showFilters.value ? "↑" : "↓")}</span></span></h4><div class="active-filters__list tags" data-v-dc907b59><!--[-->`);
        ssrRenderList(activeFilters.value, (filterId) => {
          _push(`<div class="active-filter tag" data-v-dc907b59><span class="active-filter__name" data-v-dc907b59>${ssrInterpolate(getTagNameById(filterId))} <span class="close-cross" data-v-dc907b59><svg width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-dc907b59><circle cx="4" cy="4" r="4" fill="black" data-v-dc907b59></circle><rect x="1.77783" y="2.4082" width="0.888889" height="5.33333" transform="rotate(-45 1.77783 2.4082)" fill="#E8E8E8" data-v-dc907b59></rect><path d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z" fill="#E8E8E8" data-v-dc907b59></path></svg></span></span></div>`);
        });
        _push(`<!--]--></div></div>`);
        if (((_a = categorizedTags.value.cities) == null ? void 0 : _a.length) > 0) {
          _push(`<div class="filter-cities tags" data-v-dc907b59><h4 class="filter-cities__title" data-v-dc907b59>City</h4><div class="filter-tags" data-v-dc907b59><!--[-->`);
          ssrRenderList(categorizedTags.value.cities.filter(isMainCity), (tag) => {
            _push(`<button class="${ssrRenderClass([{ "filter-tag--active": activeFilters.value.has(tag._id) }, "tag filter-tag filter-tag--city"])}" data-v-dc907b59>${ssrInterpolate(("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag.title))}</button>`);
          });
          _push(`<!--]-->`);
          if (categorizedTags.value.cities.some((tag) => !isMainCity(tag))) {
            _push(`<button class="${ssrRenderClass([{ "filter-tag--active": isOtherCitiesActive.value }, "tag filter-tag filter-tag--city"])}" data-v-dc907b59> Elsewhere </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="sort-options" data-v-dc907b59><h4 class="sort-options__title" data-v-dc907b59>Sort</h4><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "new" }])}" data-v-dc907b59><div class="dot" data-v-dc907b59></div> New </button><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "alpha" }])}" data-v-dc907b59><div class="dot" data-v-dc907b59></div> A–Z </button><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "shuffle" }])}" data-v-dc907b59><div class="dot" data-v-dc907b59></div> Shuffle </button></div></div>`);
        if (__props.module.availableTags) {
          _push(`<div class="content-grid__filters" data-v-dc907b59><div class="filter-container tags" data-v-dc907b59>`);
          if (contentType.value === "sets") {
            _push(`<!--[-->`);
            if (((_b = categorizedTags.value.genres) == null ? void 0 : _b.length) > 0) {
              _push(`<div class="${ssrRenderClass([{ active: showFilters.value }, "filter-category tags"])}" data-v-dc907b59><div class="filter-genres" data-v-dc907b59><!--[-->`);
              ssrRenderList(categorizedTags.value.genres, (genre) => {
                _push(`<div class="filter-genre" data-v-dc907b59><button class="${ssrRenderClass([{
                  "filter-tag--active": activeGenres.value.has(genre._id)
                }, "tag filter-tag filter-tag--genre"])}" data-v-dc907b59>${ssrInterpolate(genre.title)}</button></div>`);
              });
              _push(`<!--]--></div><div class="filter-subgenres" data-v-dc907b59>`);
              if (activeGenres.value.size > 0) {
                _push(`<div class="filter-subgenre" data-v-dc907b59><div class="filter-subgenre__tags" data-v-dc907b59><!--[-->`);
                ssrRenderList(categorizedTags.value.genres.filter(
                  (g) => activeGenres.value.has(g._id)
                ), (genre) => {
                  _push(`<!--[--><!--[-->`);
                  ssrRenderList(genre.subGenres || [], (subGenre) => {
                    _push(`<button class="${ssrRenderClass([{
                      "filter-tag--active": activeSubGenres.value.has(
                        subGenre._id
                      )
                    }, "tag filter-tag filter-tag--subgenre"])}" data-v-dc907b59>${ssrInterpolate(subGenre.title)}</button>`);
                  });
                  _push(`<!--]--><!--]-->`);
                });
                _push(`<!--]--></div></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          } else if (contentType.value === "words") {
            _push(`<!--[-->`);
            if (poolTags.value.articles.length > 0) {
              _push(`<div class="${ssrRenderClass([{ active: showFilters.value }, "filter-category tags"])}" data-v-dc907b59><div class="filter-tags tags" data-v-dc907b59><!--[-->`);
              ssrRenderList(poolTags.value.articles, (tag) => {
                _push(`<button class="${ssrRenderClass([{
                  "filter-tag--active": activeFilters.value.has(tag._id)
                }, "filter-tag tag"])}" data-v-dc907b59>${ssrInterpolate(tag.title)}</button>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<!--[-->`);
            if (getContentTypeSpecificTags.value.length > 0) {
              _push(`<div class="${ssrRenderClass([{ active: showFilters.value }, "filter-category tags"])}" data-v-dc907b59><div class="filter-tags tags" data-v-dc907b59>`);
              if (poolTags.value.musicians.length > 0) {
                _push(`<button class="${ssrRenderClass([{
                  "filter-type--active": activeFilterType.value === "musicians"
                }, "filter-type tag"])}" data-v-dc907b59> Musicians </button>`);
              } else {
                _push(`<!---->`);
              }
              if (poolTags.value.venues.length > 0) {
                _push(`<button class="${ssrRenderClass([{
                  "filter-type--active": activeFilterType.value === "venues"
                }, "filter-type tag"])}" data-v-dc907b59> Venues </button>`);
              } else {
                _push(`<!---->`);
              }
              if (poolTags.value.crafts.length > 0) {
                _push(`<button class="${ssrRenderClass([{
                  "filter-type--active": activeFilterType.value === "crafts"
                }, "filter-type tag"])}" data-v-dc907b59> Crafts </button>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
              if (activeFilterType.value && ((_c = poolTags.value[activeFilterType.value]) == null ? void 0 : _c.length) > 0) {
                _push(`<div class="filter-tags tags" data-v-dc907b59><!--[-->`);
                ssrRenderList(poolTags.value[activeFilterType.value], (tag) => {
                  _push(`<button class="${ssrRenderClass([{
                    "filter-tag--active": activeFilters.value.has(tag._id)
                  }, "filter-tag tag"])}" data-v-dc907b59>${ssrInterpolate(tag.title)}</button>`);
                });
                _push(`<!--]--></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="content-grid__container" data-v-dc907b59>`);
        if (visibleItems.value.length > 0) {
          _push(`<div class="content-grid__items" data-v-dc907b59><!--[-->`);
          ssrRenderList(visibleItems.value, (item) => {
            var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
            _push(`<div class="${ssrRenderClass(`grid-item grid-item--${__props.module.style || "default"}`)}" data-v-dc907b59><div class="grid-item__tags city-tags" data-v-dc907b59><!--[-->`);
            ssrRenderList(getItemCityTags(item), (tag) => {
              _push(`<span class="tag city" data-v-dc907b59>${ssrInterpolate(("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.short))}</span>`);
            });
            _push(`<!--]--></div>`);
            if (item == null ? void 0 : item.slug) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: getItemRoute(item),
                class: "grid-item__link"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  var _a3, _b3, _c3, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n2;
                  if (_push2) {
                    _push2(`<div class="grid-item__image" data-v-dc907b59${_scopeId}>`);
                    if (contentType.value === "sets") {
                      _push2(`<!--[-->`);
                      if ((_a3 = item.image) == null ? void 0 : _a3.asset) {
                        _push2(`<img${ssrRenderAttr("src", item.image.asset.url)}${ssrRenderAttr("alt", item.title || "")} loading="lazy" data-v-dc907b59${_scopeId}>`);
                      } else if (item.soundcloud) {
                        _push2(`<div class="track-artwork" data-v-dc907b59${_scopeId}>`);
                        if (artworkUrls.value.get(item._id)) {
                          _push2(`<img${ssrRenderAttr("src", artworkUrls.value.get(item._id))} alt="Track Artwork" loading="lazy" data-v-dc907b59${_scopeId}>`);
                        } else {
                          _push2(`<!---->`);
                        }
                        _push2(`</div>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`<!--]-->`);
                    } else {
                      _push2(`<!--[-->`);
                      if (getItemImage(item)) {
                        _push2(`<img${ssrRenderAttr("src", (_b3 = getItemImage(item).asset) == null ? void 0 : _b3.url)}${ssrRenderAttr("alt", item.title || "")} loading="lazy" data-v-dc907b59${_scopeId}>`);
                      } else {
                        _push2(`<img${ssrRenderAttr(
                          "src",
                          (_g2 = (_f2 = (_e2 = (_d2 = (_c3 = unref(mainStore)) == null ? void 0 : _c3.siteFallbacks) == null ? void 0 : _d2.fallbackSet) == null ? void 0 : _e2.image) == null ? void 0 : _f2.asset) == null ? void 0 : _g2.url
                        )} alt="Fallback" loading="lazy" data-v-dc907b59${_scopeId}>`);
                      }
                      _push2(`<!--]-->`);
                    }
                    _push2(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "grid-item__image" }, [
                        contentType.value === "sets" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          ((_h2 = item.image) == null ? void 0 : _h2.asset) ? (openBlock(), createBlock("img", {
                            key: 0,
                            src: item.image.asset.url,
                            alt: item.title || "",
                            loading: "lazy"
                          }, null, 8, ["src", "alt"])) : item.soundcloud ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "track-artwork",
                            onVnodeMounted: ($event) => loadArtworkUrl(item)
                          }, [
                            artworkUrls.value.get(item._id) ? (openBlock(), createBlock("img", {
                              key: 0,
                              src: artworkUrls.value.get(item._id),
                              alt: "Track Artwork",
                              loading: "lazy"
                            }, null, 8, ["src"])) : createCommentVNode("", true)
                          ], 8, ["onVnodeMounted"])) : createCommentVNode("", true)
                        ], 64)) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                          getItemImage(item) ? (openBlock(), createBlock("img", {
                            key: 0,
                            src: (_i2 = getItemImage(item).asset) == null ? void 0 : _i2.url,
                            alt: item.title || "",
                            loading: "lazy"
                          }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("img", {
                            key: 1,
                            src: (_n2 = (_m2 = (_l2 = (_k2 = (_j2 = unref(mainStore)) == null ? void 0 : _j2.siteFallbacks) == null ? void 0 : _k2.fallbackSet) == null ? void 0 : _l2.image) == null ? void 0 : _m2.asset) == null ? void 0 : _n2.url,
                            alt: "Fallback",
                            loading: "lazy"
                          }, null, 8, ["src"]))
                        ], 64))
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="grid-item__content" data-v-dc907b59><section class="grid-item__content__interactive" data-v-dc907b59>`);
            if (item.datetime || item.publishedAt) {
              _push(`<div class="grid-item__date" data-v-dc907b59>${ssrInterpolate(formatDate(item.datetime || item.publishedAt))}</div>`);
            } else {
              _push(`<!---->`);
            }
            if (contentType.value === "sets" && item.soundcloud) {
              _push(`<button class="play-button" data-v-dc907b59><span class="sr-only" data-v-dc907b59>Play</span><svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-dc907b59><path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" data-v-dc907b59></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</section>`);
            if (item.parentShow && contentType.value === "sets") {
              _push(`<div data-v-dc907b59>`);
              if (((_b2 = (_a2 = item.parentShow) == null ? void 0 : _a2.title) == null ? void 0 : _b2.toLowerCase()) !== "no-show" && ((_c2 = item.parentShow) == null ? void 0 : _c2.slug)) {
                _push(ssrRenderComponent(_component_NuxtLink, {
                  to: unref(localePath)(`/shows/${(_d = item.parentShow) == null ? void 0 : _d.slug.current}`),
                  class: "grid-item__link"
                }, {
                  default: withCtx((_, _push2, _parent2, _scopeId) => {
                    var _a3, _b3;
                    if (_push2) {
                      _push2(`<h3 class="grid-item__title show-title" data-v-dc907b59${_scopeId}>${ssrInterpolate((_a3 = item.parentShow) == null ? void 0 : _a3.title)}</h3>`);
                    } else {
                      return [
                        createVNode("h3", { class: "grid-item__title show-title" }, toDisplayString((_b3 = item.parentShow) == null ? void 0 : _b3.title), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              } else if (item == null ? void 0 : item.title) {
                _push(`<h3 class="grid-item__title show-title" data-v-dc907b59>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`);
              } else {
                _push(`<!---->`);
              }
              if (((_e = item.persons) == null ? void 0 : _e.length) > 0) {
                _push(`<div class="show-artists" data-v-dc907b59><!--[-->`);
                ssrRenderList(item.persons, (artist, index) => {
                  var _a3;
                  _push(`<h3 class="grid-item__artist" data-v-dc907b59>`);
                  if (artist == null ? void 0 : artist.poolVisibility) {
                    _push(ssrRenderComponent(_component_NuxtLink, {
                      to: unref(localePath)(`/pool/${(_a3 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a3.current}`),
                      class: "grid-item__link"
                    }, {
                      default: withCtx((_, _push2, _parent2, _scopeId) => {
                        if (_push2) {
                          _push2(`${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")}  `);
                        } else {
                          return [
                            createTextVNode(toDisplayString(artist.title) + toDisplayString(index < item.persons.length - 1 ? "," : "") + "  ", 1)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent));
                  } else {
                    _push(`<span data-v-dc907b59>${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")} </span>`);
                  }
                  _push(`</h3>`);
                });
                _push(`<!--]--></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            if (contentType.value === "words") {
              _push(`<div class="tags read-more" data-v-dc907b59>`);
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: getItemRoute(item),
                class: "grid-item__link"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`<h3 class="tag" data-v-dc907b59${_scopeId}>Read More</h3>`);
                  } else {
                    return [
                      createVNode("h3", { class: "tag" }, "Read More")
                    ];
                  }
                }),
                _: 2
              }, _parent));
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "grid-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  if (contentType.value !== "sets") {
                    _push2(`<h3 class="grid-item__title" data-v-dc907b59${_scopeId}>${ssrInterpolate(item.title || item.name)}</h3>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    contentType.value !== "sets" ? (openBlock(), createBlock("h3", {
                      key: 0,
                      class: "grid-item__title"
                    }, toDisplayString(item.title || item.name), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }, _parent));
            if ((item == null ? void 0 : item.useTeaserText) && (item == null ? void 0 : item.textTeaser)) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.textTeaser)
              }, null, _parent));
            } else if (!(item == null ? void 0 : item.useTeaserText) && ((_f = item == null ? void 0 : item.text) == null ? void 0 : _f.length) > 0) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: (_g = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.text)) == null ? void 0 : _g.slice(0, 1)
              }, null, _parent));
            } else if (!(item == null ? void 0 : item.text) && ((_h = item == null ? void 0 : item.description) == null ? void 0 : _h.length) > 0 && (((_i = item.description[0]) == null ? void 0 : _i.value) || ((_j = item.description[1]) == null ? void 0 : _j.value))) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_k = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.description)) == null ? void 0 : _k.slice(0, 1),
                  100
                )
              }, null, _parent));
            } else if (!(item == null ? void 0 : item.text) && __props.module.poolContentType === "persons" && ((_o = (_n = (_m = (_l = unref(mainStore)) == null ? void 0 : _l.siteFallbacks) == null ? void 0 : _m.fallbackPerson) == null ? void 0 : _n.description) == null ? void 0 : _o.length) > 0) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_s = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(
                    (_r = (_q = (_p = unref(mainStore)) == null ? void 0 : _p.siteFallbacks) == null ? void 0 : _q.fallbackPerson) == null ? void 0 : _r.description
                  )) == null ? void 0 : _s.slice(0, 1),
                  100
                )
              }, null, _parent));
            } else if (!(item == null ? void 0 : item.text) && __props.module.poolContentType === "venues" && ((_w = (_v = (_u = (_t = unref(mainStore)) == null ? void 0 : _t.siteFallbacks) == null ? void 0 : _u.fallbackVenue) == null ? void 0 : _v.description) == null ? void 0 : _w.length) > 0) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_A = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(
                    (_z = (_y = (_x = unref(mainStore)) == null ? void 0 : _x.siteFallbacks) == null ? void 0 : _y.fallbackVenue) == null ? void 0 : _z.description
                  )) == null ? void 0 : _A.slice(0, 1),
                  100
                )
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            if (getItemNonCityTags(item).length > 0) {
              _push(`<div class="grid-item__tags tags" data-v-dc907b59><!--[-->`);
              ssrRenderList(getItemNonCityTags(item), (tag) => {
                _push(`<span class="tag" data-v-dc907b59>${ssrInterpolate(tag.title)}</span>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="content-grid__no-results" data-v-dc907b59><p data-v-dc907b59>No matching content.</p><div class="no-results-buttons" data-v-dc907b59>`);
          if (filterHistory.value.length > 0) {
            _push(`<button class="action-btn" data-v-dc907b59> Remove last filter </button>`);
          } else {
            _push(`<!---->`);
          }
          if (activeFilters.value.size > 0 || activeGenres.value.size > 0) {
            _push(`<button class="action-btn" data-v-dc907b59> Clear all filters </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        }
        if (hasMoreItems.value) {
          _push(`<div class="content-grid__load-more" data-v-dc907b59><button class="load-more-button" data-v-dc907b59><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-dc907b59><path d="M7.67578 0.541016V14.8113" stroke-width="5" data-v-dc907b59></path><path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" data-v-dc907b59></path></svg></button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});

const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleContentGrid.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$6, [["__scopeId", "data-v-dc907b59"]]), { __name: "ModuleContentGrid" });

const _sfc_main$5 = {
  __name: "AnimatedGradient",
  __ssrInlineRender: true,
  props: {
    color: {
      type: String,
      default: "var(--color-pink)"
    },
    type: {
      type: String,
      default: "set"
    }
  },
  setup(__props) {
    const props = __props;
    const gradientColor = computed(() => {
      switch (props.type) {
        case "sets":
          return "var(--color-pink)";
        case "venue":
          return "var(--color-blue";
        case "person":
          return "var(--color-blue";
        case "article":
          return "var(--color-green)";
        default:
          return props.color;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animated-gradient" }, _attrs))} data-v-ec7588bb><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" data-v-ec7588bb><defs data-v-ec7588bb><filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%" data-v-ec7588bb><feGaussianBlur in="SourceGraphic" stdDeviation="20" data-v-ec7588bb></feGaussianBlur></filter></defs><path id="blob" d="M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120" filter="url(#blurFilter)" opacity="0.85"${ssrRenderAttr("fill", unref(gradientColor))} data-v-ec7588bb><animate attributeName="d" dur="15s" repeatCount="indefinite" values="
               M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120;
               
               M180,110 C270,60 320,150 270,220 C220,290 130,270 90,200 C50,130 90,160 180,110;
               
               M210,90 C290,85 310,170 260,210 C210,250 140,230 110,170 C80,110 130,95 210,90;
               
               M190,140 C250,70 320,130 290,200 C260,270 150,280 100,220 C50,160 130,210 190,140;
               
               M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120" calcMode="spline" keySplines="0.4 0 0.6 1; 0.5 0.1 0.7 0.9; 0.3 0.2 0.5 0.8; 0.4 0 0.6 1" data-v-ec7588bb></animate></path></svg></div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/animated/AnimatedGradient.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-ec7588bb"]]);

const _sfc_main$4 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "svg-container" }, _attrs))} data-v-9f690e70><svg viewBox="-30 -30 1113 816" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" style="${ssrRenderStyle({ "stroke-miterlimit": "10" })}" data-v-9f690e70><path id="path" d="M987.783,2L365.557,2C330.413,2 301.909,30.485 301.909,65.629L301.909,189.037C301.909,224.181 273.416,252.666 238.261,252.666L65.648,252.666C30.493,252.666 2,281.151 2,316.295L2,439.703C2,474.847 30.493,503.333 65.648,503.333L110.965,503.333C146.12,503.333 174.613,531.818 174.613,566.962L174.613,690.37C174.613,725.514 203.106,753.999 238.261,753.999L987.783,754C1020.51,754 1047.05,727.475 1047.05,694.754L1047.05,562.591C1047.05,529.871 1020.51,503.345 987.783,503.345L900.423,503.345C872.281,503.345 849.475,480.534 849.475,452.412L849.475,443.566C849.475,408.422 820.982,379.937 785.827,379.937L367.924,379.936C332.77,379.936 304.276,351.451 304.276,316.306C304.276,281.162 332.748,252.654 367.902,252.654C367.902,252.654 987.783,252.655 987.783,252.655C1022.94,252.655 1051.43,224.17 1051.43,189.025L1051.43,65.629C1051.43,30.485 1022.94,2 987.783,2Z" data-v-9f690e70></path></svg></div>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/animated/AnimatedLogoBackground.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$1], ["__scopeId", "data-v-9f690e70"]]), { __name: "AnimatedLogoBackground" });

const _sfc_main$3 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "svg-container" }, _attrs))} data-v-85e87762><svg viewBox="-30 -30 1113 816" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" style="${ssrRenderStyle({ "stroke-miterlimit": "10" })}" data-v-85e87762><path id="path" d="M987.783,2L365.557,2C330.413,2 301.909,30.485 301.909,65.629L301.909,189.037C301.909,224.181 273.416,252.666 238.261,252.666L65.648,252.666C30.493,252.666 2,281.151 2,316.295L2,439.703C2,474.847 30.493,503.333 65.648,503.333L110.965,503.333C146.12,503.333 174.613,531.818 174.613,566.962L174.613,690.37C174.613,725.514 203.106,753.999 238.261,753.999L987.783,754C1020.51,754 1047.05,727.475 1047.05,694.754L1047.05,562.591C1047.05,529.871 1020.51,503.345 987.783,503.345L900.423,503.345C872.281,503.345 849.475,480.534 849.475,452.412L849.475,443.566C849.475,408.422 820.982,379.937 785.827,379.937L367.924,379.936C332.77,379.936 304.276,351.451 304.276,316.306C304.276,281.162 332.748,252.654 367.902,252.654C367.902,252.654 987.783,252.655 987.783,252.655C1022.94,252.655 1051.43,224.17 1051.43,189.025L1051.43,65.629C1051.43,30.485 1022.94,2 987.783,2Z" data-v-85e87762></path><path id="animated-path" d="M987.783,2L365.557,2C330.413,2 301.909,30.485 301.909,65.629L301.909,189.037C301.909,224.181 273.416,252.666 238.261,252.666L65.648,252.666C30.493,252.666 2,281.151 2,316.295L2,439.703C2,474.847 30.493,503.333 65.648,503.333L110.965,503.333C146.12,503.333 174.613,531.818 174.613,566.962L174.613,690.37C174.613,725.514 203.106,753.999 238.261,753.999L987.783,754C1020.51,754 1047.05,727.475 1047.05,694.754L1047.05,562.591C1047.05,529.871 1020.51,503.345 987.783,503.345L900.423,503.345C872.281,503.345 849.475,480.534 849.475,452.412L849.475,443.566C849.475,408.422 820.982,379.937 785.827,379.937L367.924,379.936C332.77,379.936 304.276,351.451 304.276,316.306C304.276,281.162 332.748,252.654 367.902,252.654C367.902,252.654 987.783,252.655 987.783,252.655C1022.94,252.655 1051.43,224.17 1051.43,189.025L1051.43,65.629C1051.43,30.485 1022.94,2 987.783,2Z" data-v-85e87762></path></svg></div>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/animated/AnimatedLogo.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_3$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-85e87762"]]), { __name: "AnimatedLogo" });

const formatDate = (dateObj) => {
  if (!dateObj) {
    console.warn("No date provided!");
    return;
  }
  const date = new Date(dateObj);
  if (isNaN(date.getTime())) {
    console.warn("Invalid date provided!");
    return;
  }
  const day = date.toLocaleString("default", { day: "2-digit" });
  const month = date.toLocaleString("default", { month: "2-digit" });
  const year = date.toLocaleString("default", { year: "numeric" });
  return `${day}.${month}.${year}`;
};

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ModuleHeroEntrySolo",
  __ssrInlineRender: true,
  props: {
    module: {}
  },
  setup(__props) {
    const localePath = useLocalePath();
    useRouter();
    const mainStore = useMainStore();
    const props = __props;
    function getItemRoute(item) {
      var _a, _b;
      if (!((_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current)) return "/";
      const { _type, slug, parentShow } = item;
      switch (_type) {
        case "person":
        case "venue":
          return localePath(`/pool/${slug.current}`);
        case "set":
          if ((_b = parentShow == null ? void 0 : parentShow.slug) == null ? void 0 : _b.current) {
            return localePath(`/shows/${parentShow.slug.current}/${slug.current}`);
          }
          return localePath(`/shows/${slug.current}`);
        case "article":
          return localePath(`/words/${slug.current}`);
        case "show":
          return localePath(`/shows/${slug.current}`);
        default:
          return localePath(`/${_type}/${slug.current}`);
      }
    }
    const useImageManagement = () => {
      function getItemImage2(item) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!item) return null;
        if (item.image || item.mainImage) {
          return (item.image || item.mainImage) ?? null;
        }
        const fallbacks = mainStore == null ? void 0 : mainStore.siteFallbacks;
        if (!fallbacks) return null;
        const fallbackMap = {
          person: (_a = fallbacks.fallbackPerson) == null ? void 0 : _a.image,
          venue: (_b = fallbacks.fallbackVenue) == null ? void 0 : _b.image,
          show: (_c = fallbacks.fallbackShow) == null ? void 0 : _c.image,
          set: (_d = fallbacks.fallbackSet) == null ? void 0 : _d.image,
          word: (_e = fallbacks.fallbackArticle) == null ? void 0 : _e.image,
          article: (_f = fallbacks.fallbackArticle) == null ? void 0 : _f.image
        };
        return fallbackMap[item._type || ""] || ((_g = fallbacks.fallbackPerson) == null ? void 0 : _g.image) || null;
      }
      function checkImageExists(url) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      }
      return {
        getItemImage: getItemImage2,
        checkImageExists
      };
    };
    const useSoundCloud = () => {
      const artworkUrl2 = ref("");
      function getSoundcloudArtwork(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        if (!item) return "";
        const track = (_b = (_a = item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0];
        const parentShowImageUrl = (_e = (_d = (_c = item.parentShow) == null ? void 0 : _c.image) == null ? void 0 : _d.asset) == null ? void 0 : _e.url;
        const fallbackUrl = (_i = (_h = (_g = (_f = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _f.fallbackSet) == null ? void 0 : _g.image) == null ? void 0 : _h.asset) == null ? void 0 : _i.url;
        if (track == null ? void 0 : track.artwork_url) {
          return track.artwork_url.replace("-large", "-t500x500");
        }
        return parentShowImageUrl || fallbackUrl || "";
      }
      function loadArtworkUrl2() {
        var _a;
        const contentRef = (_a = props.module) == null ? void 0 : _a.contentReference;
        if (!contentRef) return;
        const url = getSoundcloudArtwork(contentRef);
        artworkUrl2.value = url;
      }
      function playTrack2() {
        var _a, _b, _c, _d;
        const track = (_d = (_c = (_b = (_a = props.module) == null ? void 0 : _a.contentReference) == null ? void 0 : _b.soundcloud) == null ? void 0 : _c.tracks) == null ? void 0 : _d[0];
        if (!track) return;
        if (!track.permalink_url && track.id) {
          track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
        }
        mainStore.currentTrack = track;
      }
      return {
        artworkUrl: artworkUrl2,
        loadArtworkUrl: loadArtworkUrl2,
        playTrack: playTrack2
      };
    };
    const { getItemImage } = useImageManagement();
    const { artworkUrl, loadArtworkUrl } = useSoundCloud();
    const contentType = computed(() => {
      var _a, _b;
      return ((_b = (_a = props.module) == null ? void 0 : _a.contentReference) == null ? void 0 : _b._type) || null;
    });
    const layoutClass = computed(() => {
      return `layout-${contentType.value || "default"}`;
    });
    const isAudioContent = computed(() => {
      return contentType.value === "set";
    });
    const contentReference = computed(() => {
      var _a;
      return (_a = props.module) == null ? void 0 : _a.contentReference;
    });
    const hasParentShow = computed(() => {
      var _a;
      const parentShow = (_a = contentReference.value) == null ? void 0 : _a.parentShow;
      return parentShow && parentShow.title !== "No Show";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_MediaImage = __nuxt_component_2$1;
      const _component_AnimatedGradient = __nuxt_component_0;
      const _component_AnimatedLogoBackground = __nuxt_component_1;
      const _component_RichText = __nuxt_component_1$2;
      const _component_AnimatedLogo = __nuxt_component_3$1;
      if (_ctx.module) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: `module-hero-entry ${layoutClass.value}`
        }, _attrs))} data-v-a6ad70db><div class="hero-entry-container" data-v-a6ad70db><div class="hero-entry-media" data-v-a6ad70db>`);
        if ((_a = contentReference.value) == null ? void 0 : _a.slug) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: getItemRoute(contentReference.value),
            class: "slide__link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (unref(getItemImage)(contentReference.value) && !isAudioContent.value) {
                  _push2(ssrRenderComponent(_component_MediaImage, {
                    image: unref(getItemImage)(contentReference.value) || void 0,
                    class: "hero-entry-image"
                  }, null, _parent2, _scopeId));
                } else if (isAudioContent.value && unref(artworkUrl)) {
                  _push2(`<img${ssrRenderAttr("src", unref(artworkUrl))} alt="Audio Artwork" class="hero-entry-image track-artwork" loading="lazy" data-v-a6ad70db${_scopeId}>`);
                } else if (isAudioContent.value) {
                  _push2(`<div class="track-artwork-placeholder" data-v-a6ad70db${_scopeId}></div>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  unref(getItemImage)(contentReference.value) && !isAudioContent.value ? (openBlock(), createBlock(_component_MediaImage, {
                    key: 0,
                    image: unref(getItemImage)(contentReference.value) || void 0,
                    class: "hero-entry-image"
                  }, null, 8, ["image"])) : isAudioContent.value && unref(artworkUrl) ? (openBlock(), createBlock("img", {
                    key: 1,
                    src: unref(artworkUrl),
                    alt: "Audio Artwork",
                    class: "hero-entry-image track-artwork",
                    loading: "lazy"
                  }, null, 8, ["src"])) : isAudioContent.value ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "track-artwork-placeholder",
                    onVnodeMounted: unref(loadArtworkUrl)
                  }, null, 8, ["onVnodeMounted"])) : createCommentVNode("", true)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="graphics-behind" data-v-a6ad70db>`);
        _push(ssrRenderComponent(_component_AnimatedGradient, {
          class: "animated-gradient",
          type: contentType.value || void 0
        }, null, _parent));
        _push(ssrRenderComponent(_component_AnimatedLogoBackground, { class: "animated-logo-background" }, null, _parent));
        _push(`</div><div class="hero-entry-content" data-v-a6ad70db>`);
        if (isAudioContent.value) {
          _push(`<button class="play-button" aria-label="Play Audio" type="button" data-v-a6ad70db><svg width="16" height="18" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-a6ad70db><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="currentColor" data-v-a6ad70db></path></svg></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="hero-entry-content-container" data-v-a6ad70db><div class="hero-entry-header" data-v-a6ad70db><div class="hero-entry-meta" data-v-a6ad70db>`);
        if ((_b = contentReference.value) == null ? void 0 : _b.datetime) {
          _push(`<h3 class="hero-date" data-v-a6ad70db>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(contentReference.value.datetime))}</h3>`);
        } else if ((_c = contentReference.value) == null ? void 0 : _c._updatedAt) {
          _push(`<h3 class="hero-date" data-v-a6ad70db>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(contentReference.value._updatedAt))}</h3>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (((_d = contentReference.value) == null ? void 0 : _d._type) === "set") {
          _push(`<div class="hero-entry-title" data-v-a6ad70db>`);
          if (hasParentShow.value) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: unref(localePath)(
                `/shows/${(_f = (_e = contentReference.value.parentShow) == null ? void 0 : _e.slug) == null ? void 0 : _f.current}`
              )
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a2, _b2;
                if (_push2) {
                  _push2(`<h2 class="hero-entry-title" data-v-a6ad70db${_scopeId}>${ssrInterpolate((_a2 = contentReference.value.parentShow) == null ? void 0 : _a2.title)}</h2>`);
                } else {
                  return [
                    createVNode("h2", { class: "hero-entry-title" }, toDisplayString((_b2 = contentReference.value.parentShow) == null ? void 0 : _b2.title), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if ((_g = contentReference.value.persons) == null ? void 0 : _g.length) {
            _push(`<div class="hero-entry-show-artists" data-v-a6ad70db><!--[-->`);
            ssrRenderList(contentReference.value.persons, (artist, index) => {
              var _a2;
              _push(`<h3 class="hero-entry-show-artists-artist" data-v-a6ad70db>`);
              if ((artist == null ? void 0 : artist.poolVisibility) && ((_a2 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a2.current)) {
                _push(ssrRenderComponent(_component_NuxtLink, {
                  to: unref(localePath)(`/pool/${artist.slug.current}`),
                  class: "hero-entry-show-artists-artist"
                }, {
                  default: withCtx((_, _push2, _parent2, _scopeId) => {
                    if (_push2) {
                      _push2(`${ssrInterpolate(artist.title)}${ssrInterpolate(index < contentReference.value.persons.length - 1 ? "," : "")}  `);
                    } else {
                      return [
                        createTextVNode(toDisplayString(artist.title) + toDisplayString(index < contentReference.value.persons.length - 1 ? "," : "") + "  ", 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              } else {
                _push(`<span class="hero-entry-show-artists-artist" data-v-a6ad70db>${ssrInterpolate(artist == null ? void 0 : artist.title)}${ssrInterpolate(index < contentReference.value.persons.length - 1 ? "," : "")}  </span>`);
              }
              _push(`</h3>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (_ctx.module.title) {
          _push(`<h2 class="hero-entry-title" data-v-a6ad70db>${ssrInterpolate(_ctx.module.title)}</h2>`);
        } else if (((_h = contentReference.value) == null ? void 0 : _h.title) && contentReference.value._type !== "set") {
          _push(`<h2 class="hero-entry-title" data-v-a6ad70db>${ssrInterpolate(contentReference.value.title)}</h2>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (((_i = contentReference.value) == null ? void 0 : _i._type) !== "set") {
          _push(`<div class="hero-entry-text" data-v-a6ad70db>`);
          if (_ctx.module.text && _ctx.module.text.length > 0) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: _ctx.module.text,
              class: "module-text"
            }, null, _parent));
          } else {
            _push(`<!--[-->`);
            if ((_k = (_j = contentReference.value) == null ? void 0 : _j.description) == null ? void 0 : _k.length) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_l = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.description)) == null ? void 0 : _l.slice(0, 1)
                )
              }, null, _parent));
            } else if ((_n = (_m = contentReference.value) == null ? void 0 : _m.bio) == null ? void 0 : _n.length) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))((_o = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.bio)) == null ? void 0 : _o.slice(0, 1))
              }, null, _parent));
            } else if ((_q = (_p = contentReference.value) == null ? void 0 : _p.text) == null ? void 0 : _q.length) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_r = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.text)) == null ? void 0 : _r.slice(0, 1)
                )
              }, null, _parent));
            } else if ((_t = (_s = contentReference.value) == null ? void 0 : _s.textTeaser) == null ? void 0 : _t.length) {
              _push(ssrRenderComponent(_component_RichText, {
                blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                  (_u = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.textTeaser)) == null ? void 0 : _u.slice(0, 1)
                )
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_w = (_v = contentReference.value) == null ? void 0 : _v.tags) == null ? void 0 : _w.length) {
          _push(`<div class="hero-entry-tags tags" data-v-a6ad70db><!--[-->`);
          ssrRenderList(contentReference.value.tags.slice(0, 3), (tag, tagIndex) => {
            var _a2, _b2, _c2;
            _push(`<button class="tag clickable" type="button" data-v-a6ad70db>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="graphics-front" data-v-a6ad70db>`);
        _push(ssrRenderComponent(_component_AnimatedLogo, { class: "animated-logo" }, null, _parent));
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleHeroEntrySolo.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-a6ad70db"]]), { __name: "ModuleHeroEntrySolo" });

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ModuleHeroEntry",
  __ssrInlineRender: true,
  props: {
    module: {}
  },
  setup(__props) {
    const localePath = useLocalePath();
    useRouter();
    const mainStore = useMainStore();
    const props = __props;
    function getItemRoute(item) {
      var _a, _b;
      if (!((_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current)) return "/";
      const { _type, slug, parentShow } = item;
      switch (_type) {
        case "person":
        case "venue":
          return localePath(`/pool/${slug.current}`);
        case "set":
          if ((_b = parentShow == null ? void 0 : parentShow.slug) == null ? void 0 : _b.current) {
            return localePath(`/shows/${parentShow.slug.current}/${slug.current}`);
          }
          return localePath(`/shows/${slug.current}`);
        case "article":
          return localePath(`/words/${slug.current}`);
        case "show":
          return localePath(`/shows/${slug.current}`);
        default:
          return localePath(`/${_type}/${slug.current}`);
      }
    }
    const useImageManagement = () => {
      function getItemImage2(item) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!item) return null;
        if (item.image || item.mainImage) {
          return (item.image || item.mainImage) ?? null;
        }
        const fallbacks = mainStore == null ? void 0 : mainStore.siteFallbacks;
        if (!fallbacks) return null;
        const fallbackMap = {
          person: (_a = fallbacks.fallbackPerson) == null ? void 0 : _a.image,
          venue: (_b = fallbacks.fallbackVenue) == null ? void 0 : _b.image,
          show: (_c = fallbacks.fallbackShow) == null ? void 0 : _c.image,
          set: (_d = fallbacks.fallbackSet) == null ? void 0 : _d.image,
          word: (_e = fallbacks.fallbackArticle) == null ? void 0 : _e.image,
          article: (_f = fallbacks.fallbackArticle) == null ? void 0 : _f.image
        };
        return fallbackMap[item._type || ""] || ((_g = fallbacks.fallbackPerson) == null ? void 0 : _g.image) || null;
      }
      function checkImageExists(url) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      }
      return {
        getItemImage: getItemImage2,
        checkImageExists
      };
    };
    const useSoundCloud = () => {
      const artworkUrl2 = ref("");
      function getSoundcloudArtwork(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        if (!item) return "";
        const track = (_b = (_a = item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0];
        const parentShowImageUrl = (_e = (_d = (_c = item.parentShow) == null ? void 0 : _c.image) == null ? void 0 : _d.asset) == null ? void 0 : _e.url;
        const fallbackUrl = (_i = (_h = (_g = (_f = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _f.fallbackSet) == null ? void 0 : _g.image) == null ? void 0 : _h.asset) == null ? void 0 : _i.url;
        if (track == null ? void 0 : track.artwork_url) {
          return track.artwork_url.replace("-large", "-t500x500");
        }
        return parentShowImageUrl || fallbackUrl || "";
      }
      function loadArtworkUrl2() {
        var _a;
        const contentRef = (_a = props.module) == null ? void 0 : _a.contentReference;
        if (!contentRef) return;
        const url = getSoundcloudArtwork(contentRef);
        artworkUrl2.value = url;
      }
      function playTrack2() {
        var _a, _b, _c, _d;
        const track = (_d = (_c = (_b = (_a = props.module) == null ? void 0 : _a.contentReference) == null ? void 0 : _b.soundcloud) == null ? void 0 : _c.tracks) == null ? void 0 : _d[0];
        if (!track) return;
        if (!track.permalink_url && track.id) {
          track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
        }
        mainStore.currentTrack = track;
      }
      return {
        artworkUrl: artworkUrl2,
        loadArtworkUrl: loadArtworkUrl2,
        playTrack: playTrack2
      };
    };
    const { getItemImage } = useImageManagement();
    const { artworkUrl, loadArtworkUrl } = useSoundCloud();
    const contentType = computed(() => {
      var _a, _b;
      return ((_b = (_a = props.module) == null ? void 0 : _a.contentReference) == null ? void 0 : _b._type) || null;
    });
    const layoutClass = computed(() => {
      return `layout-${contentType.value || "default"}`;
    });
    const isAudioContent = computed(() => {
      return contentType.value === "set";
    });
    const contentReference = computed(() => {
      var _a;
      return (_a = props.module) == null ? void 0 : _a.contentReference;
    });
    const hasParentShow = computed(() => {
      var _a;
      const parentShow = (_a = contentReference.value) == null ? void 0 : _a.parentShow;
      return parentShow && parentShow.title !== "No Show";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_MediaImage = __nuxt_component_2$1;
      const _component_RichText = __nuxt_component_1$2;
      if (_ctx.module) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: `module-hero-entry ${layoutClass.value}`
        }, _attrs))} data-v-4eb3d14a><div class="hero-entry-container" data-v-4eb3d14a><div class="hero-entry-media" data-v-4eb3d14a>`);
        if ((_a = contentReference.value) == null ? void 0 : _a.slug) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: getItemRoute(contentReference.value),
            class: "slide__link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (unref(getItemImage)(contentReference.value) && !isAudioContent.value) {
                  _push2(ssrRenderComponent(_component_MediaImage, {
                    image: unref(getItemImage)(contentReference.value) || void 0,
                    class: "hero-entry-image"
                  }, null, _parent2, _scopeId));
                } else if (isAudioContent.value && unref(artworkUrl)) {
                  _push2(`<img${ssrRenderAttr("src", unref(artworkUrl))} alt="Audio Artwork" class="hero-entry-image track-artwork" loading="lazy" data-v-4eb3d14a${_scopeId}>`);
                } else if (isAudioContent.value) {
                  _push2(`<div class="track-artwork-placeholder" data-v-4eb3d14a${_scopeId}></div>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  unref(getItemImage)(contentReference.value) && !isAudioContent.value ? (openBlock(), createBlock(_component_MediaImage, {
                    key: 0,
                    image: unref(getItemImage)(contentReference.value) || void 0,
                    class: "hero-entry-image"
                  }, null, 8, ["image"])) : isAudioContent.value && unref(artworkUrl) ? (openBlock(), createBlock("img", {
                    key: 1,
                    src: unref(artworkUrl),
                    alt: "Audio Artwork",
                    class: "hero-entry-image track-artwork",
                    loading: "lazy"
                  }, null, 8, ["src"])) : isAudioContent.value ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "track-artwork-placeholder",
                    onVnodeMounted: unref(loadArtworkUrl)
                  }, null, 8, ["onVnodeMounted"])) : createCommentVNode("", true)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="hero-entry-content" data-v-4eb3d14a>`);
        if (isAudioContent.value) {
          _push(`<button class="play-button" aria-label="Play Audio" type="button" data-v-4eb3d14a><svg width="16" height="18" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-4eb3d14a><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="currentColor" data-v-4eb3d14a></path></svg></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="hero-entry-content-container" data-v-4eb3d14a><div class="hero-entry-header" data-v-4eb3d14a><div class="hero-entry-meta" data-v-4eb3d14a>`);
        if ((_b = contentReference.value) == null ? void 0 : _b.datetime) {
          _push(`<h3 class="hero-date" data-v-4eb3d14a>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(contentReference.value.datetime))}</h3>`);
        } else if ((_c = contentReference.value) == null ? void 0 : _c._updatedAt) {
          _push(`<h3 class="hero-date" data-v-4eb3d14a>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(contentReference.value._updatedAt))}</h3>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (((_d = contentReference.value) == null ? void 0 : _d._type) === "set") {
          _push(`<div class="hero-entry-title" data-v-4eb3d14a>`);
          if (hasParentShow.value) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: unref(localePath)(
                `/shows/${(_f = (_e = contentReference.value.parentShow) == null ? void 0 : _e.slug) == null ? void 0 : _f.current}`
              )
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a2, _b2;
                if (_push2) {
                  _push2(`<h2 class="hero-entry-title" data-v-4eb3d14a${_scopeId}>${ssrInterpolate((_a2 = contentReference.value.parentShow) == null ? void 0 : _a2.title)}</h2>`);
                } else {
                  return [
                    createVNode("h2", { class: "hero-entry-title" }, toDisplayString((_b2 = contentReference.value.parentShow) == null ? void 0 : _b2.title), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if ((_g = contentReference.value.persons) == null ? void 0 : _g.length) {
            _push(`<div class="hero-entry-show-artists" data-v-4eb3d14a><!--[-->`);
            ssrRenderList(contentReference.value.persons, (artist, index) => {
              var _a2;
              _push(`<h3 class="hero-entry-show-artists-artist" data-v-4eb3d14a>`);
              if ((artist == null ? void 0 : artist.poolVisibility) && ((_a2 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a2.current)) {
                _push(ssrRenderComponent(_component_NuxtLink, {
                  to: unref(localePath)(`/pool/${artist.slug.current}`),
                  class: "hero-entry-show-artists-artist"
                }, {
                  default: withCtx((_, _push2, _parent2, _scopeId) => {
                    if (_push2) {
                      _push2(`${ssrInterpolate(artist.title)}${ssrInterpolate(index < contentReference.value.persons.length - 1 ? "," : "")}  `);
                    } else {
                      return [
                        createTextVNode(toDisplayString(artist.title) + toDisplayString(index < contentReference.value.persons.length - 1 ? "," : "") + "  ", 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              } else {
                _push(`<span class="hero-entry-show-artists-artist" data-v-4eb3d14a>${ssrInterpolate(artist == null ? void 0 : artist.title)}${ssrInterpolate(index < contentReference.value.persons.length - 1 ? "," : "")}  </span>`);
              }
              _push(`</h3>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (_ctx.module.title) {
          _push(`<h2 class="hero-entry-title" data-v-4eb3d14a>${ssrInterpolate(_ctx.module.title)}</h2>`);
        } else if (((_h = contentReference.value) == null ? void 0 : _h.title) && contentReference.value._type !== "set") {
          _push(`<h2 class="hero-entry-title" data-v-4eb3d14a>${ssrInterpolate(contentReference.value.title)}</h2>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (((_i = contentReference.value) == null ? void 0 : _i._type) !== "set") {
          _push(`<div class="hero-entry-text" data-v-4eb3d14a>`);
          if ((_k = (_j = contentReference.value) == null ? void 0 : _j.description) == null ? void 0 : _k.length) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_l = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.description)) == null ? void 0 : _l.slice(0, 1)
              )
            }, null, _parent));
          } else if ((_n = (_m = contentReference.value) == null ? void 0 : _m.bio) == null ? void 0 : _n.length) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))((_o = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.bio)) == null ? void 0 : _o.slice(0, 1))
            }, null, _parent));
          } else if ((_q = (_p = contentReference.value) == null ? void 0 : _p.text) == null ? void 0 : _q.length) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_r = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.text)) == null ? void 0 : _r.slice(0, 1)
              )
            }, null, _parent));
          } else if ((_t = (_s = contentReference.value) == null ? void 0 : _s.textTeaser) == null ? void 0 : _t.length) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_u = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(contentReference.value.textTeaser)) == null ? void 0 : _u.slice(0, 1)
              )
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_w = (_v = contentReference.value) == null ? void 0 : _v.tags) == null ? void 0 : _w.length) {
          _push(`<div class="hero-entry-tags tags" data-v-4eb3d14a><!--[-->`);
          ssrRenderList(contentReference.value.tags.slice(0, 3), (tag, tagIndex) => {
            var _a2, _b2, _c2;
            _push(`<button class="tag clickable" type="button" data-v-4eb3d14a>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleHeroEntry.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-4eb3d14a"]]), { __name: "ModuleHeroEntry" });

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ModuleHeroSlider",
  __ssrInlineRender: true,
  props: {
    module: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const mainStore = useMainStore();
    const props = __props;
    const currentIndex = ref(0);
    const sliderRef = ref(null);
    const slides = computed(() => {
      var _a;
      return ((_a = props.module) == null ? void 0 : _a.slides) || [];
    });
    const scrollNext = () => {
      if (slides.value.length === 0) return;
      currentIndex.value = (currentIndex.value + 1) % slides.value.length;
    };
    const scrollPrev = () => {
      if (slides.value.length === 0) return;
      currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length;
    };
    useSwipe(sliderRef, {
      onSwipeEnd(e, direction2) {
        if (direction2 === "left") scrollNext();
        if (direction2 === "right") scrollPrev();
      }
    });
    const updateCurrentContentType = () => {
      var _a;
      if (!slides.value || slides.value.length === 0 || currentIndex.value >= slides.value.length)
        return;
      const currentSlide = slides.value[currentIndex.value];
      const contentType = ((_a = currentSlide == null ? void 0 : currentSlide.contentReference) == null ? void 0 : _a._type) || "";
      mainStore.setCurrentHeroContentType(contentType);
    };
    watch(currentIndex, () => {
      updateCurrentContentType();
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_AnimatedGradient = __nuxt_component_0;
      const _component_AnimatedLogoBackground = __nuxt_component_1;
      const _component_ModuleHeroEntry = __nuxt_component_2;
      const _component_AnimatedLogo = __nuxt_component_3$1;
      if (__props.module && slides.value.length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: `module-hero module-hero--${__props.module.style || "default"} ${unref(mainStore).currentHeroContentType}`
        }, _attrs))} data-v-e3a835e7>`);
        if (__props.module.title) {
          _push(`<div class="module-hero__header" data-v-e3a835e7><h3 class="module-hero__title" data-v-e3a835e7>${ssrInterpolate(__props.module.title)}</h3></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="slider__nav__container" data-v-e3a835e7><nav class="slider__nav" data-v-e3a835e7>`);
        if (slides.value.length > 1) {
          _push(`<div class="slider__nav__arrows" data-v-e3a835e7><button class="slider__arrow slider__arrow--prev" aria-label="Vorheriger Slide" data-v-e3a835e7><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-e3a835e7><path d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z" fill="black" data-v-e3a835e7></path></svg></button><div class="slider__nav__dots" data-v-e3a835e7><!--[-->`);
          ssrRenderList(slides.value, (_, index) => {
            _push(`<button class="${ssrRenderClass(["slider__dot", { "is-selected": index === currentIndex.value }])}" data-v-e3a835e7></button>`);
          });
          _push(`<!--]--></div><button class="slider__arrow slider__arrow--next" aria-label="Nächster Slide" data-v-e3a835e7><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-e3a835e7><path d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z" fill="black" data-v-e3a835e7></path></svg></button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</nav></div><div class="${ssrRenderClass([(_a = unref(mainStore)) == null ? void 0 : _a.currentHeroContentType, "graphics-behind"])}" data-v-e3a835e7>`);
        _push(ssrRenderComponent(_component_AnimatedGradient, {
          class: "animated-gradient",
          type: (_b = unref(mainStore)) == null ? void 0 : _b.currentHeroContentType
        }, null, _parent));
        _push(ssrRenderComponent(_component_AnimatedLogoBackground, { class: "animated-logo-background" }, null, _parent));
        _push(`</div><div class="slider-content" data-v-e3a835e7><!--[-->`);
        ssrRenderList(slides.value, (slide, index) => {
          _push(`<div class="${ssrRenderClass([{ active: index === currentIndex.value }, "slide"])}" data-v-e3a835e7>`);
          _push(ssrRenderComponent(_component_ModuleHeroEntry, {
            module: slide,
            class: `slider-item slider-item--${__props.module.style || slide.layout || "default"}`
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div><div class="graphics-front" data-v-e3a835e7>`);
        _push(ssrRenderComponent(_component_AnimatedLogo, { class: "animated-logo" }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleHeroSlider.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-e3a835e7"]]), { __name: "ModuleHeroSlider" });

export { ARTICLE_COUNT_QUERY as A, POOL_COUNT_QUERY as P, SHOW_COUNT_QUERY as S, __nuxt_component_1$1 as _, __nuxt_component_3 as a, __nuxt_component_4 as b, ARTICLE_LIST_QUERY as c, SHOW_LIST_QUERY as d, POOL_LIST_QUERY as e, formatDate as f, SET_COUNT_QUERY as g, SET_LIST_QUERY as h, limitTextBlocks as l };
