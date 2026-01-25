import { _ as __nuxt_component_1, a as __nuxt_component_3$1, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { _ as __nuxt_component_3 } from './ModuleContentTeaser.vue.mjs';
import { withAsyncContext, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, u as useMainStore, H as HOMEPAGE_QUERY, g as groq, a as useHead } from './server.mjs';
import { u as useCachedSanityQuery, a as usePageSeo } from './usePageSeo.mjs';
import './parseI18nObj.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    useMainStore();
    const query = groq`${HOMEPAGE_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query)), __temp = await __temp, __restore(), __temp);
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    useHead({
      bodyAttrs: {
        class: `words-archive`
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2;
      const _component_ModuleContentGrid = __nuxt_component_1;
      const _component_ModuleContentTeaser = __nuxt_component_3;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3$1;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "words-archive" }, _attrs))} data-v-796781f5>`);
      if (((_a2 = unref(data)) == null ? void 0 : _a2.modules) && unref(data).modules.length > 0) {
        _push(`<section class="module-section" data-v-796781f5><!--[-->`);
        ssrRenderList(unref(data).modules, (module) => {
          _push(`<div class="module" data-v-796781f5>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-796781f5"]]);

export { index as default };
