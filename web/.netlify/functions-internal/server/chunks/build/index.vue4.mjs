import { e as useI18n, f as useLocalePath, u as useMainStore, i as __nuxt_component_0$2, d as __nuxt_component_1, _ as _export_sfc, l as useSwipe, W as WORDS_QUERY, g as groq } from './server.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { l as limitTextBlocks, _ as __nuxt_component_1$1, a as __nuxt_component_3, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { defineComponent, computed, mergeProps, withCtx, createBlock, openBlock, createCommentVNode, toDisplayString, createTextVNode, unref, useSSRContext, ref, withAsyncContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { _ as __nuxt_component_2 } from './ModuleContentSlider.vue.mjs';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ModuleIntroArticle",
  __ssrInlineRender: true,
  props: {
    article: {}
  },
  setup(__props) {
    const { locale, setLocale } = useI18n();
    const localePath = useLocalePath();
    const props = __props;
    const mainStore = useMainStore();
    const useImageManagement = () => {
      function getItemImage2(item) {
        var _a, _b;
        if (!item) return null;
        if (item.image) {
          return item.image;
        }
        return (_b = (_a = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _a.fallbackArticle) == null ? void 0 : _b.image;
      }
      return {
        getItemImage: getItemImage2
      };
    };
    function getItemRoute(item) {
      var _a;
      if (!item || !(item == null ? void 0 : item.slug)) return "/";
      return localePath(`/words/${(_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current}`);
    }
    const { getItemImage } = useImageManagement();
    const articleImage = computed(() => {
      var _a;
      const image = getItemImage(props.article);
      return ((_a = image == null ? void 0 : image.asset) == null ? void 0 : _a.url) || "";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0$2;
      const _component_RichText = __nuxt_component_1;
      if (_ctx.article) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "article-content" }, _attrs))} data-v-cd7cd664><div class="article-container" data-v-cd7cd664><div class="article-media" data-v-cd7cd664>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: getItemRoute(_ctx.article),
          class: "grid-item__link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (articleImage.value) {
                _push2(`<img${ssrRenderAttr("src", articleImage.value)} alt="Article Image" class="article-image" loading="lazy" data-v-cd7cd664${_scopeId}>`);
              } else {
                _push2(`<div class="article-image-placeholder" data-v-cd7cd664${_scopeId}></div>`);
              }
            } else {
              return [
                articleImage.value ? (openBlock(), createBlock("img", {
                  key: 0,
                  src: articleImage.value,
                  alt: "Article Image",
                  class: "article-image",
                  loading: "lazy"
                }, null, 8, ["src"])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "article-image-placeholder"
                }))
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="article-info" data-v-cd7cd664><div class="article-info-container" data-v-cd7cd664><div class="article-header" data-v-cd7cd664><div class="article-title-container" data-v-cd7cd664>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: getItemRoute(_ctx.article),
          class: "article__link article-title"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            var _a2, _b2, _c2, _d2;
            if (_push2) {
              if ((_a2 = _ctx.article) == null ? void 0 : _a2.title) {
                _push2(`<h2 class="article-title" data-v-cd7cd664${_scopeId}>${ssrInterpolate((_b2 = _ctx.article) == null ? void 0 : _b2.title)}</h2>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                ((_c2 = _ctx.article) == null ? void 0 : _c2.title) ? (openBlock(), createBlock("h2", {
                  key: 0,
                  class: "article-title"
                }, toDisplayString((_d2 = _ctx.article) == null ? void 0 : _d2.title), 1)) : createCommentVNode("", true)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
        if (_ctx.article.useTeaserText) {
          _push(`<div class="article-teaser" data-v-cd7cd664><div class="tags read-more" data-v-cd7cd664>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: getItemRoute(_ctx.article),
            class: "tag"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Read More `);
              } else {
                return [
                  createTextVNode(" Read More ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
          if (_ctx.article.textTeaser) {
            _push(ssrRenderComponent(_component_RichText, {
              value: _ctx.article.textTeaser,
              class: "rich-text",
              blocks: ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(_ctx.article.textTeaser || [])
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else if (!_ctx.article.useTeaserText && _ctx.article.text) {
          _push(`<div class="article-teaser" data-v-cd7cd664><div class="tags read-more" data-v-cd7cd664>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: getItemRoute(_ctx.article),
            class: "tag"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Read More `);
              } else {
                return [
                  createTextVNode(" Read More ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
          if (_ctx.article.textTeaser) {
            _push(ssrRenderComponent(_component_RichText, {
              value: _ctx.article.textTeaser,
              class: "rich-text",
              blocks: ("limitTextBlocks" in _ctx ? _ctx.limitTextBlocks : unref(limitTextBlocks))(
                (_a = ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(_ctx.article.text || [])) == null ? void 0 : _a.slice(0, 1),
                100
              )
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_c = (_b = _ctx.article) == null ? void 0 : _b.tags) == null ? void 0 : _c.length) {
          _push(`<div class="article-tags tags" data-v-cd7cd664><!--[-->`);
          ssrRenderList((_d = _ctx.article) == null ? void 0 : _d.tags.slice(0, 3), (tag) => {
            var _a2, _b2, _c2;
            _push(`<button class="tag" type="button" data-v-cd7cd664>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
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

const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleIntroArticle.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-cd7cd664"]]), { __name: "ModuleIntroArticle" });

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ModuleIntroArticleSlider",
  __ssrInlineRender: true,
  props: {
    articles: {
      type: Array,
      required: true
    }
  },
  setup(__props) {
    useMainStore();
    const props = __props;
    const currentIndex = ref(0);
    const sliderRef = ref(null);
    const slides = computed(() => {
      return props.articles.map((article) => [article]);
    });
    const scrollNext = () => {
      currentIndex.value = (currentIndex.value + 1) % slides.value.length;
    };
    const scrollPrev = () => {
      currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length;
    };
    useSwipe(sliderRef, {
      onSwipeEnd(e, direction2) {
        if (direction2 === "left") scrollNext();
        if (direction2 === "right") scrollPrev();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ModuleIntroArticle = __nuxt_component_0$1;
      if (slides.value.length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: `intro-article-slider intro-article-slider--default` }, _attrs))} data-v-b8ad3bc5><div class="slider__nav__container" data-v-b8ad3bc5>`);
        if (slides.value.length > 1) {
          _push(`<nav class="slider__nav" data-v-b8ad3bc5><button class="slider__arrow slider__arrow--prev" aria-label="Vorheriger Slide" data-v-b8ad3bc5><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-b8ad3bc5><path d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z" fill="black" data-v-b8ad3bc5></path></svg></button><div class="slider__nav__dots" data-v-b8ad3bc5><!--[-->`);
          ssrRenderList(slides.value, (_, index) => {
            _push(`<button class="${ssrRenderClass(["slider__dot", { "is-selected": index === currentIndex.value }])}" data-v-b8ad3bc5></button>`);
          });
          _push(`<!--]--></div><button class="slider__arrow slider__arrow--next" aria-label="Nächster Slide" data-v-b8ad3bc5><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-b8ad3bc5><path d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z" fill="black" data-v-b8ad3bc5></path></svg></button></nav>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="slider-content" data-v-b8ad3bc5><!--[-->`);
        ssrRenderList(slides.value, (articleGroup, index) => {
          _push(`<div class="${ssrRenderClass([{ active: index === currentIndex.value }, "slide"])}" data-v-b8ad3bc5><div class="article-group" data-v-b8ad3bc5><!--[-->`);
          ssrRenderList(articleGroup, (article, articleIndex) => {
            _push(ssrRenderComponent(_component_ModuleIntroArticle, {
              key: article._key || articleIndex,
              article,
              class: `slider-item slider-item--default`
            }, null, _parent));
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleIntroArticleSlider.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-b8ad3bc5"]]), { __name: "ModuleIntroArticleSlider" });

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a, _b, _c;
    let __temp, __restore;
    useMainStore();
    const query = groq`${WORDS_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query)), __temp = await __temp, __restore(), __temp);
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    console.log((_c = (_b = data == null ? void 0 : data.value) == null ? void 0 : _b.slider) == null ? void 0 : _c.articles);
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b2, _c2, _d, _e, _f;
      const _component_ModuleIntroArticleSlider = __nuxt_component_0;
      const _component_ModuleContentGrid = __nuxt_component_1$1;
      const _component_ModuleContentSlider = __nuxt_component_2;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "words" }, _attrs))} data-v-43600ed9><section class="intro-section" data-v-43600ed9>`);
      _push(ssrRenderComponent(_component_ModuleIntroArticleSlider, {
        articles: (_e = (_b2 = (_a2 = unref(data)) == null ? void 0 : _a2.slider) == null ? void 0 : _b2.articles) == null ? void 0 : _e.slice(0, ((_d = (_c2 = unref(data)) == null ? void 0 : _c2.slider) == null ? void 0 : _d.count) * 2),
        title: "Featured Articles"
      }, null, _parent));
      _push(`</section>`);
      if (((_f = unref(data)) == null ? void 0 : _f.modules) && unref(data).modules.length > 0) {
        _push(`<section class="module-section" data-v-43600ed9><!--[-->`);
        ssrRenderList(unref(data).modules, (module) => {
          _push(`<div class="module" data-v-43600ed9>`);
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
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/words/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-43600ed9"]]);

export { index as default };
