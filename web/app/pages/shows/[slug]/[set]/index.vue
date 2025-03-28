<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SET_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();
const route = useRoute();

// Den "set"-Parameter aus der URL-Route extrahieren
const query = groq`${SET_QUERY}`;
const { data } = await useSanityQuery(query, {
  slug: route.params.set, // Hier den richtigen Parameter verwenden
});

// Fehlerbehandlung hinzufügen
if (!data.value) {
  console.error("Set nicht gefunden:", route.params.set);
}
// Filtere das aktuelle Set aus den verwandten Sets
const relatedSets = computed(() => {
  if (
    !data.value?.parentShow?.sets ||
    !Array.isArray(data.value.parentShow?.sets)
  ) {
    return [];
  }

  // Filtere das aktuelle Set anhand der slug.current-Eigenschaft
  return data.value.parentShow?.sets.filter((set) => {
    return set.slug.current !== route.params.set;
  });
});

usePageSeo(data?.value?.seo);
</script>

<template>
  <div class="set-detail">
    <section class="set-detail__intro-section" v-if="data">
      <ModuleIntroSetDetailPage :set="data" :title="'Neueste Shows'" />
    </section>
    <section
      class="module-section"
      v-if="data?.modules && data?.modules.length > 0"
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
    <section
      v-if="data?.relatedContent.length > 0"
      class="set-detail__related-content"
    >
      <h3>Related</h3>
      <ModuleRelatedContent
        v-if="data?.relatedContent.length > 0"
        :items="data?.relatedContent"
        type="sets"
        title=""
      />
    </section>
    <section
      v-if="relatedSets.length > 0"
      class="set-detail__more-content"
    >
      <h3>
        More Episodes of <span>{{ data?.parentShow?.title }}</span>
      </h3>
      <ModuleRelatedContent
        v-if="relatedSets.length > 0"
        :items="relatedSets"
        type="sets"
        title=""
      />
    </section>
  </div>
</template>

<style lang="postcss" scoped>
section {
  &:last-of-type {
    padding-bottom: var(--content-gap);
    &.set-detail__intro-section {
      padding-bottom: 0;
    }
  }
}
.set-detail {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--content-gap);
  &__intro-section {
    margin: var(--big-margin) 0 0;
  }
  &__related-content,
  &__more-content {
    h3 {
        font-size: var(--h3-size);
        text-transform: uppercase;
    }
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: flex-start;
    max-width: var(--page-max-width);
    width: 100%;
    &.last {
      padding: 0 0 var(--huge-margin) 0;
    }
  }
}
</style>
