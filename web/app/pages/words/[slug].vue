<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ENTRY_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "page--article-detail",
	key: (route) => route.fullPath,
});

const route = useRoute();

const query = groq`${ENTRY_QUERY}`;
const { data } = await useDetailSanityQuery(query, {
	keyPrefix: "article-detail",
});

if (!data.value) {
	console.error("Article nicht gefunden:", route.params.slug);
}

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="entry-detail page-full-bleed">
		<section v-if="data" class="entry-detail__intro-section">
			<ModuleIntroArticleDetailPage :article="data" />
		</section>
		<section
			v-if="data?.relatedContent && data?.relatedContent.length > 0"
			class="entry-detail__related-content"
		>
			<div class="inner">
				<h3>Related Articles</h3>
				<ModuleRelatedContent
					:items="data?.relatedContent"
					type="words"
					title=""
				/>
			</div>
		</section>
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

  &__intro-section {
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__related-content,
  &__more-content {
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
