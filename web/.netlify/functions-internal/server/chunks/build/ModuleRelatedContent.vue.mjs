import { e as useI18n, f as useLocalePath, p as useRouter, u as useMainStore, i as __nuxt_component_0, d as __nuxt_component_1, _ as _export_sfc } from './server.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { l as limitTextBlocks } from './ModuleHeroSlider.vue.mjs';
import { defineComponent, ref, computed, watch, mergeProps, withCtx, unref, createBlock, openBlock, createCommentVNode, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderComponent, ssrRenderAttr } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ModuleRelatedContent",
  __ssrInlineRender: true,
  props: {
    // Daten-Array (z.B. data?.parentShow?.sets)
    items: {
      type: Array,
      default: () => []
    },
    // Inhaltstyp (sets, shows, persons, venues, words)
    type: {
      type: String,
      required: true,
      validator: (value) => {
        return [
          "sets",
          "shows",
          "words",
          "persons",
          "venues",
          "pool",
          "article",
          "primary",
          "secondary",
          "accent",
          "blue",
          "green",
          "yellow"
        ].includes(value);
      }
    },
    // Optionaler Titel
    title: {
      type: String,
      default: ""
    },
    // Anzahl der ANFÄNGLICH anzuzeigenden Items pro Reihe
    limit: {
      type: Number,
      default: 3
    },
    // Anzahl der Items pro Reihe (Standard: 3)
    itemsPerRow: {
      type: Number,
      default: 3
    },
    // Anzeige-Stil
    style: {
      type: String,
      default: "default"
    }
  },
  setup(__props) {
    const { locale } = useI18n();
    const localePath = useLocalePath();
    useRouter();
    const mainStore = useMainStore();
    const props = __props;
    const itemsPerPage = props.itemsPerRow || 3;
    const visibleItemCount = ref(props.limit || itemsPerPage);
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
      return typeClassMap[props.type] || "default";
    });
    const visibleItems = computed(() => {
      if (!props.items || !Array.isArray(props.items)) return [];
      return props.items.slice(0, visibleItemCount.value);
    });
    const hasMoreItems = computed(() => {
      return props.items && props.items.length > visibleItemCount.value;
    });
    const artworkUrls = ref(/* @__PURE__ */ new Map());
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
    function getItemImage(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
      if (!item) return (_b = (_a = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _a.fallbackSet) == null ? void 0 : _b.image;
      const itemType = (item == null ? void 0 : item._type) || "";
      let image = null;
      if ((item == null ? void 0 : item.image) && (item == null ? void 0 : item.image.asset)) {
        image = item == null ? void 0 : item.image;
      } else if ((item == null ? void 0 : item.mainImage) && (item == null ? void 0 : item.mainImage.asset)) {
        image = item == null ? void 0 : item.mainImage;
      } else {
        switch (itemType) {
          case "person":
            image = (_d = (_c = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _c.fallbackPerson) == null ? void 0 : _d.image;
            break;
          case "venue":
            image = (_f = (_e = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _e.fallbackVenue) == null ? void 0 : _f.image;
            break;
          case "show":
            image = (_h = (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _g.fallbackShow) == null ? void 0 : _h.image;
            break;
          case "set":
            if ((_k = (_j = (_i = item == null ? void 0 : item.parentShow) == null ? void 0 : _i.image) == null ? void 0 : _j.asset) == null ? void 0 : _k.url) {
              image = (_l = item == null ? void 0 : item.parentShow) == null ? void 0 : _l.image;
            } else {
              image = (_n = (_m = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _m.fallbackSet) == null ? void 0 : _n.image;
            }
            break;
          case "word":
          case "article":
            image = (_p = (_o = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _o.fallbackArticle) == null ? void 0 : _p.image;
            break;
          default:
            image = (_r = (_q = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _q.fallbackSet) == null ? void 0 : _r.image;
        }
      }
      return image;
    }
    function loadArtworkUrl(item) {
      if (!item) return;
      if (artworkUrls.value.has(item == null ? void 0 : item._id)) return;
      const url = getSoundcloudArtwork(item);
      artworkUrls.value.set(item == null ? void 0 : item._id, url);
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
    function getItemRoute(item) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      if (!item || !(item == null ? void 0 : item.slug)) return "/";
      switch (item == null ? void 0 : item._type) {
        case "person":
        case "venue":
          return localePath(`/pool/${(_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current}`);
        case "set":
          if ((_c = (_b = item == null ? void 0 : item.parentShow) == null ? void 0 : _b.slug) == null ? void 0 : _c.current) {
            return localePath(
              `/shows/${(_e = (_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.slug) == null ? void 0 : _e.current}/${(_f = item == null ? void 0 : item.slug) == null ? void 0 : _f.current}`
            );
          }
          return localePath(`/shows/${(_g = item == null ? void 0 : item.slug) == null ? void 0 : _g.current}`);
        case "article":
          return localePath(`/words/${(_h = item == null ? void 0 : item.slug) == null ? void 0 : _h.current}`);
        case "show":
          return localePath(`/shows/${(_i = item == null ? void 0 : item.slug) == null ? void 0 : _i.current}`);
        // Standard-Fallback
        default:
          return localePath(`/${item == null ? void 0 : item._type}/${(_j = item == null ? void 0 : item.slug) == null ? void 0 : _j.current}`);
      }
    }
    function getItemNonCityTags(item) {
      if (!(item == null ? void 0 : item.tags) || !Array.isArray(item == null ? void 0 : item.tags)) return [];
      return item == null ? void 0 : item.tags.filter((tag) => tag._type !== "tag.city");
    }
    watch(
      visibleItems,
      (newItems) => {
        if (props.type === "sets") {
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
      const _component_NuxtLink = __nuxt_component_0;
      const _component_RichText = __nuxt_component_1;
      if (__props.items && __props.items.length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["related-content", __props.type]
        }, _attrs))} data-v-4e51fc18>`);
        if (__props.title) {
          _push(`<h2 class="related-content__title" data-v-4e51fc18>${ssrInterpolate(__props.title)}</h2>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="related-content__grid" data-v-4e51fc18><!--[-->`);
        ssrRenderList(visibleItems.value, (item) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          _push(`<div class="${ssrRenderClass(`related-item related-item--${__props.style} ${typeClass.value}`)}" data-v-4e51fc18>`);
          if (item == null ? void 0 : item.slug) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "related-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N;
                if (_push2) {
                  if (__props.type === "sets") {
                    _push2(`<div class="related-item__image" data-v-4e51fc18${_scopeId}>`);
                    if ((item == null ? void 0 : item.image) && (item == null ? void 0 : item.image.asset) && (item == null ? void 0 : item.image.asset.url)) {
                      _push2(`<img${ssrRenderAttr("src", item == null ? void 0 : item.image.asset.url)}${ssrRenderAttr("alt", (item == null ? void 0 : item.title) || "")} loading="lazy" data-v-4e51fc18${_scopeId}>`);
                    } else if (item == null ? void 0 : item.soundcloud) {
                      _push2(`<div class="track-artwork" data-v-4e51fc18${_scopeId}>`);
                      if (artworkUrls.value.get(item == null ? void 0 : item._id)) {
                        _push2(`<img${ssrRenderAttr("src", artworkUrls.value.get(item == null ? void 0 : item._id))} alt="Track Artwork" class="track-image" data-v-4e51fc18${_scopeId}>`);
                      } else {
                        _push2(`<div class="track-artwork-placeholder" data-v-4e51fc18${_scopeId}></div>`);
                      }
                      _push2(`</div>`);
                    } else {
                      _push2(`<div class="image-placeholder" data-v-4e51fc18${_scopeId}>`);
                      if ((_e2 = (_d2 = (_c2 = (_b2 = (_a2 = unref(mainStore)) == null ? void 0 : _a2.siteFallbacks) == null ? void 0 : _b2.fallbackSet) == null ? void 0 : _c2.image) == null ? void 0 : _d2.asset) == null ? void 0 : _e2.url) {
                        _push2(`<img${ssrRenderAttr("src", (_j2 = (_i2 = (_h2 = (_g2 = (_f2 = unref(mainStore)) == null ? void 0 : _f2.siteFallbacks) == null ? void 0 : _g2.fallbackSet) == null ? void 0 : _h2.image) == null ? void 0 : _i2.asset) == null ? void 0 : _j2.url)} alt="Fallback Image" class="fallback-image" data-v-4e51fc18${_scopeId}>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div>`);
                    }
                    _push2(`</div>`);
                  } else {
                    _push2(`<div class="related-item__image" data-v-4e51fc18${_scopeId}>`);
                    if (getItemImage(item) && getItemImage(item).asset && getItemImage(item).asset.url) {
                      _push2(`<img${ssrRenderAttr("src", getItemImage(item).asset.url)}${ssrRenderAttr("alt", (item == null ? void 0 : item.title) || "")} data-v-4e51fc18${_scopeId}>`);
                    } else {
                      _push2(`<div class="image-placeholder" data-v-4e51fc18${_scopeId}>`);
                      if ((_o = (_n = (_m = (_l = (_k = unref(mainStore)) == null ? void 0 : _k.siteFallbacks) == null ? void 0 : _l.fallbackSet) == null ? void 0 : _m.image) == null ? void 0 : _n.asset) == null ? void 0 : _o.url) {
                        _push2(`<img${ssrRenderAttr("src", (_t = (_s = (_r = (_q = (_p = unref(mainStore)) == null ? void 0 : _p.siteFallbacks) == null ? void 0 : _q.fallbackSet) == null ? void 0 : _r.image) == null ? void 0 : _s.asset) == null ? void 0 : _t.url)} alt="Fallback Image" class="fallback-image" data-v-4e51fc18${_scopeId}>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div>`);
                    }
                    _push2(`</div>`);
                  }
                } else {
                  return [
                    __props.type === "sets" ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "related-item__image"
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
                        ((_y = (_x = (_w = (_v = (_u = unref(mainStore)) == null ? void 0 : _u.siteFallbacks) == null ? void 0 : _v.fallbackSet) == null ? void 0 : _w.image) == null ? void 0 : _x.asset) == null ? void 0 : _y.url) ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: (_D = (_C = (_B = (_A = (_z = unref(mainStore)) == null ? void 0 : _z.siteFallbacks) == null ? void 0 : _A.fallbackSet) == null ? void 0 : _B.image) == null ? void 0 : _C.asset) == null ? void 0 : _D.url,
                          alt: "Fallback Image",
                          class: "fallback-image"
                        }, null, 8, ["src"])) : createCommentVNode("", true)
                      ]))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "related-item__image"
                    }, [
                      getItemImage(item) && getItemImage(item).asset && getItemImage(item).asset.url ? (openBlock(), createBlock("img", {
                        key: 0,
                        src: getItemImage(item).asset.url,
                        alt: (item == null ? void 0 : item.title) || ""
                      }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "image-placeholder"
                      }, [
                        ((_I = (_H = (_G = (_F = (_E = unref(mainStore)) == null ? void 0 : _E.siteFallbacks) == null ? void 0 : _F.fallbackSet) == null ? void 0 : _G.image) == null ? void 0 : _H.asset) == null ? void 0 : _I.url) ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: (_N = (_M = (_L = (_K = (_J = unref(mainStore)) == null ? void 0 : _J.siteFallbacks) == null ? void 0 : _K.fallbackSet) == null ? void 0 : _L.image) == null ? void 0 : _M.asset) == null ? void 0 : _N.url,
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
          _push(`<div class="related-item__content" data-v-4e51fc18>`);
          if (__props.type !== "pool") {
            _push(`<section class="related-item__content__interactive" data-v-4e51fc18>`);
            if ((item == null ? void 0 : item.datetime) || (item == null ? void 0 : item.publishedAt) || (item == null ? void 0 : item._updatedAt) || (item == null ? void 0 : item._createdAt)) {
              _push(`<div class="related-item__date" data-v-4e51fc18>${ssrInterpolate(formatDate(
                (item == null ? void 0 : item.datetime) || (item == null ? void 0 : item.publishedAt) || (item == null ? void 0 : item._updatedAt) || (item == null ? void 0 : item._createdAt)
              ))}</div>`);
            } else {
              _push(`<!---->`);
            }
            if (__props.type === "sets" && (item == null ? void 0 : item.soundcloud)) {
              _push(`<button class="play-button" data-v-4e51fc18><span class="sr-only" data-v-4e51fc18>Play</span><svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-4e51fc18><path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" data-v-4e51fc18></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</section>`);
          } else {
            _push(`<!---->`);
          }
          if ((item == null ? void 0 : item.parentShow) && __props.type === "sets") {
            _push(`<div class="related-item__content__show" data-v-4e51fc18>`);
            if (((_b = (_a = item == null ? void 0 : item.parentShow) == null ? void 0 : _a.title) == null ? void 0 : _b.toLowerCase()) !== "no-show" && ((_c = item == null ? void 0 : item.parentShow) == null ? void 0 : _c.slug)) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: unref(localePath)(`/shows/${(_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.slug.current}`),
                class: "related-item__link"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  var _a2, _b2;
                  if (_push2) {
                    _push2(`<h3 class="related-item__title show-title" data-v-4e51fc18${_scopeId}>${ssrInterpolate((_a2 = item == null ? void 0 : item.parentShow) == null ? void 0 : _a2.title)}</h3>`);
                  } else {
                    return [
                      createVNode("h3", { class: "related-item__title show-title" }, toDisplayString((_b2 = item == null ? void 0 : item.parentShow) == null ? void 0 : _b2.title), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else if (((_f = (_e = item == null ? void 0 : item.parentShow) == null ? void 0 : _e.title) == null ? void 0 : _f.toLowerCase()) === "no-show" && (item == null ? void 0 : item.title)) {
              _push(`<h3 class="related-item__title show-title" data-v-4e51fc18>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`);
            } else if (item == null ? void 0 : item.title) {
              _push(`<h3 class="related-item__title show-title" data-v-4e51fc18>${ssrInterpolate(item == null ? void 0 : item.title)}</h3>`);
            } else {
              _push(`<!---->`);
            }
            if ((item == null ? void 0 : item.persons) && (item == null ? void 0 : item.persons.length) > 0) {
              _push(`<div class="show-artists" data-v-4e51fc18><!--[-->`);
              ssrRenderList(item == null ? void 0 : item.persons, (artist, index) => {
                var _a2, _b2;
                _push(`<h3 class="related-item__artist" data-v-4e51fc18>`);
                if (artist == null ? void 0 : artist.poolVisibility) {
                  _push(ssrRenderComponent(_component_NuxtLink, {
                    to: unref(localePath)(`/pool/${(_a2 = artist == null ? void 0 : artist.slug) == null ? void 0 : _a2.current}`),
                    class: "related-item__link"
                  }, {
                    default: withCtx((_, _push2, _parent2, _scopeId) => {
                      var _a3, _b3;
                      if (_push2) {
                        _push2(`${ssrInterpolate(artist == null ? void 0 : artist.title)}${ssrInterpolate(index < ((_a3 = item == null ? void 0 : item.persons) == null ? void 0 : _a3.length) - 1 ? "," : "")}  `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(artist == null ? void 0 : artist.title) + toDisplayString(index < ((_b3 = item == null ? void 0 : item.persons) == null ? void 0 : _b3.length) - 1 ? "," : "") + "  ", 1)
                        ];
                      }
                    }),
                    _: 2
                  }, _parent));
                } else {
                  _push(`<span data-v-4e51fc18>${ssrInterpolate(artist.title)}${ssrInterpolate(index < ((_b2 = item == null ? void 0 : item.persons) == null ? void 0 : _b2.length) - 1 ? "," : "")}  </span>`);
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
          if (__props.type !== "sets") {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getItemRoute(item),
              class: "related-item__link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<h3 class="related-item__title" data-v-4e51fc18${_scopeId}>${ssrInterpolate((item == null ? void 0 : item.title) || (item == null ? void 0 : item.name))}</h3>`);
                } else {
                  return [
                    createVNode("h3", { class: "related-item__title" }, toDisplayString((item == null ? void 0 : item.title) || (item == null ? void 0 : item.name)), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if ((item == null ? void 0 : item.useTeaserText) && (item == null ? void 0 : item.textTeaser)) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.textTeaser)
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.useTeaserText) && (item == null ? void 0 : item.text) && (item == null ? void 0 : item.text.length) > 0) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: (_g = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.text)) == null ? void 0 : _g.slice(0, 1)
            }, null, _parent));
          } else if (!(item == null ? void 0 : item.text) && (item == null ? void 0 : item.description) && (item == null ? void 0 : item.description.length) > 0 && (((_h = item == null ? void 0 : item.description[0]) == null ? void 0 : _h.value) || ((_i = item == null ? void 0 : item.description[1]) == null ? void 0 : _i.value))) {
            _push(ssrRenderComponent(_component_RichText, {
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))((_j = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(item == null ? void 0 : item.description)) == null ? void 0 : _j.slice(0, 1), 100)
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (getItemNonCityTags(item).length > 0) {
            _push(`<div class="related-item__tags tags" data-v-4e51fc18><!--[-->`);
            ssrRenderList(getItemNonCityTags(item), (tag) => {
              _push(`<button class="tag clickable" data-v-4e51fc18>${ssrInterpolate(tag.title)}</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
        if (hasMoreItems.value) {
          _push(`<div class="related-content__load-more" data-v-4e51fc18><button class="load-more-button" data-v-4e51fc18><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-4e51fc18><path d="M7.67578 0.541016V14.8113" stroke-width="5" data-v-4e51fc18></path><path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" data-v-4e51fc18></path></svg></button></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleRelatedContent.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_5 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-4e51fc18"]]), { __name: "ModuleRelatedContent" });

export { __nuxt_component_5 as _ };
