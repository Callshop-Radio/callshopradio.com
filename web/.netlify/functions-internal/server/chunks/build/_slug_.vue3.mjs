import { e as useI18n, f as useLocalePath, u as useMainStore, i as __nuxt_component_0$1, d as __nuxt_component_1, o as navigateTo, _ as _export_sfc, b as useRoute, E as ENTRY_QUERY, g as groq, a as useHead } from './server.mjs';
import { p as parseI18nObj } from './parseI18nObj.mjs';
import { f as formatDate, _ as __nuxt_component_1$1, a as __nuxt_component_3$1, b as __nuxt_component_4 } from './ModuleHeroSlider.vue.mjs';
import { defineComponent, computed, ref, watch, unref, withCtx, createTextVNode, toDisplayString, useSSRContext, withAsyncContext, mergeProps } from 'vue';
import { ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderAttrs } from 'vue/server-renderer';
import { _ as __nuxt_component_5 } from './ModuleRelatedContent.vue.mjs';
import { _ as __nuxt_component_3 } from './ModuleContentTeaser.vue.mjs';
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
  __name: "ModuleIntroArticleDetailPage",
  __ssrInlineRender: true,
  props: {
    article: {}
  },
  setup(__props) {
    const { locale, setLocale } = useI18n();
    const localePath = useLocalePath();
    const mainStore = useMainStore();
    const props = __props;
    const useImageManagement = () => {
      function getItemImage2(item) {
        var _a, _b;
        if (!item) return null;
        if (item.image || item.mainImage) {
          return item.image || item.mainImage || null;
        }
        return (_b = (_a = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _a.fallbackArticle) == null ? void 0 : _b.image;
      }
      function checkImage(url) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      }
      return {
        getItemImage: getItemImage2,
        checkImage
      };
    };
    const useArticle = () => {
      const articleImageUrl2 = ref("");
      const { getItemImage: getItemImage2 } = useImageManagement();
      async function getArticleImage(item) {
        var _a, _b, _c, _d, _e;
        if (!item) return "";
        const itemImage = getItemImage2(item);
        if ((_a = itemImage == null ? void 0 : itemImage.asset) == null ? void 0 : _a.url) {
          return itemImage.asset.url;
        }
        const storeFallbackUrl = (_e = (_d = (_c = (_b = mainStore == null ? void 0 : mainStore.siteFallbacks) == null ? void 0 : _b.fallbackArticle) == null ? void 0 : _c.image) == null ? void 0 : _d.asset) == null ? void 0 : _e.url;
        if (storeFallbackUrl) {
          return storeFallbackUrl;
        }
        return "";
      }
      async function loadArticleImageUrl2() {
        if (!props.article) return;
        try {
          const url = await getArticleImage(props.article);
          articleImageUrl2.value = url;
        } catch (error) {
          console.error("Fehler beim Laden des Artikel-Bildes:", error);
        }
      }
      function navigateToArticle2() {
        var _a;
        const item = props.article;
        if (!((_a = item == null ? void 0 : item.slug) == null ? void 0 : _a.current)) return;
        navigateTo(localePath(`/words/${item.slug.current}`));
      }
      return {
        articleImageUrl: articleImageUrl2,
        loadArticleImageUrl: loadArticleImageUrl2,
        navigateToArticle: navigateToArticle2
      };
    };
    const { articleImageUrl } = useArticle();
    const cityTags = computed(() => {
      var _a, _b;
      return ((_b = (_a = props.article) == null ? void 0 : _a.tags) == null ? void 0 : _b.filter((tag) => tag._type === "tag.city")) || [];
    });
    const otherTags = computed(() => {
      var _a, _b;
      return ((_b = (_a = props.article) == null ? void 0 : _a.tags) == null ? void 0 : _b.filter((tag) => tag._type !== "tag.city")) || [];
    });
    const articleLocale = ref(locale.value);
    watch(locale, (newVal) => {
      articleLocale.value = newVal;
    });
    const availableLocales = computed(() => {
      var _a;
      if (Array.isArray((_a = props.article) == null ? void 0 : _a.text)) {
        return props.article.text.map((t) => t._key);
      }
      return [];
    });
    const currentArticleText = computed(() => {
      var _a, _b;
      if (!((_a = props.article) == null ? void 0 : _a.text) || !Array.isArray(props.article.text)) return null;
      return (_b = props.article.text.find((t) => t._key === articleLocale.value)) == null ? void 0 : _b.value;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_RichText = __nuxt_component_1;
      _push(`<!--[--><div class="article-media" data-v-2645f068>`);
      if (unref(articleImageUrl)) {
        _push(`<img${ssrRenderAttr("src", unref(articleImageUrl))}${ssrRenderAttr("alt", _ctx.article.title || "Article Image")} class="article-image" loading="lazy" data-v-2645f068>`);
      } else {
        _push(`<!---->`);
      }
      if (cityTags.value.length) {
        _push(`<div class="article-category tags" data-v-2645f068><!--[-->`);
        ssrRenderList(cityTags.value, (tag, index) => {
          var _a2, _b2, _c2;
          _push(`<button class="tag" type="button" data-v-2645f068>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="article-image-placeholder" data-v-2645f068></div>`);
      }
      _push(`<div class="article-tags" data-v-2645f068><div class="article-socials tags" data-v-2645f068>`);
      if ((_b = (_a = _ctx.article) == null ? void 0 : _a.socials) == null ? void 0 : _b.instagram) {
        _push(`<a${ssrRenderAttr("href", (_d = (_c = _ctx.article) == null ? void 0 : _c.socials) == null ? void 0 : _d.instagram)} target="_blank" rel="noopener noreferrer" aria-label="Instagram" data-v-2645f068><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-2645f068><circle cx="11.1062" cy="11.4773" r="9.56522" fill="white" data-v-2645f068></circle><path d="M14.2793 5.85352H7.7223C6.67571 5.85352 5.82422 6.70501 5.82422 7.7516V14.3086C5.82422 15.3552 6.67571 16.2069 7.7223 16.2069H14.2793C15.3259 16.2069 16.1776 15.3554 16.1776 14.3086V7.7516C16.1776 6.70501 15.3261 5.85352 14.2793 5.85352ZM11.0008 14.4385C9.1216 14.4385 7.59264 12.9096 7.59264 11.0301C7.59264 9.15089 9.1216 7.62194 11.0008 7.62194C12.8803 7.62194 14.4092 9.15089 14.4092 11.0301C14.4092 12.9093 12.88 14.4385 11.0008 14.4385ZM14.5188 8.32661C14.0739 8.32661 13.7121 7.96484 13.7121 7.52022C13.7121 7.0756 14.0739 6.71383 14.5188 6.71383C14.9634 6.71383 15.3252 7.0756 15.3252 7.52022C15.3252 7.96484 14.9634 8.32661 14.5188 8.32661Z" fill="#2C2C2C" data-v-2645f068></path><path d="M10.9994 9.0625C9.9146 9.0625 9.03125 9.94536 9.03125 11.0302C9.03125 12.1155 9.9146 12.9986 10.9994 12.9986C12.0847 12.9986 12.9674 12.1155 12.9674 11.0302C12.9674 9.94561 12.0845 9.0625 10.9994 9.0625Z" fill="#2C2C2C" data-v-2645f068></path><path d="M11 0C4.92511 0 0 4.92511 0 11C0 17.0749 4.92511 22 11 22C17.0749 22 22 17.0749 22 11C22 4.92511 17.0749 0 11 0ZM17.6168 14.3082C17.6168 16.1491 16.1195 17.6465 14.2785 17.6465H7.7215C5.88077 17.6465 4.38319 16.1491 4.38319 14.3082V7.75115C4.38319 5.91043 5.88077 4.41284 7.7215 4.41284H14.2785C16.1195 4.41284 17.6168 5.91043 17.6168 7.75115V14.3082Z" fill="#2C2C2C" data-v-2645f068></path></svg></a>`);
      } else {
        _push(`<!---->`);
      }
      if ((_f = (_e = _ctx.article) == null ? void 0 : _e.socials) == null ? void 0 : _f.soundcloud) {
        _push(`<a${ssrRenderAttr("href", (_h = (_g = _ctx.article) == null ? void 0 : _g.socials) == null ? void 0 : _h.soundcloud)} target="_blank" rel="noopener noreferrer" aria-label="Soundcloud" data-v-2645f068><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-2645f068><path d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22Z" fill="#2C2C2C" data-v-2645f068></path><path d="M3.27518 13.4965C3.26989 13.5322 3.24439 13.5577 3.21126 13.5577C3.17812 13.5577 3.15263 13.5322 3.14753 13.4957L3.03125 12.6255L3.14753 11.7408C3.15243 11.7039 3.17792 11.6784 3.21126 11.6784C3.2442 11.6784 3.26969 11.7039 3.27518 11.7408L3.41362 12.6265L3.27518 13.4965ZM3.86755 14.0252C3.86206 14.063 3.83461 14.0895 3.80069 14.0895C3.76775 14.0895 3.73892 14.063 3.73441 14.0252L3.57794 12.6253L3.73441 11.1941C3.73912 11.1572 3.76775 11.1298 3.80069 11.1298C3.83461 11.1298 3.86206 11.1566 3.86755 11.1941L4.0456 12.6253L3.86755 14.0252ZM4.50679 14.2622C4.50228 14.3077 4.46816 14.3401 4.42718 14.3401C4.38483 14.3401 4.3513 14.3077 4.34718 14.2622L4.19874 12.6265L4.34718 10.9286C4.3509 10.8825 4.38483 10.8496 4.42718 10.8496C4.46816 10.8496 4.50209 10.8825 4.50679 10.9286L4.67523 12.6265L4.50679 14.2622ZM5.15231 14.3142C5.1476 14.3664 5.10681 14.4058 5.05838 14.4058C5.00877 14.4058 4.96818 14.3664 4.96406 14.3142L4.82386 12.6265L4.96406 10.8819C4.96818 10.8294 5.00877 10.79 5.05838 10.79C5.10681 10.79 5.1476 10.8294 5.15231 10.8819L5.31133 12.6265L5.15231 14.3142ZM5.80135 14.3277C5.79801 14.3883 5.75076 14.4332 5.69487 14.4332C5.63722 14.4332 5.59154 14.3883 5.58762 14.3277L5.45506 12.6263L5.58762 11.0078C5.59173 10.9476 5.63722 10.9027 5.69487 10.9027C5.75174 10.9027 5.79801 10.9476 5.80135 11.007L5.95155 12.6263L5.80135 14.3277ZM6.45667 14.3287V14.3277C6.45274 14.3948 6.3996 14.4477 6.33568 14.4477C6.27156 14.4477 6.21842 14.3946 6.2147 14.3287L6.09097 12.6273L6.2147 9.99405C6.21842 9.92699 6.27156 9.87405 6.33568 9.87405C6.3998 9.87405 6.45294 9.92719 6.45667 9.99307L6.59687 12.6273L6.45667 14.3287ZM7.10708 14.3277V14.3268C7.10316 14.4009 7.04453 14.4599 6.97198 14.4599C6.9008 14.4599 6.84197 14.4009 6.83844 14.3268L6.72158 12.6363L6.83844 9.4007C6.84197 9.32658 6.9008 9.26795 6.97198 9.26795C7.04453 9.26795 7.10316 9.32658 7.10708 9.4007L7.23865 12.6363L7.10708 14.3277ZM7.78181 14.3017V14.3007C7.77887 14.3832 7.71396 14.4473 7.63416 14.4473C7.55435 14.4473 7.48945 14.3832 7.48651 14.3017L7.37807 12.6285C7.37807 12.6285 7.48651 9.12324 7.48651 9.12226C7.48964 9.04068 7.55435 8.97539 7.63416 8.97539C7.71396 8.97539 7.77907 9.04068 7.78181 9.12226L7.90436 12.6285L7.78181 14.3017ZM8.45262 14.2905C8.44948 14.3803 8.37909 14.4507 8.29144 14.4507C8.20359 14.4507 8.1332 14.3803 8.13006 14.2913L8.02888 12.6281L8.13006 9.0048C8.1332 8.9146 8.20359 8.8444 8.29144 8.8444C8.37909 8.8444 8.44968 8.9146 8.45262 9.0048L8.56498 12.6281L8.45262 14.2905ZM9.12774 14.2758V14.2748C9.1246 14.3719 9.04872 14.4489 8.95244 14.4489C8.85753 14.4489 8.78008 14.3719 8.77832 14.2758L8.68537 12.6285L8.77734 9.09775C8.78008 8.99931 8.85734 8.92323 8.95244 8.92323C9.04872 8.92323 9.1246 8.99931 9.12774 9.09775L9.23206 12.6285L9.12774 14.2758ZM9.80835 14.266V14.2646C9.80678 14.3703 9.72325 14.4517 9.62011 14.4517C9.51619 14.4517 9.43383 14.3703 9.43069 14.266L9.34677 12.6283L9.43089 9.22677C9.43403 9.12128 9.51638 9.03872 9.62031 9.03872C9.72345 9.03872 9.80698 9.12128 9.80855 9.22677L9.90365 12.6292L9.80835 14.266ZM10.5027 14.0932L10.4943 14.2536C10.4933 14.3095 10.4697 14.3601 10.4339 14.3966C10.397 14.4324 10.3464 14.4554 10.2929 14.4554C10.2305 14.4554 10.1756 14.4268 10.138 14.3817C10.1101 14.3489 10.0929 14.3066 10.0909 14.262C10.0903 14.2601 10.0903 14.2575 10.0903 14.2548C10.0903 14.2548 10.0129 12.63 10.0129 12.6273L10.0893 8.61871L10.0903 8.58028C10.0909 8.51008 10.1282 8.44753 10.1839 8.41164C10.215 8.39086 10.2519 8.3787 10.2931 8.3787C10.3335 8.3787 10.3717 8.39125 10.4037 8.41341C10.458 8.44968 10.4935 8.51067 10.4945 8.58047L10.5796 12.6292L10.5027 14.0932ZM11.1774 14.2326V14.2307C11.176 14.3491 11.079 14.4456 10.9617 14.4456C10.8441 14.4456 10.7472 14.3491 10.746 14.2317L10.7015 13.4414L10.6578 12.63L10.746 8.23654V8.21438C10.7462 8.14771 10.7776 8.0881 10.826 8.0479C10.8631 8.01751 10.9107 7.99908 10.9617 7.99908C11.0023 7.99908 11.04 8.01026 11.0721 8.02908C11.1335 8.06751 11.1764 8.13555 11.1784 8.2134L11.2739 12.6298L11.1774 14.2326ZM17.0076 14.4499C17.0076 14.4499 11.5794 14.4499 11.5737 14.4499C11.4565 14.4379 11.3637 14.3446 11.3617 14.2244V8.00378C11.3637 7.88927 11.4031 7.83025 11.5506 7.77358C11.9312 7.62612 12.3622 7.53906 12.8051 7.53906C14.6121 7.53906 16.0927 8.92519 16.2498 10.6909C16.4823 10.5939 16.7392 10.5386 17.0076 10.5386C18.0896 10.5386 18.9669 11.4163 18.9669 12.499C18.9669 13.5816 18.0896 14.4499 17.0076 14.4499Z" fill="white" data-v-2645f068></path></svg></a>`);
      } else {
        _push(`<!---->`);
      }
      if ((_j = (_i = _ctx.article) == null ? void 0 : _i.socials) == null ? void 0 : _j.nina) {
        _push(`<a${ssrRenderAttr("href", (_l = (_k = _ctx.article) == null ? void 0 : _k.socials) == null ? void 0 : _l.nina)} target="_blank" rel="noopener noreferrer" aria-label="Nina" data-v-2645f068><span class="social-icon tag" data-v-2645f068>Nina</span></a>`);
      } else {
        _push(`<!---->`);
      }
      if ((_n = (_m = _ctx.article) == null ? void 0 : _m.socials) == null ? void 0 : _n.bandcamp) {
        _push(`<a${ssrRenderAttr("href", (_p = (_o = _ctx.article) == null ? void 0 : _o.socials) == null ? void 0 : _p.bandcamp)} target="_blank" rel="noopener noreferrer" aria-label="Bandcamp" data-v-2645f068><span class="social-icon tag" data-v-2645f068>Bandcamp</span></a>`);
      } else {
        _push(`<!---->`);
      }
      if ((_r = (_q = _ctx.article) == null ? void 0 : _q.socials) == null ? void 0 : _r.web) {
        _push(`<a${ssrRenderAttr("href", (_t = (_s = _ctx.article) == null ? void 0 : _s.socials) == null ? void 0 : _t.web)} target="_blank" rel="noopener noreferrer" aria-label="Website" data-v-2645f068><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-2645f068><circle cx="11" cy="11" r="11" fill="#2C2C2C" data-v-2645f068></circle><path d="M16.4757 7.97403C16.4329 7.65492 16.3297 7.35489 16.1797 7.06788C16.0337 6.78926 15.8434 6.54039 15.6109 6.32223C15.3818 6.10686 15.1212 5.9315 14.8292 5.79566C14.516 5.64913 14.1871 5.55378 13.84 5.51843C13.339 5.46586 12.8547 5.5254 12.3851 5.7017C11.9948 5.84823 11.6541 6.06267 11.3581 6.33991C10.8645 6.80321 10.3738 7.26977 9.88171 7.73543C9.84287 7.77218 9.80501 7.81172 9.76224 7.85451H9.80993C9.9648 7.84242 10.1197 7.82707 10.2755 7.8187C10.4972 7.808 10.7175 7.828 10.9363 7.86289C11.1816 7.90103 11.422 7.95825 11.6536 8.04849C11.6802 8.05919 11.6939 8.05081 11.7102 8.03407C11.8208 7.92429 11.9304 7.81498 12.0435 7.70799C12.1718 7.58519 12.3026 7.46611 12.4309 7.34376C12.5784 7.20189 12.748 7.09257 12.9442 7.02234C13.2249 6.92093 13.512 6.89488 13.8075 6.95442C14.1777 7.02932 14.4732 7.21538 14.6999 7.49727C14.925 7.77823 15.0194 8.10105 14.9904 8.45364C14.9604 8.82019 14.7967 9.12626 14.5199 9.3849C13.8552 10.0078 13.1958 10.6338 12.5361 11.2604C12.4141 11.3758 12.2907 11.4893 12.1408 11.5735C11.9368 11.6889 11.7155 11.7558 11.48 11.7712C11.1791 11.7917 10.8935 11.7307 10.6304 11.5902C10.306 11.4163 10.0842 11.1614 9.96327 10.8269C9.95442 10.8032 9.94163 10.7804 9.92541 10.746C9.85363 10.8009 9.78431 10.8446 9.72679 10.8995C9.42835 11.1781 9.13287 11.4591 8.8369 11.7391C8.82559 11.7498 8.80937 11.7605 8.80544 11.7749C8.80052 11.7917 8.79806 11.8131 8.80544 11.8275C8.82166 11.8586 8.84673 11.8856 8.86689 11.9168C9.06699 12.2229 9.32609 12.4787 9.63976 12.6825C10.0174 12.9276 10.4303 13.0932 10.8871 13.1625C11.1236 13.1983 11.3605 13.209 11.598 13.1923C11.92 13.1695 12.2322 13.0992 12.5292 12.9802C12.8325 12.8597 13.1118 12.7001 13.3537 12.4871C13.5336 12.3289 13.7087 12.1643 13.8822 12.0001C14.4211 11.4916 14.957 10.9809 15.4983 10.4747C15.7313 10.2571 15.9452 10.0268 16.106 9.75654C16.2835 9.45884 16.4093 9.14346 16.4634 8.80388C16.5076 8.52897 16.5135 8.25127 16.4762 7.97403L16.4757 7.97403Z" fill="white" data-v-2645f068></path><path d="M12.1029 14.1601C11.8955 14.1768 11.6876 14.1884 11.4787 14.1768C11.1086 14.1578 10.7489 14.0945 10.4019 13.9699C10.3464 13.9494 10.3139 13.9531 10.2687 13.9973C10.0559 14.207 9.83721 14.4117 9.61949 14.6163C9.48089 14.7475 9.32903 14.8614 9.14915 14.9391C8.76531 15.1032 8.3741 15.1223 7.97798 14.9842C7.61674 14.8581 7.34644 14.6293 7.17 14.3066C7.0201 14.0317 6.96751 13.7373 7.02157 13.4304C7.07318 13.1434 7.19653 12.8886 7.41524 12.6802C7.53122 12.5695 7.64524 12.4598 7.76123 12.3491C7.97896 12.1421 8.19667 11.9347 8.4144 11.7278C8.56921 11.5803 8.72501 11.4338 8.87981 11.2873C8.95796 11.2125 9.03463 11.1362 9.11376 11.0622C9.23318 10.9502 9.35556 10.8409 9.47253 10.7255C9.65389 10.5456 9.85883 10.4005 10.1055 10.3126C10.3709 10.2172 10.6442 10.1972 10.9209 10.253C11.4217 10.353 11.78 10.6232 11.9928 11.065C12.0193 11.1208 12.0419 11.1794 12.0709 11.2473C12.1324 11.2032 12.1982 11.1664 12.2508 11.1176C12.5604 10.8283 12.8671 10.5353 13.1758 10.2451C13.2072 10.2154 13.2057 10.1902 13.1846 10.1582C13.0612 9.97957 12.9305 9.80703 12.7718 9.65355C12.4789 9.37032 12.1378 9.15453 11.75 9.0071C11.5161 8.91781 11.2733 8.85967 11.0226 8.82712C10.8098 8.80108 10.5975 8.79271 10.3862 8.80945C10.0564 8.83549 9.73695 8.90944 9.43274 9.03547C9.15604 9.14988 8.89802 9.29405 8.67539 9.48798C8.48912 9.64983 8.30777 9.81771 8.12937 9.987C7.5519 10.5311 6.97442 11.0762 6.3994 11.6226C6.27506 11.7403 6.15906 11.8668 6.05733 12.0035C5.90251 12.2119 5.77817 12.4356 5.68381 12.6751C5.56045 12.9904 5.5 13.3155 5.5 13.6512C5.5 13.9191 5.53637 14.1809 5.61451 14.4372C5.70494 14.7325 5.84354 15.0088 6.02734 15.2636C6.19444 15.4957 6.39201 15.7008 6.62497 15.8757C7.00095 16.1589 7.4241 16.3458 7.89596 16.4389C8.10877 16.4807 8.32354 16.5021 8.54028 16.5007C8.78799 16.4984 9.0347 16.4672 9.27355 16.4091C9.5011 16.3542 9.71636 16.264 9.92524 16.1617C10.1041 16.0738 10.2737 15.971 10.4211 15.8436C10.6615 15.6366 10.8915 15.4185 11.1229 15.2032C11.4198 14.9269 11.7157 14.647 12.011 14.3684C12.0877 14.2968 12.1609 14.2219 12.2361 14.1493C12.2361 14.1456 12.2337 14.1433 12.2322 14.14C12.1894 14.1461 12.1467 14.1554 12.1025 14.1591L12.1029 14.1601Z" fill="white" data-v-2645f068></path></svg></a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (otherTags.value.length) {
        _push(`<div class="tags article-content-tags" data-v-2645f068><!--[-->`);
        ssrRenderList(otherTags.value, (tag, index) => {
          var _a2, _b2, _c2;
          _push(`<button class="tag" type="button" data-v-2645f068>${ssrInterpolate(((_b2 = (_a2 = tag == null ? void 0 : tag.title) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.value) ? ("parseI18nObj" in _ctx ? _ctx.parseI18nObj : unref(parseI18nObj))(tag == null ? void 0 : tag.title) : ((_c2 = tag == null ? void 0 : tag.title[0]) == null ? void 0 : _c2.value) ?? tag.title)}</button>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (_ctx.article) {
        _push(`<div class="article-content" data-v-2645f068><div class="article-container" data-v-2645f068><div class="article-info" data-v-2645f068><div class="article-info-container" data-v-2645f068><div class="article-header" data-v-2645f068><div class="article-title-section" data-v-2645f068><h2 class="article-title" data-v-2645f068>${ssrInterpolate(_ctx.article.title)}</h2>`);
        if ((_u = _ctx.article) == null ? void 0 : _u.publishedAt) {
          _push(`<h3 class="article-date" data-v-2645f068>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(_ctx.article.publishedAt))}</h3>`);
        } else if ((_v = _ctx.article) == null ? void 0 : _v._updatedAt) {
          _push(`<h3 class="article-date" data-v-2645f068>${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(_ctx.article._updatedAt))}</h3>`);
        } else {
          _push(`<!---->`);
        }
        if ((_x = (_w = _ctx.article) == null ? void 0 : _w.authors) == null ? void 0 : _x.length) {
          _push(`<div data-v-2645f068><!--[-->`);
          ssrRenderList(_ctx.article.authors, (author, index) => {
            var _a2;
            _push(`<h3 class="article__author" data-v-2645f068>`);
            if (author == null ? void 0 : author.poolVisibility) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: unref(localePath)(`/pool/${(_a2 = author == null ? void 0 : author.slug) == null ? void 0 : _a2.current}`),
                class: "article__author"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`${ssrInterpolate(author.title)}${ssrInterpolate(index < _ctx.article.authors.length - 1 ? "," : "")}  `);
                  } else {
                    return [
                      createTextVNode(toDisplayString(author.title) + toDisplayString(index < _ctx.article.authors.length - 1 ? "," : "") + "  ", 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<span class="article__author" data-v-2645f068>${ssrInterpolate(author.title)}${ssrInterpolate(index < _ctx.article.authors.length - 1 ? "," : "")}  </span>`);
            }
            _push(`</h3>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if ((_y = _ctx.article) == null ? void 0 : _y.text) {
          _push(`<div class="article-text-container" data-v-2645f068>`);
          _push(ssrRenderComponent(_component_RichText, {
            class: "article-text",
            blocks: currentArticleText.value
          }, null, _parent));
          _push(`<div class="article-language-switcher" data-v-2645f068><!--[-->`);
          ssrRenderList(["en", "de"], (loc) => {
            _push(`<button class="${ssrRenderClass([{ "lang-btn--active": articleLocale.value === loc }, "lang-btn"])}"${ssrIncludeBooleanAttr(!availableLocales.value.includes(loc)) ? " disabled" : ""} data-v-2645f068>${ssrInterpolate(loc.toUpperCase())}</button>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleIntroArticleDetailPage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-2645f068"]]), { __name: "ModuleIntroArticleDetailPage" });

const _sfc_main = {
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    useMainStore();
    const route = useRoute();
    const query = groq`${ENTRY_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query, {
      slug: route.params.slug
    })), __temp = await __temp, __restore(), __temp);
    if (!data.value) {
      console.error("Article nicht gefunden:", route.params.slug);
    }
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    useHead({
      bodyAttrs: {
        class: `page--article-detail`
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c, _d, _e, _f;
      const _component_ModuleIntroArticleDetailPage = __nuxt_component_0;
      const _component_ModuleRelatedContent = __nuxt_component_5;
      const _component_ModuleContentGrid = __nuxt_component_1$1;
      const _component_ModuleContentTeaser = __nuxt_component_3;
      const _component_ModuleHeroEntrySolo = __nuxt_component_3$1;
      const _component_ModuleHeroSlider = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "entry-detail" }, _attrs))} data-v-1ae9783d>`);
      if (unref(data)) {
        _push(`<section class="entry-detail__intro-section" data-v-1ae9783d>`);
        _push(ssrRenderComponent(_component_ModuleIntroArticleDetailPage, { article: unref(data) }, null, _parent));
        if (((_a2 = unref(data)) == null ? void 0 : _a2.relatedContent) && ((_b = unref(data)) == null ? void 0 : _b.relatedContent.length) > 0) {
          _push(`<section class="entry-detail__related-content" data-v-1ae9783d><h3 data-v-1ae9783d>Related Articles</h3>`);
          if (((_c = unref(data)) == null ? void 0 : _c.relatedContent.length) > 0) {
            _push(ssrRenderComponent(_component_ModuleRelatedContent, {
              items: (_d = unref(data)) == null ? void 0 : _d.relatedContent,
              type: "words",
              title: ""
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (((_e = unref(data)) == null ? void 0 : _e.modules) && ((_f = unref(data)) == null ? void 0 : _f.modules.length) > 0) {
          _push(`<section class="module-section" data-v-1ae9783d><!--[-->`);
          ssrRenderList(unref(data).modules, (module) => {
            _push(`<div class="module" data-v-1ae9783d>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/words/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1ae9783d"]]);

export { _slug_ as default };
