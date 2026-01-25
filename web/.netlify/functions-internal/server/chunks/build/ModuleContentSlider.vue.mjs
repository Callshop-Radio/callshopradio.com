import {
  e as useI18n,
  f as useLocalePath,
  u as useMainStore,
  q as useAsyncData,
  n as useSanity,
  r as useThrottleFn,
  i as __nuxt_component_0,
  h as __nuxt_component_2$1,
  d as __nuxt_component_1,
  _ as _export_sfc,
} from "./server.mjs";
import { p as parseI18nObj } from "./parseI18nObj.mjs";
import {
  f as formatDate,
  l as limitTextBlocks,
  A as ARTICLE_COUNT_QUERY,
  c as ARTICLE_LIST_QUERY,
  S as SHOW_COUNT_QUERY,
  d as SHOW_LIST_QUERY,
  P as POOL_COUNT_QUERY,
  e as POOL_LIST_QUERY,
  g as SET_COUNT_QUERY,
  h as SET_LIST_QUERY,
} from "./ModuleHeroSlider.vue.mjs";
import {
  defineComponent,
  computed,
  ref,
  withAsyncContext,
  watch,
  mergeProps,
  unref,
  withCtx,
  createVNode,
  toDisplayString,
  createBlock,
  createCommentVNode,
  openBlock,
  createTextVNode,
  useSSRContext,
} from "vue";
import {
  ssrRenderAttrs,
  ssrInterpolate,
  ssrRenderComponent,
  ssrRenderStyle,
  ssrRenderList,
  ssrRenderClass,
  ssrRenderAttr,
} from "vue/server-renderer";
import emblaCarouselVue from "embla-carousel-vue";

const SELF_LOAD_PER_PAGE = 50;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ModuleContentSlider",
  __ssrInlineRender: true,
  props: {
    module: {
      type: Object,
      required: true,
    },
  },
  async setup(__props) {
    let __temp, __restore;
    const { locale, setLocale } = useI18n();
    const localePath = useLocalePath();
    const mainStore = useMainStore();
    const props = __props;
    const needsSelfLoad = computed(() => {
      if (!props.module) return false;
      const { type, poolItems, setItems, showItems, articleItems } =
        props.module;
      const hasItems = {
        pool: (poolItems == null ? void 0 : poolItems.length) > 0,
        sets: (setItems == null ? void 0 : setItems.length) > 0,
        shows: (showItems == null ? void 0 : showItems.length) > 0,
        words: (articleItems == null ? void 0 : articleItems.length) > 0,
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
          params.types =
            poolType === "all"
              ? ["person", "venue"]
              : poolType === "persons"
                ? ["person"]
                : poolType === "venues"
                  ? ["venue"]
                  : ["person", "venue"];
          return {
            query: POOL_LIST_QUERY,
            countQuery: POOL_COUNT_QUERY,
            params,
          };
        case "shows":
          return {
            query: SHOW_LIST_QUERY,
            countQuery: SHOW_COUNT_QUERY,
            params,
          };
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
    const { data: selfLoadedItems, pending: isLoadingInitial } =
      (([__temp, __restore] = withAsyncContext(async () => {
        var _a, _b, _c;
        return useAsyncData(
          `module-content-slider-${((_a = props.module) == null ? void 0 : _a._key) || ((_b = props.module) == null ? void 0 : _b.type)}-${((_c = props.module) == null ? void 0 : _c.poolContentType) || "default"}`,
          async () => {
            if (!needsSelfLoad.value) return [];
            const config = buildQueryConfig();
            if (!config) return [];
            try {
              const sanity = useSanity();
              const [items, count] = await Promise.all([
                sanity.fetch(config.query, config.params),
                sanity.fetch(config.countQuery, config.params),
              ]);
              if (typeof count === "number") {
                selfLoadedCount.value = count;
              }
              return items || [];
            } catch (error) {
              console.error(
                "[ModuleContentSlider] SSR Data Fetch Error:",
                error,
              );
              return [];
            }
          },
          {
            default: () => [],
            lazy: false,
          },
        );
      })),
      (__temp = await __temp),
      __restore(),
      __temp);
    const currentIndex = ref(0);
    const [emblaNode, emblaApi] = emblaCarouselVue({
      align: "start",
      loop: true,
      slidesToScroll: 1,
      // One slide with 3 items
    });
    const selectedIndex = ref(0);
    const scrollSnaps = ref([]);
    useThrottleFn(() => {
      if (!emblaContainer.value) return;
      emblaContainer.value.style.transform;
    }, 100);
    const emblaContainer = ref();
    const isDesktop = ref(true);
    const [mobileEmblaNode, mobileEmblaApi] = emblaCarouselVue({
      align: "start",
      loop: true,
      slidesToScroll: 1,
    });
    const mobileContainer = ref();
    const mobileCurrentIndex = ref(0);
    const mobileSelectedIndex = ref(0);
    const mobileScrollSnaps = ref([]);
    function getItemImage(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      const itemType = item._type || "";
      if (item.image || item.mainImage) {
        return item.image || item.mainImage;
      }
      switch (itemType) {
        case "person":
          return (_b =
            (_a = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _a.fallbackPerson) == null
            ? void 0
            : _b.image;
        case "venue":
          return (_d =
            (_c = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _c.fallbackVenue) == null
            ? void 0
            : _d.image;
        case "show":
          return (_f =
            (_e = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _e.fallbackShow) == null
            ? void 0
            : _f.image;
        case "set":
          return (_h =
            (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _g.fallbackSet) == null
            ? void 0
            : _h.image;
        case "word":
        case "article":
          return (_j =
            (_i = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _i.fallbackArticle) == null
            ? void 0
            : _j.image;
        default:
          return (_l =
            (_k = mainStore == null ? void 0 : mainStore.siteFallbacks) == null
              ? void 0
              : _k.fallbackPerson) == null
            ? void 0
            : _l.image;
      }
    }
    function getItemRoute(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      if (!item || !(item == null ? void 0 : item.slug)) return "/";
      switch (item == null ? void 0 : item._type) {
        case "person":
        case "venue":
          return localePath(
            `/pool/${(_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current}`,
          );
        case "set":
          if (
            (_c =
              (_b = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _b.slug) == null
              ? void 0
              : _c.current
          ) {
            return localePath(
              `/shows/${(_e = (_d = item.parentShow) == null ? void 0 : _d.slug) == null ? void 0 : _e.current}/${(_f = item == null ? void 0 : item.slug) == null ? void 0 : _f.current}`,
            );
          }
          return localePath(
            `/shows/${(_h = item == null ? void 0 : item.slug) == null ? void 0 : _h.current}`,
          );
        case "article":
          return localePath(
            `/words/${(_i = item == null ? void 0 : item.slug) == null ? void 0 : _i.current}`,
          );
        case "show":
          return localePath(
            `/shows/${(_j = item == null ? void 0 : item.slug) == null ? void 0 : _j.current}`,
          );
        // Standard-Fallback
        default:
          return localePath(
            `/${item == null ? void 0 : item._type}/${(_k = item == null ? void 0 : item.slug) == null ? void 0 : _k.current}`,
          );
      }
    }
    const artworkUrls = ref(/* @__PURE__ */ new Map());
    function loadArtworkUrl(item) {
      if (!item) return;
      const url = getSoundcloudArtwork(item);
      artworkUrls.value.set(item._id, url);
    }
    function getSoundcloudArtwork(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const artworkUrl =
        (_c =
          (_b =
            (_a = item == null ? void 0 : item.soundcloud) == null
              ? void 0
              : _a.tracks) == null
            ? void 0
            : _b[0]) == null
          ? void 0
          : _c.artwork_url;
      if (artworkUrl) {
        return artworkUrl.replace("-large", "-t500x500");
      }
      const parentShowImageUrl =
        (_f =
          (_e =
            (_d = item == null ? void 0 : item.parentShow) == null
              ? void 0
              : _d.image) == null
            ? void 0
            : _e.asset) == null
          ? void 0
          : _f.url;
      const storeFallbackUrl =
        (_j =
          (_i =
            (_h =
              (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) ==
              null
                ? void 0
                : _g.fallbackSet) == null
              ? void 0
              : _h.image) == null
            ? void 0
            : _i.asset) == null
          ? void 0
          : _j.url;
      return parentShowImageUrl || storeFallbackUrl || "";
    }
    function groupItems(items, contentType2 = null) {
      if (!items || !items.length) return [];
      let filteredItems = items;
      if (contentType2) {
        if (contentType2 === "persons") {
          filteredItems = items.filter((item) => item._type === "person");
        } else if (contentType2 === "venues") {
          filteredItems = items.filter((item) => item._type === "venue");
        } else if (contentType2 === "all") {
          filteredItems = items.filter(
            (item) => item._type === "venue" || item._type === "person",
          );
        }
      }
      if (props.module.style === "image") {
        const limitedItems2 =
          props.module.count && props.module.count > 0
            ? filteredItems.slice(0, props.module.count)
            : filteredItems;
        return limitedItems2.map((item) => [item]);
      }
      let itemCount = filteredItems.length;
      if (props.module.count && props.module.count > 0) {
        const maxCount = props.module.count * 3;
        itemCount = Math.min(itemCount, maxCount);
      }
      itemCount = Math.floor(itemCount / 3) * 3;
      const limitedItems = filteredItems.slice(0, itemCount);
      const groups = [];
      for (let i = 0; i < limitedItems.length; i += 3) {
        groups.push(limitedItems.slice(i, i + 3));
      }
      return groups;
    }
    function groupMobileItems(items, contentType2 = null) {
      if (!items || !items.length) return [];
      let filteredItems = items;
      if (contentType2) {
        if (contentType2 === "persons") {
          filteredItems = items.filter((item) => item._type === "person");
        } else if (contentType2 === "venues") {
          filteredItems = items.filter((item) => item._type === "venue");
        } else if (contentType2 === "all") {
          filteredItems = items.filter(
            (item) => item._type === "venue" || item._type === "person",
          );
        }
      }
      let limitedItems = filteredItems;
      if (props.module.count && props.module.count > 0) {
        limitedItems = filteredItems.slice(0, props.module.count);
      }
      return limitedItems.map((item) => [item]);
    }
    useThrottleFn(() => {
      if (!mobileContainer.value) return;
      mobileContainer.value.style.transform;
    }, 100);
    const mobileGroupedItems = computed(() => {
      if (!props.module) return [];
      if (needsSelfLoad.value) {
        return groupMobileItems(
          selfLoadedItems.value,
          props.module.poolContentType,
        );
      }
      switch (props.module.type) {
        case "pool":
          return groupMobileItems(
            props.module.poolItems || [],
            props.module.poolContentType,
          );
        case "sets":
          return groupMobileItems(props.module.setItems || []);
        case "shows":
          return groupMobileItems(props.module.showItems || []);
        case "words":
          return groupMobileItems(props.module.articleItems || []);
        default:
          return [];
      }
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
      { immediate: true },
    );
    const groupedItems = computed(() => {
      if (!props.module) return [];
      if (needsSelfLoad.value) {
        return groupItems(selfLoadedItems.value, props.module.poolContentType);
      }
      switch (props.module.type) {
        case "pool":
          return groupItems(
            props.module.poolItems || [],
            props.module.poolContentType,
          );
        case "sets":
          return groupItems(props.module.setItems || []);
        case "shows":
          return groupItems(props.module.showItems || []);
        case "words":
          return groupItems(props.module.articleItems || []);
        default:
          return [];
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_MediaImage = __nuxt_component_2$1;
      const _component_RichText = __nuxt_component_1;
      if (__props.module) {
        _push(
          `<div${ssrRenderAttrs(
            mergeProps(
              {
                class: `embla module-carousel module-carousel--${__props.module.style || "default"} ${categoryType.value.toLowerCase()}`,
              },
              _attrs,
            ),
          )} data-v-231dc24c><div class="module-carousel__header" data-v-231dc24c>`,
        );
        if ((_a = __props.module) == null ? void 0 : _a.title) {
          _push(
            `<h3 class="module-carousel__title" data-v-231dc24c>${ssrInterpolate((_b = __props.module) == null ? void 0 : _b.title)}</h3>`,
          );
        } else {
          _push(`<!---->`);
        }
        if (categoryType.value == "Episodes") {
          _push(
            `<section class="module-carousel__header__type" data-v-231dc24c>`,
          );
          _push(
            ssrRenderComponent(
              _component_NuxtLink,
              {
                to: unref(localePath)("/shows"),
              },
              {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(
                      `<h2 class="module-carousel__header__type__pill" data-v-231dc24c${_scopeId}>Shows</h2>`,
                    );
                  } else {
                    return [
                      createVNode(
                        "h2",
                        { class: "module-carousel__header__type__pill" },
                        "Shows",
                      ),
                    ];
                  }
                }),
                _: 1,
              },
              _parent,
            ),
          );
          _push(`</section>`);
        } else {
          _push(
            `<section class="module-carousel__header__type" data-v-231dc24c>`,
          );
          _push(
            ssrRenderComponent(
              _component_NuxtLink,
              {
                to: unref(localePath)(categoryType.value.toLowerCase()),
              },
              {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(
                      `<h2 class="module-carousel__header__type__pill" data-v-231dc24c${_scopeId}>${ssrInterpolate(categoryType.value)}</h2>`,
                    );
                  } else {
                    return [
                      createVNode(
                        "h2",
                        { class: "module-carousel__header__type__pill" },
                        toDisplayString(categoryType.value),
                        1,
                      ),
                    ];
                  }
                }),
                _: 1,
              },
              _parent,
            ),
          );
          _push(`</section>`);
        }
        _push(
          `</div><div style="${ssrRenderStyle(isDesktop.value ? null : { display: "none" })}" data-v-231dc24c><nav class="embla__nav" data-v-231dc24c>`,
        );
        if (scrollSnaps.value.length > 1) {
          _push(`<div class="embla__nav__dots" data-v-231dc24c><!--[-->`);
          ssrRenderList(scrollSnaps.value, (_, index) => {
            _push(
              `<button class="${ssrRenderClass(["embla__dot", { "is-selected": index === selectedIndex.value }])}" data-v-231dc24c></button>`,
            );
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        if (scrollSnaps.value.length > 1) {
          _push(
            `<div class="embla__nav__arrows" data-v-231dc24c><button class="embla__arrow embla__arrow--prev" aria-label="Vorheriger Slide" data-v-231dc24c><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z" fill="black" data-v-231dc24c></path></svg></button><button class="embla__arrow embla__arrow--next" aria-label="Nächster Slide" data-v-231dc24c><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z" fill="black" data-v-231dc24c></path></svg></button></div>`,
          );
        } else {
          _push(`<!---->`);
        }
        _push(
          `</nav><div class="embla" data-v-231dc24c><div class="embla__container" data-v-231dc24c><!--[-->`,
        );
        ssrRenderList(groupedItems.value, (group, groupIndex) => {
          _push(
            `<div class="${ssrRenderClass([{ active: groupIndex === currentIndex.value }, "embla__slide"])}" data-v-231dc24c><div class="${ssrRenderClass(`slide-group group-${__props.module.style || "default"}`)}" data-v-231dc24c><!--[-->`,
          );
          ssrRenderList(group, (item) => {
            var _a2,
              _b2,
              _c,
              _d,
              _e,
              _f,
              _g,
              _h,
              _i,
              _j,
              _k,
              _l,
              _m,
              _n,
              _o,
              _p,
              _q,
              _r,
              _s,
              _t,
              _u,
              _v,
              _w,
              _x,
              _y,
              _z,
              _A,
              _B,
              _C,
              _D,
              _E,
              _F,
              _G,
              _H,
              _I,
              _J,
              _K,
              _L,
              _M,
              _N,
              _O,
              _P,
              _Q,
              _R,
              _S,
              _T;
            _push(
              `<div class="${ssrRenderClass(`slide-item slide-${__props.module.style || "default"}`)}" data-v-231dc24c>`,
            );
            if (
              __props.module.showTags &&
              ((_a2 = item.tags) == null ? void 0 : _a2.length) &&
              __props.module.style !== "image"
            ) {
              _push(
                `<div class="slide__tags city-tags" data-v-231dc24c><!--[-->`,
              );
              ssrRenderList(
                item.tags.filter((tag) => tag._type == "tag.city"),
                (tag) => {
                  var _a3, _b3;
                  _push(
                    `<button class="tag city" data-v-231dc24c>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.short) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.short) : ((tag == null ? void 0 : tag.short[0].value) ?? tag.short))}</button>`,
                  );
                },
              );
              _push(`<!--]--></div>`);
            } else if (__props.module.style !== "image") {
              _push(
                `<div class="slide__tags city-tags" data-v-231dc24c></div>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (item == null ? void 0 : item.slug) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: getItemRoute(item),
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      if (_push2) {
                        if (
                          getItemImage(item) &&
                          categoryType.value !== "Episodes"
                        ) {
                          _push2(
                            ssrRenderComponent(
                              _component_MediaImage,
                              {
                                image: getItemImage(item),
                                class: `media-${__props.module.style}`,
                              },
                              null,
                              _parent2,
                              _scopeId,
                            ),
                          );
                        } else if (
                          categoryType.value === "Episodes" &&
                          artworkUrls.value.get(item._id)
                        ) {
                          _push2(
                            `<img${ssrRenderAttr("src", artworkUrls.value.get(item._id))} alt="Episode Image" class="track-artwork" data-v-231dc24c${_scopeId}>`,
                          );
                        } else if (categoryType.value === "Episodes") {
                          _push2(
                            `<div class="track-artwork-placeholder" data-v-231dc24c${_scopeId}></div>`,
                          );
                        } else {
                          _push2(`<!---->`);
                        }
                      } else {
                        return [
                          getItemImage(item) &&
                          categoryType.value !== "Episodes"
                            ? (openBlock(),
                              createBlock(
                                _component_MediaImage,
                                {
                                  key: 0,
                                  image: getItemImage(item),
                                  class: `media-${__props.module.style}`,
                                },
                                null,
                                8,
                                ["image", "class"],
                              ))
                            : categoryType.value === "Episodes" &&
                                artworkUrls.value.get(item._id)
                              ? (openBlock(),
                                createBlock(
                                  "img",
                                  {
                                    key: 1,
                                    src: artworkUrls.value.get(item._id),
                                    alt: "Episode Image",
                                    class: "track-artwork",
                                  },
                                  null,
                                  8,
                                  ["src"],
                                ))
                              : categoryType.value === "Episodes"
                                ? (openBlock(),
                                  createBlock(
                                    "div",
                                    {
                                      key: 2,
                                      class: "track-artwork-placeholder",
                                      onVnodeMounted: ($event) =>
                                        loadArtworkUrl(item),
                                    },
                                    null,
                                    8,
                                    ["onVnodeMounted"],
                                  ))
                                : createCommentVNode("", true),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else {
              _push(`<!---->`);
            }
            _push(
              `<div class="slide-content" data-v-231dc24c><section class="slide-content__interactive" data-v-231dc24c>`,
            );
            if (item == null ? void 0 : item.datetime) {
              _push(
                `<h3 class="slide-date" data-v-231dc24c>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(item.datetime))}</h3>`,
              );
            } else if (item == null ? void 0 : item._updatedAt) {
              _push(
                `<h3 class="slide-date" data-v-231dc24c>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(item._updatedAt))}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (categoryType.value == "Episodes") {
              _push(
                `<button class="play" data-v-231dc24c><svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="black" data-v-231dc24c></path></svg></button>`,
              );
            } else {
              _push(`<!---->`);
            }
            _push(`</section>`);
            if (
              (item == null ? void 0 : item.clickableTitle) &&
              ((_b2 = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _b2.title) !== "No Show"
            ) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: unref(localePath)(
                      `/shows/no-show/${(_d = (_c = item == null ? void 0 : item.parentShow) == null ? void 0 : _c.slug) == null ? void 0 : _d.current}`,
                    ),
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      var _a3, _b3;
                      if (_push2) {
                        _push2(
                          `<h3 class="slide-title show-title" data-v-231dc24c${_scopeId}>${ssrInterpolate((_a3 = item == null ? void 0 : item.parentShow) == null ? void 0 : _a3.title)}</h3>`,
                        );
                      } else {
                        return [
                          createVNode(
                            "h3",
                            { class: "slide-title show-title" },
                            toDisplayString(
                              (_b3 = item == null ? void 0 : item.parentShow) ==
                                null
                                ? void 0
                                : _b3.title,
                            ),
                            1,
                          ),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else if (
              (item == null ? void 0 : item.parentShow) &&
              ((_e = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _e.title) !== "No Show"
            ) {
              _push(
                `<h3 class="slide-title show-title" data-v-231dc24c>${ssrInterpolate((_f = item == null ? void 0 : item.parentShow) == null ? void 0 : _f.title)}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (item == null ? void 0 : item.slug) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: getItemRoute(item),
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      if (_push2) {
                        if (contentType.value !== "sets") {
                          _push2(
                            `<h3 class="slide-title" data-v-231dc24c${_scopeId}>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`,
                          );
                        } else {
                          _push2(`<!---->`);
                        }
                      } else {
                        return [
                          contentType.value !== "sets"
                            ? (openBlock(),
                              createBlock(
                                "h3",
                                {
                                  key: 0,
                                  class: "slide-title",
                                },
                                toDisplayString(
                                  item == null ? void 0 : item.title,
                                ),
                                1,
                              ))
                            : createCommentVNode("", true),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else if (contentType.value !== "sets") {
              _push(
                `<h3 class="slide-title" data-v-231dc24c>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (
              contentType.value === "sets" &&
              item.persons &&
              item.persons.length > 0
            ) {
              _push(`<div class="show-artists" data-v-231dc24c><!--[-->`);
              ssrRenderList(item.persons, (artist, index) => {
                var _a3;
                _push(`<h3 class="slide-title" data-v-231dc24c>`);
                if (artist == null ? void 0 : artist.poolVisibility) {
                  _push(
                    ssrRenderComponent(
                      _component_NuxtLink,
                      {
                        to: unref(localePath)(
                          `/pool/${(_a3 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a3.current}`,
                        ),
                        class: "slide__link",
                      },
                      {
                        default: withCtx((_, _push2, _parent2, _scopeId) => {
                          if (_push2) {
                            _push2(
                              `${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")}  `,
                            );
                          } else {
                            return [
                              createTextVNode(
                                toDisplayString(artist.title) +
                                  toDisplayString(
                                    index < item.persons.length - 1 ? "," : "",
                                  ) +
                                  "  ",
                                1,
                              ),
                            ];
                          }
                        }),
                        _: 2,
                      },
                      _parent,
                    ),
                  );
                } else {
                  _push(
                    `<span class="slide-title" data-v-231dc24c>${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")}  </span>`,
                  );
                }
                _push(`</h3>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            if (
              (item == null ? void 0 : item.useTeaserText) &&
              (item == null ? void 0 : item.textTeaser)
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("parseI18nObj" in _ctx
                      ? _ctx.parseI18nObj
                      : unref(parseI18nObj))(
                      item == null ? void 0 : item.textTeaser,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.useTeaserText) &&
              (item == null ? void 0 : item.text) &&
              item.text.length > 0
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks:
                      (_g = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(item == null ? void 0 : item.text)) == null
                        ? void 0
                        : _g.slice(0, 1),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              (item == null ? void 0 : item.description) &&
              item.description.length > 0 &&
              (((_h = item.description[0]) == null ? void 0 : _h.value) ||
                ((_i = item.description[1]) == null ? void 0 : _i.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_j = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(item == null ? void 0 : item.description)) == null
                        ? void 0
                        : _j.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              __props.module.poolContentType == "persons" &&
              ((_m =
                (_l =
                  (_k = unref(mainStore)) == null
                    ? void 0
                    : _k.siteFallbacks) == null
                  ? void 0
                  : _l.fallbackPerson) == null
                ? void 0
                : _m.description.length) > 0 &&
              (((_r =
                (_q =
                  (_p =
                    (_o =
                      (_n = unref(mainStore)) == null
                        ? void 0
                        : _n.siteFallbacks) == null
                      ? void 0
                      : _o.fallbackPerson) == null
                    ? void 0
                    : _p.description) == null
                  ? void 0
                  : _q[0]) == null
                ? void 0
                : _r.value) ||
                ((_w =
                  (_v =
                    (_u =
                      (_t =
                        (_s = unref(mainStore)) == null
                          ? void 0
                          : _s.siteFallbacks) == null
                        ? void 0
                        : _t.fallbackPerson) == null
                      ? void 0
                      : _u.description) == null
                    ? void 0
                    : _v[1]) == null
                  ? void 0
                  : _w.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_A = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(
                        (_z =
                          (_y =
                            (_x = unref(mainStore)) == null
                              ? void 0
                              : _x.siteFallbacks) == null
                            ? void 0
                            : _y.fallbackPerson) == null
                          ? void 0
                          : _z.description,
                      )) == null
                        ? void 0
                        : _A.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              __props.module.poolContentType == "venues" &&
              ((_D =
                (_C =
                  (_B = unref(mainStore)) == null
                    ? void 0
                    : _B.siteFallbacks) == null
                  ? void 0
                  : _C.fallbackVenue) == null
                ? void 0
                : _D.description.length) > 0 &&
              (((_I =
                (_H =
                  (_G =
                    (_F =
                      (_E = unref(mainStore)) == null
                        ? void 0
                        : _E.siteFallbacks) == null
                      ? void 0
                      : _F.fallbackVenue) == null
                    ? void 0
                    : _G.description) == null
                  ? void 0
                  : _H[0]) == null
                ? void 0
                : _I.value) ||
                ((_N =
                  (_M =
                    (_L =
                      (_K =
                        (_J = unref(mainStore)) == null
                          ? void 0
                          : _J.siteFallbacks) == null
                        ? void 0
                        : _K.fallbackPerson) == null
                      ? void 0
                      : _L.description) == null
                    ? void 0
                    : _M[1]) == null
                  ? void 0
                  : _N.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_R = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(
                        (_Q =
                          (_P =
                            (_O = unref(mainStore)) == null
                              ? void 0
                              : _O.siteFallbacks) == null
                            ? void 0
                            : _P.fallbackPerson) == null
                          ? void 0
                          : _Q.description,
                      )) == null
                        ? void 0
                        : _R.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else {
              _push(`<!---->`);
            }
            if (
              __props.module.showTags &&
              ((_S = item.tags) == null ? void 0 : _S.length)
            ) {
              _push(`<div class="slide__tags tags" data-v-231dc24c><!--[-->`);
              ssrRenderList(
                item.tags.filter((tag) => tag._type !== "tag.city"),
                (tag) => {
                  var _a3, _b3;
                  _push(
                    `<button class="tag" data-v-231dc24c>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.title) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((tag == null ? void 0 : tag.title[0].value) ?? tag.title))}</button>`,
                  );
                },
              );
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            if (
              __props.module.showTags &&
              ((_T = item.genres) == null ? void 0 : _T.length)
            ) {
              _push(`<div class="slide-genres" data-v-231dc24c><!--[-->`);
              ssrRenderList(item.genres, (genre) => {
                _push(
                  `<span class="genre" data-v-231dc24c>${ssrInterpolate(genre.name || genre.title)}</span>`,
                );
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(
          `<!--]--></div></div></div><div style="${ssrRenderStyle(!isDesktop.value ? null : { display: "none" })}" class="mobile-slider" data-v-231dc24c><nav class="embla__nav" data-v-231dc24c>`,
        );
        if (mobileScrollSnaps.value.length > 1) {
          _push(`<div class="embla__nav__dots" data-v-231dc24c><!--[-->`);
          ssrRenderList(mobileScrollSnaps.value, (_, index) => {
            _push(
              `<button class="${ssrRenderClass([
                "embla__dot",
                { "is-selected": index === mobileSelectedIndex.value },
              ])}" data-v-231dc24c></button>`,
            );
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        if (mobileScrollSnaps.value.length > 1) {
          _push(
            `<div class="embla__nav__arrows" data-v-231dc24c><button class="embla__arrow embla__arrow--prev" aria-label="Vorheriger Slide" data-v-231dc24c><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z" fill="black" data-v-231dc24c></path></svg></button><button class="embla__arrow embla__arrow--next" aria-label="Nächster Slide" data-v-231dc24c><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z" fill="black" data-v-231dc24c></path></svg></button></div>`,
          );
        } else {
          _push(`<!---->`);
        }
        _push(
          `</nav><div class="embla" data-v-231dc24c><div class="embla__container" data-v-231dc24c><!--[-->`,
        );
        ssrRenderList(mobileGroupedItems.value, (group, groupIndex) => {
          _push(
            `<div class="${ssrRenderClass([{ active: groupIndex === mobileCurrentIndex.value }, "embla__slide"])}" data-v-231dc24c><div class="${ssrRenderClass(`slide-group mobile-group-${__props.module.style || "default"}`)}" data-v-231dc24c><!--[-->`,
          );
          ssrRenderList(group, (item) => {
            var _a2,
              _b2,
              _c,
              _d,
              _e,
              _f,
              _g,
              _h,
              _i,
              _j,
              _k,
              _l,
              _m,
              _n,
              _o,
              _p,
              _q,
              _r,
              _s,
              _t,
              _u,
              _v,
              _w,
              _x,
              _y,
              _z,
              _A,
              _B,
              _C,
              _D,
              _E,
              _F,
              _G,
              _H,
              _I,
              _J,
              _K,
              _L,
              _M,
              _N,
              _O,
              _P,
              _Q,
              _R,
              _S,
              _T;
            _push(
              `<div class="${ssrRenderClass(`slide-item mobile-slide-${__props.module.style || "default"}`)}" data-v-231dc24c>`,
            );
            if (
              __props.module.showTags &&
              ((_a2 = item.tags) == null ? void 0 : _a2.length) &&
              __props.module.style !== "image"
            ) {
              _push(
                `<div class="slide__tags city-tags" data-v-231dc24c><!--[-->`,
              );
              ssrRenderList(
                item.tags.filter((tag) => tag._type == "tag.city"),
                (tag) => {
                  var _a3, _b3;
                  _push(
                    `<button class="tag city" data-v-231dc24c>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.short) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.short) : ((tag == null ? void 0 : tag.short[0].value) ?? tag.short))}</button>`,
                  );
                },
              );
              _push(`<!--]--></div>`);
            } else if (__props.module.style !== "image") {
              _push(
                `<div class="slide__tags city-tags" data-v-231dc24c></div>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (item == null ? void 0 : item.slug) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: getItemRoute(item),
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      if (_push2) {
                        if (
                          getItemImage(item) &&
                          categoryType.value !== "Episodes"
                        ) {
                          _push2(
                            ssrRenderComponent(
                              _component_MediaImage,
                              {
                                image: getItemImage(item),
                                class: `media-${__props.module.style}`,
                              },
                              null,
                              _parent2,
                              _scopeId,
                            ),
                          );
                        } else if (
                          categoryType.value === "Episodes" &&
                          artworkUrls.value.get(item._id)
                        ) {
                          _push2(
                            `<img${ssrRenderAttr("src", artworkUrls.value.get(item._id))} alt="Episode Image" class="track-artwork" data-v-231dc24c${_scopeId}>`,
                          );
                        } else if (categoryType.value === "Episodes") {
                          _push2(
                            `<div class="track-artwork-placeholder" data-v-231dc24c${_scopeId}></div>`,
                          );
                        } else {
                          _push2(`<!---->`);
                        }
                      } else {
                        return [
                          getItemImage(item) &&
                          categoryType.value !== "Episodes"
                            ? (openBlock(),
                              createBlock(
                                _component_MediaImage,
                                {
                                  key: 0,
                                  image: getItemImage(item),
                                  class: `media-${__props.module.style}`,
                                },
                                null,
                                8,
                                ["image", "class"],
                              ))
                            : categoryType.value === "Episodes" &&
                                artworkUrls.value.get(item._id)
                              ? (openBlock(),
                                createBlock(
                                  "img",
                                  {
                                    key: 1,
                                    src: artworkUrls.value.get(item._id),
                                    alt: "Episode Image",
                                    class: "track-artwork",
                                  },
                                  null,
                                  8,
                                  ["src"],
                                ))
                              : categoryType.value === "Episodes"
                                ? (openBlock(),
                                  createBlock(
                                    "div",
                                    {
                                      key: 2,
                                      class: "track-artwork-placeholder",
                                      onVnodeMounted: ($event) =>
                                        loadArtworkUrl(item),
                                    },
                                    null,
                                    8,
                                    ["onVnodeMounted"],
                                  ))
                                : createCommentVNode("", true),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else {
              _push(`<!---->`);
            }
            _push(
              `<div class="slide-content" data-v-231dc24c><section class="slide-content__interactive" data-v-231dc24c>`,
            );
            if (item == null ? void 0 : item.datetime) {
              _push(
                `<h3 class="slide-date" data-v-231dc24c>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(item.datetime))}</h3>`,
              );
            } else if (item == null ? void 0 : item._updatedAt) {
              _push(
                `<h3 class="slide-date" data-v-231dc24c>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(item._updatedAt))}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (categoryType.value == "Episodes") {
              _push(
                `<button class="play" data-v-231dc24c><svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-231dc24c><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="black" data-v-231dc24c></path></svg></button>`,
              );
            } else {
              _push(`<!---->`);
            }
            _push(`</section>`);
            if (
              ((_b2 = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _b2.slug) &&
              (item == null ? void 0 : item.clickableTitle) &&
              ((_c = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _c.title) !== "No Show"
            ) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: unref(localePath)(
                      `/shows/${(_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.slug.current}`,
                    ),
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      var _a3, _b3;
                      if (_push2) {
                        _push2(
                          `<h3 class="slide-title show-title" data-v-231dc24c${_scopeId}>${ssrInterpolate((_a3 = item == null ? void 0 : item.parentShow) == null ? void 0 : _a3.title)}</h3>`,
                        );
                      } else {
                        return [
                          createVNode(
                            "h3",
                            { class: "slide-title show-title" },
                            toDisplayString(
                              (_b3 = item == null ? void 0 : item.parentShow) ==
                                null
                                ? void 0
                                : _b3.title,
                            ),
                            1,
                          ),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else if (
              (item == null ? void 0 : item.parentShow) &&
              ((_e = item == null ? void 0 : item.parentShow) == null
                ? void 0
                : _e.title) !== "No Show"
            ) {
              _push(
                `<h3 class="slide-title show-title" data-v-231dc24c>${ssrInterpolate((_f = item == null ? void 0 : item.parentShow) == null ? void 0 : _f.title)}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (item == null ? void 0 : item.slug) {
              _push(
                ssrRenderComponent(
                  _component_NuxtLink,
                  {
                    to: getItemRoute(item),
                    a: "",
                    class: "slide__link",
                  },
                  {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      if (_push2) {
                        if (contentType.value !== "sets") {
                          _push2(
                            `<h3 class="slide-title" data-v-231dc24c${_scopeId}>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`,
                          );
                        } else {
                          _push2(`<!---->`);
                        }
                      } else {
                        return [
                          contentType.value !== "sets"
                            ? (openBlock(),
                              createBlock(
                                "h3",
                                {
                                  key: 0,
                                  class: "slide-title",
                                },
                                toDisplayString(
                                  item == null ? void 0 : item.title,
                                ),
                                1,
                              ))
                            : createCommentVNode("", true),
                        ];
                      }
                    }),
                    _: 2,
                  },
                  _parent,
                ),
              );
            } else if (contentType.value !== "sets") {
              _push(
                `<h3 class="slide-title" data-v-231dc24c>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`,
              );
            } else {
              _push(`<!---->`);
            }
            if (
              contentType.value === "sets" &&
              item.persons &&
              item.persons.length > 0
            ) {
              _push(`<div class="show-artists" data-v-231dc24c><!--[-->`);
              ssrRenderList(item.persons, (artist, index) => {
                var _a3;
                _push(`<h3 class="slide-title" data-v-231dc24c>`);
                if (artist == null ? void 0 : artist.poolVisibility) {
                  _push(
                    ssrRenderComponent(
                      _component_NuxtLink,
                      {
                        to: unref(localePath)(
                          `/pool/${(_a3 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a3.current}`,
                        ),
                        class: "slide__link",
                      },
                      {
                        default: withCtx((_, _push2, _parent2, _scopeId) => {
                          if (_push2) {
                            _push2(
                              `${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")}  `,
                            );
                          } else {
                            return [
                              createTextVNode(
                                toDisplayString(artist.title) +
                                  toDisplayString(
                                    index < item.persons.length - 1 ? "," : "",
                                  ) +
                                  "  ",
                                1,
                              ),
                            ];
                          }
                        }),
                        _: 2,
                      },
                      _parent,
                    ),
                  );
                } else {
                  _push(
                    `<span class="slide-title" data-v-231dc24c>${ssrInterpolate(artist.title)}${ssrInterpolate(index < item.persons.length - 1 ? "," : "")}  </span>`,
                  );
                }
                _push(`</h3>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            if (
              (item == null ? void 0 : item.useTeaserText) &&
              (item == null ? void 0 : item.textTeaser)
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("parseI18nObj" in _ctx
                      ? _ctx.parseI18nObj
                      : unref(parseI18nObj))(
                      item == null ? void 0 : item.textTeaser,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.useTeaserText) &&
              (item == null ? void 0 : item.text) &&
              item.text.length > 0
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks:
                      (_g = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(item == null ? void 0 : item.text)) == null
                        ? void 0
                        : _g.slice(0, 1),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              (item == null ? void 0 : item.description) &&
              item.description.length > 0 &&
              (((_h = item.description[0]) == null ? void 0 : _h.value) ||
                ((_i = item.description[1]) == null ? void 0 : _i.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_j = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(item == null ? void 0 : item.description)) == null
                        ? void 0
                        : _j.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              __props.module.poolContentType == "persons" &&
              ((_m =
                (_l =
                  (_k = unref(mainStore)) == null
                    ? void 0
                    : _k.siteFallbacks) == null
                  ? void 0
                  : _l.fallbackPerson) == null
                ? void 0
                : _m.description.length) > 0 &&
              (((_r =
                (_q =
                  (_p =
                    (_o =
                      (_n = unref(mainStore)) == null
                        ? void 0
                        : _n.siteFallbacks) == null
                      ? void 0
                      : _o.fallbackPerson) == null
                    ? void 0
                    : _p.description) == null
                  ? void 0
                  : _q[0]) == null
                ? void 0
                : _r.value) ||
                ((_w =
                  (_v =
                    (_u =
                      (_t =
                        (_s = unref(mainStore)) == null
                          ? void 0
                          : _s.siteFallbacks) == null
                        ? void 0
                        : _t.fallbackPerson) == null
                      ? void 0
                      : _u.description) == null
                    ? void 0
                    : _v[1]) == null
                  ? void 0
                  : _w.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_A = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(
                        (_z =
                          (_y =
                            (_x = unref(mainStore)) == null
                              ? void 0
                              : _x.siteFallbacks) == null
                            ? void 0
                            : _y.fallbackPerson) == null
                          ? void 0
                          : _z.description,
                      )) == null
                        ? void 0
                        : _A.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else if (
              !(item == null ? void 0 : item.text) &&
              __props.module.poolContentType == "venues" &&
              ((_D =
                (_C =
                  (_B = unref(mainStore)) == null
                    ? void 0
                    : _B.siteFallbacks) == null
                  ? void 0
                  : _C.fallbackVenue) == null
                ? void 0
                : _D.description.length) > 0 &&
              (((_I =
                (_H =
                  (_G =
                    (_F =
                      (_E = unref(mainStore)) == null
                        ? void 0
                        : _E.siteFallbacks) == null
                      ? void 0
                      : _F.fallbackVenue) == null
                    ? void 0
                    : _G.description) == null
                  ? void 0
                  : _H[0]) == null
                ? void 0
                : _I.value) ||
                ((_N =
                  (_M =
                    (_L =
                      (_K =
                        (_J = unref(mainStore)) == null
                          ? void 0
                          : _J.siteFallbacks) == null
                        ? void 0
                        : _K.fallbackPerson) == null
                      ? void 0
                      : _L.description) == null
                    ? void 0
                    : _M[1]) == null
                  ? void 0
                  : _N.value))
            ) {
              _push(
                ssrRenderComponent(
                  _component_RichText,
                  {
                    blocks: ("limitTextBlocks" in _ctx
                      ? _ctx.limitTextBlocks
                      : unref(limitTextBlocks))(
                      (_R = (
                        "parseI18nObj" in _ctx
                          ? _ctx.parseI18nObj
                          : unref(parseI18nObj)
                      )(
                        (_Q =
                          (_P =
                            (_O = unref(mainStore)) == null
                              ? void 0
                              : _O.siteFallbacks) == null
                            ? void 0
                            : _P.fallbackPerson) == null
                          ? void 0
                          : _Q.description,
                      )) == null
                        ? void 0
                        : _R.slice(0, 1),
                      100,
                    ),
                  },
                  null,
                  _parent,
                ),
              );
            } else {
              _push(`<!---->`);
            }
            if (
              __props.module.showTags &&
              ((_S = item.tags) == null ? void 0 : _S.length)
            ) {
              _push(`<div class="slide__tags tags" data-v-231dc24c><!--[-->`);
              ssrRenderList(
                item.tags.filter((tag) => tag._type !== "tag.city"),
                (tag) => {
                  var _a3, _b3;
                  _push(
                    `<button class="tag" data-v-231dc24c>${ssrInterpolate(((_b3 = (_a3 = tag == null ? void 0 : tag.title) == null ? void 0 : _a3[1]) == null ? void 0 : _b3.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((tag == null ? void 0 : tag.title[0].value) ?? tag.title))}</button>`,
                  );
                },
              );
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            if (
              __props.module.showTags &&
              ((_T = item.genres) == null ? void 0 : _T.length)
            ) {
              _push(`<div class="slide-genres" data-v-231dc24c><!--[-->`);
              ssrRenderList(item.genres, (genre) => {
                _push(
                  `<span class="genre" data-v-231dc24c>${ssrInterpolate(genre.name || genre.title)}</span>`,
                );
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  },
});

const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add(
    "../layers/base/components/modules/ModuleContentSlider.vue",
  );
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(
  _export_sfc(_sfc_main, [["__scopeId", "data-v-231dc24c"]]),
  { __name: "ModuleContentSlider" },
);

export { __nuxt_component_2 as _ };
