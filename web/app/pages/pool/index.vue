<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { POOLARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const query = groq`${POOLARCHIVE_QUERY}`;
const { data } = await useSanityQuery(query);

usePageSeo(data?.value?.seo);
</script>

<template>
  <div class="pool-archive">
    <section class="intro-section">
      <ModuleIntroPoolSlider
        :poolItems="data?.slider?.pool?.slice(0, data?.slider?.count * 2)"
        :title="'Pool Content'"
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

<style lang="postcss" scoped>
.pool-archive {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
