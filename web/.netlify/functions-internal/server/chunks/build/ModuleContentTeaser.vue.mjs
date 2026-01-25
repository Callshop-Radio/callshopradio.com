import { e as useI18n, f as useLocalePath, p as useRouter, u as useMainStore, q as useAsyncData, i as __nuxt_component_0, h as __nuxt_component_2, d as __nuxt_component_1, n as useSanity, _ as _export_sfc } from './server.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { l as limitTextBlocks, A as ARTICLE_COUNT_QUERY, c as ARTICLE_LIST_QUERY, S as SHOW_COUNT_QUERY, d as SHOW_LIST_QUERY, P as POOL_COUNT_QUERY, e as POOL_LIST_QUERY, g as SET_COUNT_QUERY, h as SET_LIST_QUERY } from './ModuleHeroSlider.vue.mjs';
import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createVNode, toDisplayString, createBlock, openBlock, createCommentVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';

const SELF_LOAD_PER_PAGE = 50;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ModuleContentTeaser",
  __ssrInlineRender: true,
  props: {
    module: {
      type: Object,
      required: true
    }
  },
  async setup(__props) {
    let __temp, __restore;
    const { locale } = useI18n();
    const localePath = useLocalePath();
    useRouter();
    const mainStore = useMainStore();
    const props = __props;
    const needsSelfLoad = computed(() => {
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
    ref(false);
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
      let params = { start, end };
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
        `module-content-teaser-${((_a = props.module) == null ? void 0 : _a._key) || ((_b = props.module) == null ? void 0 : _b.type)}-${((_c = props.module) == null ? void 0 : _c.poolContentType) || "default"}`,
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
            console.error("[ModuleContentTeaser] SSR Data Fetch Error:", error);
            return [];
          }
        },
        {
          default: () => [],
          lazy: false
        }
      );
    }), __temp = await __temp, __restore(), __temp);
    const itemsPerPage = computed(() => props.module.type === "words" ? 2 : 3);
    const visibleItemCount = ref(itemsPerPage.value);
    const loadMoreClickCount = ref(0);
    const sortMode = ref("new");
    const shuffleSeed = ref(Date.now());
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
    const artworkUrls = ref(/* @__PURE__ */ new Map());
    const hasMoreItems = computed(() => {
      return sortedItems.value && sortedItems.value.length > visibleItemCount.value;
    });
    const shouldShowMoreButton = computed(() => {
      return loadMoreClickCount.value >= 2 && hasMoreItems.value;
    });
    const allItems = computed(() => {
      if (!props.module) return [];
      if (needsSelfLoad.value) {
        return selfLoadedItems.value;
      }
      switch (props.module.type) {
        case "pool":
          let poolItems = props.module.poolItems || [];
          if (props.module.poolContentType) {
            if (props.module.poolContentType === "persons") {
              poolItems = poolItems.filter((item) => item._type === "person");
            } else if (props.module.poolContentType === "venues") {
              poolItems = poolItems.filter((item) => item._type === "venue");
            } else if (props.module.poolContentType === "all") {
              poolItems = poolItems.filter(
                (item) => item._type === "venue" || item._type === "person"
              );
            }
          }
          return poolItems;
        case "sets":
          return props.module.setItems || [];
        case "shows":
          return props.module.showItems || [];
        case "words":
          return props.module.articleItems || [];
        default:
          return [];
      }
    });
    const sortedItems = computed(() => {
      if (!allItems.value || allItems.value.length === 0) return [];
      let sortedArray = [...allItems.value];
      if (sortMode.value === "new") {
        return sortedArray.sort((a, b) => {
          const dateA = new Date(a.datetime || a._updatedAt || a._createdAt || 0);
          const dateB = new Date(b.datetime || b._updatedAt || b._createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      } else if (sortMode.value === "shuffle") {
        return shuffleArray([...sortedArray], shuffleSeed.value);
      } else if (sortMode.value === "alpha") {
        return sortedArray.sort((a, b) => {
          var _a, _b;
          const titleA = (a.title || a.name || (a.parentShow ? (_a = a.parentShow) == null ? void 0 : _a.title : "")).toLowerCase();
          const titleB = (b.title || b.name || (b.parentShow ? (_b = b.parentShow) == null ? void 0 : _b.title : "")).toLowerCase();
          return titleA.localeCompare(titleB);
        });
      }
      return sortedArray;
    });
    const visibleItems = computed(() => {
      return sortedItems.value.slice(0, visibleItemCount.value);
    });
    const contentType = computed(() => {
      if (!props.module) return null;
      let type = props.module.type || null;
      if (type === "pool" && props.module.poolContentType) {
        return props.module.poolContentType;
      }
      return type;
    });
    const categoryType = ref("");
    watch(
      contentType,
      (newValue) => {
        if (["persons", "venues", "all"].includes(newValue)) {
          categoryType.value = "Pool";
        } else if (newValue === "sets") {
          categoryType.value = "Episodes";
        } else if (newValue === "shows") {
          categoryType.value = "Shows";
        } else if (newValue === "words") {
          categoryType.value = "Words";
        } else {
          categoryType.value = "";
        }
      },
      { immediate: true }
    );
    const typeClassMap = {
      sets: "sets",
      shows: "shows",
      words: "words",
      persons: "pool",
      venues: "pool",
      pool: "pool",
      article: "words",
      primary: "sets",
      secondary: "shows",
      accent: "pool",
      blue: "pool",
      green: "words",
      yellow: "sets"
    };
    const typeClass = computed(() => {
      return typeClassMap[props.module.type] || "default";
    });
    function getItemImage(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      const itemType = item._type || "";
      if (item.image) {
        return item.image;
      }
      if (item.mainImage) {
        return item.mainImage;
      }
      switch (itemType) {
        case "person":
          return (_b = (_a = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _a.fallbackPerson) == null ? void 0 : _b.image;
        case "venue":
          return (_d = (_c = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _c.fallbackVenue) == null ? void 0 : _d.image;
        case "show":
          return (_f = (_e = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _e.fallbackShow) == null ? void 0 : _f.image;
        case "set":
          return (_h = (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _g.fallbackSet) == null ? void 0 : _h.image;
        case "word":
        case "article":
          return (_j = (_i = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _i.fallbackArticle) == null ? void 0 : _j.image;
        default:
          return (_l = (_k = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _k.fallbackPerson) == null ? void 0 : _l.image;
      }
    }
    function getItemRoute(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      if (!item || !(item == null ? void 0 : item.slug)) return "/";
      switch (item == null ? void 0 : item._type) {
        case "person":
        case "venue":
          return localePath(`/pool/${(_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current}`);
        case "set":
          if ((_c = (_b = item == null ? void 0 : item.parentShow) == null ? void 0 : _b.slug) == null ? void 0 : _c.current) {
            return localePath(
              `/shows/${(_e = (_d = item.parentShow) == null ? void 0 : _d.slug) == null ? void 0 : _e.current}/${(_f = item == null ? void 0 : item.slug) == null ? void 0 : _f.current}`
            );
          }
          console.log(`No parent show found for item ${(_g = item == null ? void 0 : item.slug) == null ? void 0 : _g.current}`);
          return localePath(`/shows/${(_h = item == null ? void 0 : item.slug) == null ? void 0 : _h.current}`);
        case "article":
          return localePath(`/words/${(_i = item == null ? void 0 : item.slug) == null ? void 0 : _i.current}`);
        case "show":
          return localePath(`/shows/${(_j = item == null ? void 0 : item.slug) == null ? void 0 : _j.current}`);
        // Standard-Fallback
        default:
          return localePath(`/${item == null ? void 0 : item._type}/${(_k = item == null ? void 0 : item.slug) == null ? void 0 : _k.current}`);
      }
    }
    function loadArtworkUrl(item) {
      if (!item) return;
      const url = getSoundcloudArtwork(item);
      artworkUrls.value.set(item._id, url);
    }
    function getSoundcloudArtwork(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const artworkUrl = (_c = (_b = (_a = item == null ? void 0 : item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0]) == null ? void 0 : _c.artwork_url;
      if (artworkUrl) {
        return artworkUrl.replace("-large", "-t500x500");
      }
      const parentShowImageUrl = (_f = (_e = (_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.image) == null ? void 0 : _e.asset) == null ? void 0 : _f.url;
      const storeFallbackUrl = (_j = (_i = (_h = (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _g.fallbackSet) == null ? void 0 : _h.image) == null ? void 0 : _i.asset) == null ? void 0 : _j.url;
      return parentShowImageUrl || storeFallbackUrl || "";
    }
    function getItemCityTags(item) {
      var _a, _b, _c;
      const cityTags = [];
      if ((item == null ? void 0 : item.tags) && Array.isArray(item == null ? void 0 : item.tags)) {
        item == null ? void 0 : item.tags.forEach((tag) => {
          if (tag._type === "tag.city") {
            cityTags.push(tag);
          }
        });
      }
      if (((_a = item == null ? void 0 : item.parentShow) == null ? void 0 : _a.tags) && Array.isArray((_b = item == null ? void 0 : item.parentShow) == null ? void 0 : _b.tags)) {
        (_c = item == null ? void 0 : item.parentShow) == null ? void 0 : _c.tags.forEach((tag) => {
          if (tag._type === "tag.city") {
            if (!cityTags.some((existingTag) => existingTag._id === tag._id)) {
              cityTags.push(tag);
            }
          }
        });
      }
      return cityTags;
    }
    function getItemNonCityTags(item) {
      if (!(item == null ? void 0 : item.tags) || !Array.isArray(item == null ? void 0 : item.tags)) return [];
      return item == null ? void 0 : item.tags.filter((tag) => tag._type !== "tag.city");
    }
    function getRichTextBlocks(content) {
      if (!content) return [];
      return Array.isArray(content) ? content : [];
    }
    function getRichTextBlocksSliced(content, slice = 1) {
      if (!content) return [];
      return Array.isArray(content) ? content.slice(0, slice) : [];
    }
    function shuffleArray(array, seed) {
      const rng = seededRandom(seed);
      let currentIndex = array.length;
      while (currentIndex > 0) {
        const randomIndex = Math.floor(rng() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex],
          array[currentIndex]
        ];
      }
      return array;
    }
    function seededRandom(seed) {
      return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    }
    watch(
      visibleItems,
      (newItems) => {
        if (props.module.type === "sets") {
          newItems.forEach((item) => {
            if (!artworkUrls.value.has(item == null ? void 0 : item._id)) {
              loadArtworkUrl(item);
            }
          });
        }
      },
      { deep: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_MediaImage = __nuxt_component_2;
      const _component_RichText = __nuxt_component_1;
      if (allItems.value && allItems.value.length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: `content-teaser module-teaser module-teaser--${props.module.style || "default"} ${typeClass.value}`
        }, _attrs))} data-v-d6246f8b><div class="module-teaser__header" data-v-d6246f8b>`);
        if ((_a = props.module) == null ? void 0 : _a.title) {
          _push(`<h3 class="content-teaser__title" data-v-d6246f8b>${ssrInterpolate((_b = props.module) == null ? void 0 : _b.title)}</h3>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="module-teaser__header__type" data-v-d6246f8b><div class="content-teaser__sort" data-v-d6246f8b><div class="sort-options" data-v-d6246f8b><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "new" }])}" data-v-d6246f8b><div class="dot" data-v-d6246f8b></div> New </button><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "alpha" }])}" data-v-d6246f8b><div class="dot" data-v-d6246f8b></div> A–Z </button><button class="${ssrRenderClass(["sort-button", { active: sortMode.value === "shuffle" }])}" data-v-d6246f8b><div class="dot" data-v-d6246f8b></div> Shuffle </button></div></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: categoryType.value === "Episodes" ? unref(localePath)("/shows") : unref(localePath)(categoryType.value.toLowerCase())
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="module-teaser__header__type__pill" data-v-d6246f8b${_scopeId}>${ssrInterpolate(categoryType.value === "Episodes" ? "Shows" : categoryType.value)}</h2>`);
            } else {
              return [
                createVNode("h2", { class: "module-teaser__header__type__pill" }, toDisplayString(categoryType.value === "Episodes" ? "Shows" : categoryType.value), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</section></div><div class="content-teaser__grid" data-v-d6246f8b><!--[-->`);
        ssrRenderList(visibleItems.value, (item) => {
          var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U;
          _push(`<div class="${ssrRenderClass(`teaser-item teaser-item--${props.module.style || "default"} ${typeClass.value}`)}" data-v-d6246f8b>`);
          if (props.module.showTags && getItemCityTags(item).length > 0 && props.module.style !== "image") {
            _push(`<div class="teaser-item__tags city-tags" data-v-d6246f8b><!--[-->`);
            ssrRenderList(getItemCityTags(item), (tag) => {
              var _a3, _b3, _c2, _d2;
              _push(`<button class="tag city clickable" data-v-d6246f8b>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.short) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.short) : ((_d2 = (_c2 = tag == null ? void 0 : tag.short) == null ? void 0 : _c2[0]) == null ? void 0 : _d2.value) ?? tag.short)}</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (item == null ? void 0 : item.slug) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "teaser-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a3, _b3, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n2, _o2, _p2, _q2, _r2, _s2, _t2, _u2, _v2, _w2, _x2, _y2, _z2, _A2, _B2, _C2, _D2, _E2, _F2, _G2, _H2, _I2, _J2, _K2, _L2, _M2, _N2;
                if (_push2) {
                  if (props.module.type === "sets") {
                    _push2(`<div class="teaser-item__image" data-v-d6246f8b${_scopeId}>`);
                    if ((item == null ? void 0 : item.image) && (item == null ? void 0 : item.image.asset) && (item == null ? void 0 : item.image.asset.url)) {
                      _push2(`<img${ssrRenderAttr("src", item == null ? void 0 : item.image.asset.url)}${ssrRenderAttr("alt", (item == null ? void 0 : item.title) || "")} loading="lazy" data-v-d6246f8b${_scopeId}>`);
                    } else if (item == null ? void 0 : item.soundcloud) {
                      _push2(`<div class="track-artwork" data-v-d6246f8b${_scopeId}>`);
                      if (artworkUrls.value.get(item == null ? void 0 : item._id)) {
                        _push2(`<img${ssrRenderAttr("src", artworkUrls.value.get(item == null ? void 0 : item._id))} alt="Track Artwork" class="track-image" data-v-d6246f8b${_scopeId}>`);
                      } else {
                        _push2(`<div class="track-artwork-placeholder" data-v-d6246f8b${_scopeId}></div>`);
                      }
                      _push2(`</div>`);
                    } else {
                      _push2(`<div class="image-placeholder" data-v-d6246f8b${_scopeId}>`);
                      if ((_e2 = (_d2 = (_c2 = (_b3 = (_a3 = unref(mainStore)) == null ? void 0 : _a3.siteFallbacks) == null ? void 0 : _b3.fallbackSet) == null ? void 0 : _c2.image) == null ? void 0 : _d2.asset) == null ? void 0 : _e2.url) {
                        _push2(`<img${ssrRenderAttr("src", (_j2 = (_i2 = (_h2 = (_g2 = (_f2 = unref(mainStore)) == null ? void 0 : _f2.siteFallbacks) == null ? void 0 : _g2.fallbackSet) == null ? void 0 : _h2.image) == null ? void 0 : _i2.asset) == null ? void 0 : _j2.url)} alt="Fallback Image" class="fallback-image" data-v-d6246f8b${_scopeId}>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div>`);
                    }
                    _push2(`</div>`);
                  } else {
                    _push2(`<div class="teaser-item__image" data-v-d6246f8b${_scopeId}>`);
                    if (getItemImage(item) && getItemImage(item).asset && getItemImage(item).asset.url) {
                      _push2(ssrRenderComponent(_component_MediaImage, {
                        image: getItemImage(item),
                        class: `media-${props.module.style || "default"}`
                      }, null, _parent2, _scopeId));
                    } else {
                      _push2(`<div class="image-placeholder" data-v-d6246f8b${_scopeId}>`);
                      if ((_o2 = (_n2 = (_m2 = (_l2 = (_k2 = unref(mainStore)) == null ? void 0 : _k2.siteFallbacks) == null ? void 0 : _l2.fallbackSet) == null ? void 0 : _m2.image) == null ? void 0 : _n2.asset) == null ? void 0 : _o2.url) {
                        _push2(`<img${ssrRenderAttr("src", (_t2 = (_s2 = (_r2 = (_q2 = (_p2 = unref(mainStore)) == null ? void 0 : _p2.siteFallbacks) == null ? void 0 : _q2.fallbackSet) == null ? void 0 : _r2.image) == null ? void 0 : _s2.asset) == null ? void 0 : _t2.url)} alt="Fallback Image" class="fallback-image" data-v-d6246f8b${_scopeId}>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div>`);
                    }
                    _push2(`</div>`);
                  }
                } else {
                  return [
                    props.module.type === "sets" ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "teaser-item__image"
                    }, [
                      (item == null ? void 0 : item.image) && (item == null ? void 0 : item.image.asset) && (item == null ? void 0 : item.image.asset.url) ? (openBlock(), createBlock("img", {
                        key: 0,
                        src: item == null ? void 0 : item.image.asset.url,
                        alt: (item == null ? void 0 : item.title) || "",
                        loading: "lazy"
                      }, null, 8, ["src", "alt"])) : (item == null ? void 0 : item.soundcloud) ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "track-artwork"
                      }, [
                        artworkUrls.value.get(item == null ? void 0 : item._id) ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: artworkUrls.value.get(item == null ? void 0 : item._id),
                          alt: "Track Artwork",
                          class: "track-image"
                        }, null, 8, ["src"])) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "track-artwork-placeholder"
                        }))
                      ])) : (openBlock(), createBlock("div", {
                        key: 2,
                        class: "image-placeholder"
                      }, [
                        ((_y2 = (_x2 = (_w2 = (_v2 = (_u2 = unref(mainStore)) == null ? void 0 : _u2.siteFallbacks) == null ? void 0 : _v2.fallbackSet) == null ? void 0 : _w2.image) == null ? void 0 : _x2.asset) == null ? void 0 : _y2.url) ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: (_D2 = (_C2 = (_B2 = (_A2 = (_z2 = unref(mainStore)) == null ? void 0 : _z2.siteFallbacks) == null ? void 0 : _A2.fallbackSet) == null ? void 0 : _B2.image) == null ? void 0 : _C2.asset) == null ? void 0 : _D2.url,
                          alt: "Fallback Image",
                          class: "fallback-image"
                        }, null, 8, ["src"])) : createCommentVNode("", true)
                      ]))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "teaser-item__image"
                    }, [
                      getItemImage(item) && getItemImage(item).asset && getItemImage(item).asset.url ? (openBlock(), createBlock(_component_MediaImage, {
                        key: 0,
                        image: getItemImage(item),
                        class: `media-${props.module.style || "default"}`
                      }, null, 8, ["image", "class"])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "image-placeholder"
                      }, [
                        ((_I2 = (_H2 = (_G2 = (_F2 = (_E2 = unref(mainStore)) == null ? void 0 : _E2.siteFallbacks) == null ? void 0 : _F2.fallbackSet) == null ? void 0 : _G2.image) == null ? void 0 : _H2.asset) == null ? void 0 : _I2.url) ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: (_N2 = (_M2 = (_L2 = (_K2 = (_J2 = unref(mainStore)) == null ? void 0 : _J2.siteFallbacks) == null ? void 0 : _K2.fallbackSet) == null ? void 0 : _L2.image) == null ? void 0 : _M2.asset) == null ? void 0 : _N2.url,
                          alt: "Fallback Image",
                          class: "fallback-image"
                        }, null, 8, ["src"])) : createCommentVNode("", true)
                      ]))
                    ]))
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="teaser-item__content" data-v-d6246f8b>`);
          if (props.module.type !== "pool") {
            _push(`<section class="teaser-item__content__interactive" data-v-d6246f8b>`);
            if ((item == null ? void 0 : item.datetime) || (item == null ? void 0 : item.publishedAt) || (item == null ? void 0 : item._updatedAt) || (item == null ? void 0 : item._createdAt)) {
              _push(`<div class="teaser-item__date" data-v-d6246f8b>${ssrInterpolate(formatDate(
                (item == null ? void 0 : item.datetime) || (item == null ? void 0 : item.publishedAt) || (item == null ? void 0 : item._updatedAt) || (item == null ? void 0 : item._createdAt)
              ))}</div>`);
            } else {
              _push(`<!---->`);
            }
            if (props.module.type === "sets" && (item == null ? void 0 : item.soundcloud)) {
              _push(`<button class="play-button" data-v-d6246f8b><span class="sr-only" data-v-d6246f8b>Play</span><svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-d6246f8b><path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" data-v-d6246f8b></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</section>`);
          } else {
            _push(`<!---->`);
          }
          if ((item == null ? void 0 : item.parentShow) && props.module.type === "sets") {
            _push(`<div class="teaser-item__content__show" data-v-d6246f8b>`);
            if (((_b2 = (_a2 = item == null ? void 0 : item.parentShow) == null ? void 0 : _a2.title) == null ? void 0 : _b2.toLowerCase()) !== "no-show" && ((_c = item == null ? void 0 : item.parentShow) == null ? void 0 : _c.slug) && (item == null ? void 0 : item.clickableTitle)) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: unref(localePath)(`/shows/${(_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.slug.current}`),
                class: "teaser-item__link"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<h3 class="teaser-item__title show-title" data-v-d6246f8b${_scopeId}>${ssrInterpolate((_a3 = item == null ? void 0 : item.parentShow) == null ? void 0 : _a3.title)}</h3>`);
                  } else {
                    return [
                      createVNode("h3", { class: "teaser-item__title show-title" }, toDisplayString((_b3 = item == null ? void 0 : item.parentShow) == null ? void 0 : _b3.title), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else if (((_f = (_e = item == null ? void 0 : item.parentShow) == null ? void 0 : _e.title) == null ? void 0 : _f.toLowerCase()) === "no-show" && (item == null ? void 0 : item.title)) {
              _push(`<h3 class="teaser-item__title show-title" data-v-d6246f8b>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`);
            } else if (((_h = (_g = item == null ? void 0 : item.parentShow) == null ? void 0 : _g.title) == null ? void 0 : _h.toLowerCase()) !== "no-show") {
              _push(`<h3 class="teaser-item__title show-title" data-v-d6246f8b>${ssrInterpolate((item == null ? void 0 : item.title) || ((_i = item == null ? void 0 : item.parentShow) == null ? void 0 : _i.title))}</h3>`);
            } else {
              _push(`<!---->`);
            }
            if ((item == null ? void 0 : item.persons) && (item == null ? void 0 : item.persons.length) > 0) {
              _push(`<div class="show-artists" data-v-d6246f8b><!--[-->`);
              ssrRenderList(item == null ? void 0 : item.persons, (artist, index) => {
                var _a3, _b3;
                _push(`<h3 class="teaser-item__artist" data-v-d6246f8b>`);
                if (artist == null ? void 0 : artist.poolVisibility) {
                  _push(ssrRenderComponent(_component_NuxtLink, {
                    to: unref(localePath)(`/pool/${(_a3 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a3.current}`),
                    class: "teaser-item__link"
                  }, {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      var _a4, _b4;
                      if (_push2) {
                        _push2(`${ssrInterpolate(artist == null ? void 0 : artist.title)}${ssrInterpolate(index < ((_a4 = item == null ? void 0 : item.persons) == null ? void 0 : _a4.length) - 1 ? "," : "")}  `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(artist == null ? void 0 : artist.title) + toDisplayString(index < ((_b4 = item == null ? void 0 : item.persons) == null ? void 0 : _b4.length) - 1 ? "," : "") + "  ", 1)
                        ];
                      }
                    }),
                    _: 2
                  }, _parent));
                } else {
                  _push(`<span data-v-d6246f8b>${ssrInterpolate(artist.title)}${ssrInterpolate(index < ((_b3 = item == null ? void 0 : item.persons) == null ? void 0 : _b3.length) - 1 ? "," : "")}  </span>`);
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
          if (props.module.type === "words") {
            _push(`<div class="tags read-more" data-v-d6246f8b>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "grid-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<h3 class="tag" data-v-d6246f8b${_scopeId}>Read More</h3>`);
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
          if (props.module.type !== "sets") {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "teaser-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<h3 class="teaser-item__title" data-v-d6246f8b${_scopeId}>${ssrInterpolate((item == null ? void 0 : item.title) || (item == null ? void 0 : item.name))}</h3>`);
                } else {
                  return [
                    createVNode("h3", { class: "teaser-item__title" }, toDisplayString((item == null ? void 0 : item.title) || (item == null ? void 0 : item.name)), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if ((item == null ? void 0 : item.useTeaserText) && (item == null ? void 0 : item.textTeaser) && props.module.type !== "words") {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: getRichTextBlocks(item == null ? void 0 : item.textTeaser)
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.useTeaserText) && (item == null ? void 0 : item.text) && (item == null ? void 0 : item.text.length) > 0 && props.module.type !== "words") {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: getRichTextBlocksSliced(item == null ? void 0 : item.text, 1)
            }, null, _parent));
          } else if (props.module.type === "words") {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.textTeaser)
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.text) && (item == null ? void 0 : item.description) && (item == null ? void 0 : item.description.length) > 0 && (((_j = item == null ? void 0 : item.description[0]) == null ? void 0 : _j.value) || ((_k = item == null ? void 0 : item.description[1]) == null ? void 0 : _k.value))) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))((_l = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.description)) == null ? void 0 : _l.slice(0, 1), 100)
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.text) && props.module.poolContentType == "persons" && ((_o = (_n = (_m = unref(mainStore)) == null ? void 0 : _m.siteFallbacks) == null ? void 0 : _n.fallbackPerson) == null ? void 0 : _o.description.length) > 0 && (((_t = (_s = (_r = (_q = (_p = unref(mainStore)) == null ? void 0 : _p.siteFallbacks) == null ? void 0 : _q.fallbackPerson) == null ? void 0 : _r.description) == null ? void 0 : _s[0]) == null ? void 0 : _t.value) || ((_y = (_x = (_w = (_v = (_u = unref(mainStore)) == null ? void 0 : _u.siteFallbacks) == null ? void 0 : _v.fallbackPerson) == null ? void 0 : _w.description) == null ? void 0 : _x[1]) == null ? void 0 : _y.value))) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_C = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(
                  (_B = (_A = (_z = unref(mainStore)) == null ? void 0 : _z.siteFallbacks) == null ? void 0 : _A.fallbackPerson) == null ? void 0 : _B.description
                )) == null ? void 0 : _C.slice(0, 1),
                100
              )
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.text) && props.module.poolContentType == "venues" && ((_F = (_E = (_D = unref(mainStore)) == null ? void 0 : _D.siteFallbacks) == null ? void 0 : _E.fallbackVenue) == null ? void 0 : _F.description.length) > 0 && (((_K = (_J = (_I = (_H = (_G = unref(mainStore)) == null ? void 0 : _G.siteFallbacks) == null ? void 0 : _H.fallbackVenue) == null ? void 0 : _I.description) == null ? void 0 : _J[0]) == null ? void 0 : _K.value) || ((_P = (_O = (_N = (_M = (_L = unref(mainStore)) == null ? void 0 : _L.siteFallbacks) == null ? void 0 : _M.fallbackPerson) == null ? void 0 : _N.description) == null ? void 0 : _O[1]) == null ? void 0 : _P.value))) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_T = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(
                  (_S = (_R = (_Q = unref(mainStore)) == null ? void 0 : _Q.siteFallbacks) == null ? void 0 : _R.fallbackPerson) == null ? void 0 : _S.description
                )) == null ? void 0 : _T.slice(0, 1),
                100
              )
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (props.module.showTags && getItemNonCityTags(item).length > 0) {
            _push(`<div class="teaser-item__tags tags" data-v-d6246f8b><!--[-->`);
            ssrRenderList(getItemNonCityTags(item), (tag) => {
              var _a3, _b3, _c2, _d2;
              _push(`<button class="tag clickable" data-v-d6246f8b>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.title) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_d2 = (_c2 = tag == null ? void 0 : tag.title) == null ? void 0 : _c2[0]) == null ? void 0 : _d2.value) ?? tag.title)}</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (props.module.showTags && ((_U = item.genres) == null ? void 0 : _U.length)) {
            _push(`<div class="teaser-genres" data-v-d6246f8b><!--[-->`);
            ssrRenderList(item.genres, (genre) => {
              _push(`<button class="genre clickable" data-v-d6246f8b>${ssrInterpolate(genre.name || genre.title)}</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
        if (hasMoreItems.value) {
          _push(`<div class="content-teaser__load-more" data-v-d6246f8b><button class="${ssrRenderClass([{ more: shouldShowMoreButton.value }, "load-more-button"])}" data-v-d6246f8b>`);
          if (!shouldShowMoreButton.value) {
            _push(`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-d6246f8b><path d="M7.67578 0.541016V14.8113" stroke-width="5" data-v-d6246f8b></path><path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" data-v-d6246f8b></path></svg>`);
          } else {
            _push(`<!--[--> More <!--]-->`);
          }
          _push(`</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleContentTeaser.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-d6246f8b"]]), { __name: "ModuleContentTeaser" });

export { __nuxt_component_3 as _ };
