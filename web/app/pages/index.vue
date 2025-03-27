<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { HOMEPAGE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const query = groq`${HOMEPAGE_QUERY}`;
const { data } = await useSanityQuery(query);

usePageSeo(data?.value?.seo);
</script>

<template>
  <section
    class="module-section"
    v-if="data?.modules && data.modules.length > 0"
  >
    <div
      class="module"
      v-for="module in data.modules"
      :key="module._key || index"
    >
      <ModuleContentGrid
        v-if="module._type == 'module.contentReferenceGrid'"
        :module="module"
      />
      <ModuleContentSlider
        v-if="module._type == 'module.contentReferenceSlider'"
        :module="module"
      />
      <ModuleHeroEntrySolo
        v-if="module._type == 'module.heroEntry'"
        :module="module"
      />
      <ModuleHeroSlider
        v-if="module._type == 'module.heroSlider'"
        :module="module"
      />
    </div>
  </section>
</template>
