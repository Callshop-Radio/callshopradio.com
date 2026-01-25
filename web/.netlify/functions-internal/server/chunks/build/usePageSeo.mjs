import { w as useNuxtApp, x as useSanityQuery, b as useRoute, y as useSeoMeta } from './server.mjs';
import { computed } from 'vue';

const useCachedSanityQuery = async (query, params, options) => {
  const nuxtApp = useNuxtApp();
  const queryKey = `sanity-${btoa(query + JSON.stringify(params || {})).slice(0, 32)}`;
  return useSanityQuery(query, params, {
    // Return cached data immediately if available
    getCachedData: (key) => {
      var _a, _b;
      const cachedData = nuxtApp.payload.data[key] || ((_b = (_a = nuxtApp.static) == null ? void 0 : _a.data) == null ? void 0 : _b[key]);
      if (cachedData) {
        return cachedData;
      }
      return void 0;
    },
    // Use the generated key
    key: queryKey
  });
};

async function usePageSeo(seo) {
  if (!seo) {
    return;
  }
  const TITLE_SEPARATOR = "|";
  const isHomepage = computed(() => {
    var _a;
    return ((_a = useRoute()) == null ? void 0 : _a.name) === "index";
  });
  const title = computed(
    () => (isHomepage == null ? void 0 : isHomepage.value) ? seo == null ? void 0 : seo.title : `${seo == null ? void 0 : seo.title} ${TITLE_SEPARATOR} ${seo == null ? void 0 : seo.pageTitle}`
  );
  useSeoMeta({
    title: title == null ? void 0 : title.value,
    ogTitle: title == null ? void 0 : title.value,
    description: seo == null ? void 0 : seo.metaDescription,
    ogDescription: seo == null ? void 0 : seo.metaDescription,
    ogImage: seo == null ? void 0 : seo.ogImage,
    twitterCard: "summary_large_image"
  });
}

export { usePageSeo as a, useCachedSanityQuery as u };
