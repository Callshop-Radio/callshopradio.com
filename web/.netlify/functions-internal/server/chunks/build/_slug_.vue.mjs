import { S as SLUG_PAGE_QUERY, g as groq, b as useRoute, c as createError, a as useHead, d as __nuxt_component_1 } from './server.mjs';
import { _ as __nuxt_component_1$1, a as __nuxt_component_3$1, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { _ as __nuxt_component_3 } from './ModuleContentTeaser.vue.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { withAsyncContext, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
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

const _sfc_main = {
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const query = groq`${SLUG_PAGE_QUERY}`;
    const route = useRoute();
    const { data } = ([__temp, __restore] = withAsyncContext(() => {
      var _a2;
      return useCachedSanityQuery(query, { slug: (_a2 = route == null ? void 0 : route.params) == null ? void 0 : _a2.slug });
    }), __temp = await __temp, __restore(), __temp);
    if (!(data == null ? void 0 : data.value)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Page Not Found"
      });
    }
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    useHead({
      bodyAttrs: {
        class: `page--default`
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b;
      const _component_RichText = __nuxt_component_1;
      const _component_ModuleContentGrid = __nuxt_component_1$1;
      const _component_ModuleContentTeaser = __nuxt_component_3;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3$1;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "default" }, _attrs))}>`);
      if (unref(data)) {
        _push(`<section class="default__content">`);
        _push(ssrRenderComponent(_component_RichText, {
          blocks: ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))((_a2 = unref(data)) == null ? void 0 : _a2.content)
        }, null, _parent));
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      if (((_b = unref(data)) == null ? void 0 : _b.modules) && unref(data).modules.length > 0) {
        _push(`<section class="default__module-section"><!--[-->`);
        ssrRenderList(unref(data).modules, (module) => {
          _push(`<div class="module">`);
          if (module._type == "module.contentReferenceGrid") {
            _push(ssrRenderComponent(_component_ModuleContentGrid, { module }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          if (module._type == "module.contentReferenceSlider") {
            _push(ssrRenderComponent(_component_ModuleContentTeaser, { module }, null, _parent));
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
