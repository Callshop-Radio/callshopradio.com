<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { WORDS_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const query = groq`${WORDS_QUERY}`;
const { data } = await useCachedSanityQuery(query);

usePageSeo(data?.value?.seo);
console.log(data?.value?.slider?.articles);
</script>

<template>
  <div class="words">
    <section class="intro-section">
      <ModuleIntroArticleSlider
        :articles="data?.slider?.articles?.slice(0, data?.slider?.count * 2)"
        :title="'Featured Articles'"
      />
    </section>
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
  </div>
</template>

<style scoped lang="postcss">
.words {
  display: flex;
  align-items: center;

  flex-flow: column wrap;
  justify-content: flex-start;
  width: 100%;
}
</style>
