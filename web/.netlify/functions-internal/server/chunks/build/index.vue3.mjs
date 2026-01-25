import { _ as __nuxt_component_1, a as __nuxt_component_3, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { _ as __nuxt_component_2 } from './ModuleContentSlider.vue.mjs';
import { withAsyncContext, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, u as useMainStore, k as SHOWSARCHIVE_QUERY, g as groq, a as useHead } from './server.mjs';
import { u as useCachedSanityQuery, a as usePageSeo } from './usePageSeo.mjs';
import './parseI18nObj.mjs';
import 'embla-carousel-vue';
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

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    useMainStore();
    const query = groq`${SHOWSARCHIVE_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query)), __temp = await __temp, __restore(), __temp);
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    useHead({
      bodyAttrs: {
        class: `shows-archive`
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c;
      const _component_ModuleContentGrid = __nuxt_component_1;
      const _component_ModuleContentSlider = __nuxt_component_2;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "shows-archive" }, _attrs))} data-v-0a75d73b>`);
      if (((_a2 = unref(data)) == null ? void 0 : _a2.modules) && ((_c = (_b = unref(data)) == null ? void 0 : _b.modules) == null ? void 0 : _c.length) > 0) {
        _push(`<section class="module-section" data-v-0a75d73b><!--[-->`);
        ssrRenderList(unref(data).modules, (module) => {
          _push(`<div class="module" data-v-0a75d73b>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/shows/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0a75d73b"]]);

export { index as default };
