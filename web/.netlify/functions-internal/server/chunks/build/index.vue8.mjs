import { e as useI18n, f as useLocalePath, u as useMainStore, i as __nuxt_component_0$1, d as __nuxt_component_1, _ as _export_sfc, b as useRoute, v as SET_QUERY, g as groq } from './server.mjs';
import { f as formatDate, _ as __nuxt_component_1$1, a as __nuxt_component_3, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, unref, createBlock, openBlock, createCommentVNode, toDisplayString, createTextVNode, useSSRContext, withAsyncContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
import { _ as __nuxt_component_2 } from './ModuleContentSlider.vue.mjs';
import { _ as __nuxt_component_5 } from './ModuleRelatedContent.vue.mjs';
import { u as useCachedSanityQuery, a as usePageSeo } from './usePageSeo.mjs';
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
  __name: "ModuleIntroSetDetailPage",
  __ssrInlineRender: true,
  props: {
    set: {}
  },
  setup(__props) {
    const { locale, setLocale } = useI18n();
    const localePath = useLocalePath();
    const setContentRef = ref(null);
    ref(null);
    const setMainHeight = ref(0);
    const windowWidth = ref(0);
    const props = __props;
    const mainStore = useMainStore();
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
              `/shows/${(_e = (_d = item.parentShow) == null ? void 0 : _d.slug) == null ? void 0 : _e.current}/${(_f = item == null ? void 0 : item.slug) == null ? void 0 : _f.current}`
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
    const useSoundCloud = () => {
      const artworkUrl2 = ref("");
      function getSoundcloudArtwork(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        if (!item) return "";
        const artworkUrl3 = (_c = (_b = (_a = item == null ? void 0 : item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0]) == null ? void 0 : _c.artwork_url;
        if (artworkUrl3) {
          return artworkUrl3.replace("-large", "-t500x500");
        }
        const parentShowImageUrl = (_f = (_e = (_d = item == null ? void 0 : item.parentShow) == null ? void 0 : _d.image) == null ? void 0 : _e.asset) == null ? void 0 : _f.url;
        const storeFallbackUrl = (_j = (_i = (_h = (_g = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _g.fallbackSet) == null ? void 0 : _h.image) == null ? void 0 : _i.asset) == null ? void 0 : _j.url;
        return parentShowImageUrl || storeFallbackUrl || "";
      }
      function loadArtworkUrl2() {
        if (!props.set) return;
        const url = getSoundcloudArtwork(props.set);
        artworkUrl2.value = url;
      }
      function playTrack2() {
        var _a, _b;
        const item = props.set;
        if (!((_b = (_a = item == null ? void 0 : item.soundcloud) == null ? void 0 : _a.tracks) == null ? void 0 : _b[0])) return;
        const track = item.soundcloud.tracks[0];
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
    const computedSetMainHeight = computed(() => {
      if (windowWidth.value <= 900) {
        return "100%";
      }
      return setMainHeight.value;
    });
    const { artworkUrl, loadArtworkUrl } = useSoundCloud();
    function getItemNonCityTags(item) {
      if (!(item == null ? void 0 : item.tags) || !Array.isArray(item == null ? void 0 : item.tags)) return [];
      return item == null ? void 0 : item.tags.filter((tag) => tag._type !== "tag.city");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_RichText = __nuxt_component_1;
      if (_ctx.set) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "set-content",
          ref_key: "setContentRef",
          ref: setContentRef
        }, _attrs))} data-v-ea61bab9><div class="set-main" data-v-ea61bab9><div class="set-media" data-v-ea61bab9>`);
        if (_ctx.set) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: getItemRoute(_ctx.set),
            class: "grid-item__link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (unref(artworkUrl)) {
                  _push2(`<img${ssrRenderAttr("src", unref(artworkUrl))} alt="Audio Artwork" class="set-image track-artwork" loading="lazy" data-v-ea61bab9${_scopeId}>`);
                } else {
                  _push2(`<div class="track-artwork-placeholder" data-v-ea61bab9${_scopeId}></div>`);
                }
              } else {
                return [
                  unref(artworkUrl) ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: unref(artworkUrl),
                    alt: "Audio Artwork",
                    class: "set-image track-artwork",
                    loading: "lazy"
                  }, null, 8, ["src"])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "track-artwork-placeholder",
                    onVnodeMounted: unref(loadArtworkUrl)
                  }, null, 8, ["onVnodeMounted"]))
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="set-info" data-v-ea61bab9><button class="play-button" aria-label="Play Audio" type="button" data-v-ea61bab9><svg width="16" height="18" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-ea61bab9><path d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z" fill="currentColor" data-v-ea61bab9></path></svg></button><div class="set-info-container" data-v-ea61bab9><div class="set-header" data-v-ea61bab9><div class="set-meta" data-v-ea61bab9>`);
        if ((_a = _ctx.set) == null ? void 0 : _a.datetime) {
          _push(`<h3 class="set-date" data-v-ea61bab9>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(_ctx.set.datetime))}</h3>`);
        } else if ((_b = _ctx.set) == null ? void 0 : _b._updatedAt) {
          _push(`<h3 class="set-date" data-v-ea61bab9>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(_ctx.set._updatedAt))}</h3>`);
        } else if ((_c = _ctx.set) == null ? void 0 : _c.title) {
          _push(`<h3 class="set-date" data-v-ea61bab9>${ssrInterpolate(_ctx.set.title)}</h3>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="set-show-title" data-v-ea61bab9>`);
        if (((_e = (_d = _ctx.set) == null ? void 0 : _d.parentShow) == null ? void 0 : _e.title) !== "No Show" && ((_f = _ctx.set) == null ? void 0 : _f.parentShow)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: unref(localePath)(`/shows/${(_i = (_h = (_g = _ctx.set) == null ? void 0 : _g.parentShow) == null ? void 0 : _h.slug) == null ? void 0 : _i.current}`),
            class: "set__link set-title"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2;
              if (_push2) {
                if ((_b2 = (_a2 = _ctx.set) == null ? void 0 : _a2.parentShow) == null ? void 0 : _b2.title) {
                  _push2(`<h2 class="set-title" data-v-ea61bab9${_scopeId}>${ssrInterpolate((_d2 = (_c2 = _ctx.set) == null ? void 0 : _c2.parentShow) == null ? void 0 : _d2.title)}</h2>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  ((_f2 = (_e2 = _ctx.set) == null ? void 0 : _e2.parentShow) == null ? void 0 : _f2.title) ? (openBlock(), createBlock("h2", {
                    key: 0,
                    class: "set-title"
                  }, toDisplayString((_h2 = (_g2 = _ctx.set) == null ? void 0 : _g2.parentShow) == null ? void 0 : _h2.title), 1)) : createCommentVNode("", true)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div data-v-ea61bab9><!--[-->`);
        ssrRenderList(_ctx.set.persons, (artist, index) => {
          _push(`<h3 class="set__artist" data-v-ea61bab9>`);
          if (artist == null ? void 0 : artist.poolVisibility) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: unref(localePath)(`/pool/${artist == null ? void 0 : artist.slug.current}`),
              class: "set__artist"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(artist.title)}${ssrInterpolate(index < _ctx.set.persons.length - 1 ? "," : "")}  `);
                } else {
                  return [
                    createTextVNode(toDisplayString(artist.title) + toDisplayString(index < _ctx.set.persons.length - 1 ? "," : "") + "  ", 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<span class="set__artist" data-v-ea61bab9>${ssrInterpolate(artist.title)}${ssrInterpolate(index < _ctx.set.persons.length - 1 ? "," : "")}  </span>`);
          }
          _push(`</h3>`);
        });
        _push(`<!--]--></div></div></div>`);
        if (getItemNonCityTags(_ctx.set).length > 0) {
          _push(`<div class="set-tags tags" data-v-ea61bab9><!--[-->`);
          ssrRenderList(getItemNonCityTags(_ctx.set), (tag, index) => {
            var _a2, _b2, _c2;
            _push(`<button class="tag" type="button" data-v-ea61bab9>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="set-details" style="${ssrRenderStyle(` max-height: ${computedSetMainHeight.value}px; height: ${computedSetMainHeight.value}px`)}" data-v-ea61bab9>`);
        if ((_k = (_j = _ctx.set) == null ? void 0 : _j.parentShow) == null ? void 0 : _k.content) {
          _push(`<section data-v-ea61bab9><h2 data-v-ea61bab9>${ssrInterpolate((_m = (_l = _ctx.set) == null ? void 0 : _l.parentShow) == null ? void 0 : _m.title)}</h2>`);
          _push(ssrRenderComponent(_component_RichText, {
            blocks: (_o = (_n = _ctx.set) == null ? void 0 : _n.parentShow) == null ? void 0 : _o.content
          }, null, _parent));
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_p = _ctx.set) == null ? void 0 : _p.content) {
          _push(`<section data-v-ea61bab9><h3 data-v-ea61bab9>About this Episode</h3>`);
          _push(ssrRenderComponent(_component_RichText, {
            blocks: (_q = _ctx.set) == null ? void 0 : _q.content
          }, null, _parent));
          _push(`</section>`);
        } else {
          _push(`<section data-v-ea61bab9>`);
          _push(ssrRenderComponent(_component_RichText, {
            blocks: (_t = (_s = (_r = unref(mainStore)) == null ? void 0 : _r.siteFallbacks) == null ? void 0 : _s.fallbackSet) == null ? void 0 : _t.description
          }, null, _parent));
          _push(`</section>`);
        }
        if ((_u = _ctx.set) == null ? void 0 : _u.tracklistRich) {
          _push(`<section class="tracklist" data-v-ea61bab9><h3 data-v-ea61bab9>Tracklist</h3>`);
          _push(ssrRenderComponent(_component_RichText, {
            class: "tracklist-rich",
            blocks: (_v = _ctx.set) == null ? void 0 : _v.tracklistRich
          }, null, _parent));
          _push(`</section>`);
        } else if ((_w = _ctx.set) == null ? void 0 : _w.tracklist) {
          _push(`<section class="tracklist" data-v-ea61bab9><h3 data-v-ea61bab9>Tracklist</h3><div class="rich-text" data-v-ea61bab9><!--[-->`);
          ssrRenderList((_x = _ctx.set) == null ? void 0 : _x.tracklist, (track) => {
            _push(`<p data-v-ea61bab9>${ssrInterpolate(track)}</p>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleIntroSetDetailPage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-ea61bab9"]]), { __name: "ModuleIntroSetDetailPage" });

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    useMainStore();
    const route = useRoute();
    const query = groq`${SET_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query, {
      slug: route.params.set
    })), __temp = await __temp, __restore(), __temp);
    if (!data.value) {
      console.error("Set nicht gefunden:", route.params.set);
    }
    const relatedSets = computed(() => {
      var _a2, _b, _c, _d;
      if (!((_b = (_a2 = data.value) == null ? void 0 : _a2.parentShow) == null ? void 0 : _b.sets) || !Array.isArray((_c = data.value.parentShow) == null ? void 0 : _c.sets)) {
        return [];
      }
      return (_d = data.value.parentShow) == null ? void 0 : _d.sets.filter((set) => {
        return set.slug.current !== route.params.set;
      });
    });
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const _component_ModuleIntroSetDetailPage = __nuxt_component_0;
      const _component_ModuleContentGrid = __nuxt_component_1$1;
      const _component_ModuleContentSlider = __nuxt_component_2;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      const _component_ModuleRelatedContent = __nuxt_component_5;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "set-detail",
        ref: "setDetailRef"
      }, _attrs))} data-v-3aa05343>`);
      if (unref(data)) {
        _push(`<section class="set-detail__intro-section" data-v-3aa05343>`);
        _push(ssrRenderComponent(_component_ModuleIntroSetDetailPage, {
          set: unref(data),
          title: (_a2 = unref(data)) == null ? void 0 : _a2.title
        }, null, _parent));
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      if (((_b = unref(data)) == null ? void 0 : _b.modules) && ((_c = unref(data)) == null ? void 0 : _c.modules.length) > 0) {
        _push(`<section class="module-section" data-v-3aa05343><!--[-->`);
        ssrRenderList(unref(data).modules, (module) => {
          _push(`<div class="module" data-v-3aa05343>`);
          if (module._type == "module.contentReferenceGrid") {
            _push(ssrRenderComponent(_component_ModuleContentGrid, { module }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (module._type == "module.contentReferenceSlider") {
            _push(ssrRenderComponent(_component_ModuleContentSlider, { module }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (module._type == "module.heroEntry") {
            _push(ssrRenderComponent(_component_ModuleHeroEntrySolo, { module }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (module._type == "module.heroSlider") {
            _push(ssrRenderComponent(_component_ModuleHeroSlider, { module }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></section>`);
      } else {
        _push(`<!---->`);
      }
      if (((_d = unref(data)) == null ? void 0 : _d.relatedContent.length) > 0) {
        _push(`<section class="set-detail__related-content" data-v-3aa05343><h3 data-v-3aa05343>Related</h3>`);
        if (((_e = unref(data)) == null ? void 0 : _e.relatedContent.length) > 0) {
          _push(ssrRenderComponent(_component_ModuleRelatedContent, {
            items: (_f = unref(data)) == null ? void 0 : _f.relatedContent,
            type: "sets",
            title: "",
            limit: 6
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(relatedSets).length > 0) {
        _push(`<section class="set-detail__more-content" data-v-3aa05343>`);
        if (((_h = (_g = unref(data)) == null ? void 0 : _g.parentShow) == null ? void 0 : _h.title) === "No Show") {
          _push(`<h3 data-v-3aa05343>Similar Sets</h3>`);
        } else {
          _push(`<h3 data-v-3aa05343> More Episodes of <span data-v-3aa05343>${ssrInterpolate((_j = (_i = unref(data)) == null ? void 0 : _i.parentShow) == null ? void 0 : _j.title)}</span></h3>`);
        }
        if (unref(relatedSets).length > 0) {
          _push(ssrRenderComponent(_component_ModuleRelatedContent, {
            items: unref(relatedSets),
            type: "sets",
            title: "",
            limit: 6
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/shows/[slug]/[set]/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3aa05343"]]);

export { index as default };
