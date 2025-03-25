<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SHOWSARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const query = groq`${SHOWSARCHIVE_QUERY}`;
const { data } = await useSanityQuery(query);

usePageSeo(data?.value?.seo);
// console.log(data?.value?.slider?.sets);
</script>

<template>
  <div class="shows-archive">
    <section class="intro-section">
      <ModuleIntroSetSlider
        :sets="data?.slider?.sets.slice(0, data?.slider?.count * 2)"
        :title="'Neueste Shows'"
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
    <section v-else class="module-section">
      <!-- Fallback-Inhalt für den Fall, dass keine Module vorhanden sind -->
      <p>No Content Found.</p>
    </section>
  </div>
</template>

<style lang="postcss" scoped>
.shows-archive {
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
