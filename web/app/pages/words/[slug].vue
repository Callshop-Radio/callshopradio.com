<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ENTRY_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();
const route = useRoute();

const query = groq`${ENTRY_QUERY}`;
const { data } = await useSanityQuery(query, {
  slug: route.params.slug,
});

if (!data.value) {
  console.error("Article nicht gefunden:", route.params.slug);
}

// const relatedEntries = computed(() => {
//   if (
//     !data.value?.parentShow?.entries ||
//     !Array.isArray(data.value.parentShow?.entries)
//   ) {
//     return [];
//   }

//   return data.value.parentShow?.entries.filter((entry) => {
//     return entry.slug.current !== route.params.entry;
//   });
// });

usePageSeo(data?.value?.seo);
</script>

<template>
  <div class="entry-detail">
    <section class="entry-detail__intro-section" v-if="data">
      <ModuleIntroArticleDetailPage :article="data" />
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
      v-if="data?.relatedContent && data?.relatedContent.length > 0"
      class="entry-detail__related-content"
    >
      <h3>Related Articles</h3>
      <ModuleRelatedContent
        v-if="data?.relatedContent.length > 0"
        :items="data?.relatedContent"
        type="words"
        title=""
      />
    </section>
  </div>
</template>

<style lang="postcss" scoped>
section {
  &:last-of-type {
    padding-bottom: var(--content-gap);
    &.entry-detail__intro-section {
      padding-bottom: 0;
    }
  }
}
.entry-detail {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--content-gap);
  &__intro-section {
    margin: 0 0 0;
  }
  &__related-content,
  &__more-content {
    @media screen and (max-width: 900px) {
      padding: 0 var(--big-margin);
    }
    h3 {
      font-size: var(--h3-size);
      text-transform: uppercase;
      span {
        color: var(--color-pink);
      }
      @media screen and (max-width: 900px) {
        padding: 0 0 var(--mid-margin) 0;
      }
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
