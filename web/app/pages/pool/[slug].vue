<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { POOL_PROFILE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();
const route = useRoute();

// Den "set"-Parameter aus der URL-Route extrahieren
const query = groq`${POOL_PROFILE_QUERY}`;

const { data } = await useCachedSanityQuery(query, {
  slug: route.params.slug, // Statt person oder venue den generischen slug parameter verwenden
});

// Fehlerbehandlung hinzufügen
if (!data.value) {
  console.error("Set nicht gefunden:", route.params.slug);
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
  });
}

usePageSeo(data?.value?.seo);
</script>

<template>
  <div class="pool-detail">
    <section class="pool-detail__intro-section" v-if="data">
      <ModuleIntroPoolDetailPage :poolItem="data" :title="'Pool Profile'" />
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
      v-if="data?.relatedContent?.length > 0"
      class="pool-detail__related-content"
    >
      <div class="inner">
        <h3>Related</h3>
        <ModuleRelatedContent :items="data?.relatedContent" type="pool" />
      </div>
    </section>
    <section
      v-if="data?.relatedContent?.length <= 0"
      class="pool-detail__related-content"
    >
      <div class="inner">
        <h3>More</h3>
        <ModuleRelatedContent :items="data?.moreContent" type="pool" />
      </div>
    </section>
    <!-- <section v-if="data?.relatedContent?.length > 0" class="pool-detail__more-content">
      <h3>Related</h3>
      <ModuleRelatedContent
        :items="data?.relatedContent"
        type="sets"
        title=""
      />
    </section> -->
  </div>
</template>

<style lang="postcss" scoped>
section {
  padding: var(--content-gap) 0 0;
  &:first-of-type {
    padding-top: 0;
  }
  &:last-of-type {
    padding-bottom: var(--content-gap);
    &.pool-detail__intro-section {
      padding-bottom: 0;
    }
  }
}
.pool-detail {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  /* gap: var(--content-gap); */
  &__intro-section {
    margin: 0 0 0;
    width: 100%;
    /* max-width: var(--page-max-width); */
  }
  &__related-content,
  &__more-content {
    /* @media screen and (max-width: 900px) {
      padding: 0 var(--big-margin);
    } */
    h3 {
      font-size: var(--h3-size);
      text-transform: uppercase;
      @media screen and (max-width: 900px) {
        padding: 0 0 var(--mid-margin) 0;
      }
    }
    position: relative;
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    .inner {
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-content: center;
      max-width: var(--page-max-width);
      width: 100%;
      margin: 0 auto;
    }
  }
}
</style>
