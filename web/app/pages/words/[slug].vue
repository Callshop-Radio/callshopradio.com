<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ENTRY_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "page--article-detail",
});

const route = useRoute();

const query = groq`${ENTRY_QUERY}`;
const { data } = await useCachedSanityQuery(query, {
	slug: route.params.slug,
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
			<section
				v-if="data?.modules && data?.modules.length > 0"
				class="module-section"
			>
				<ModuleRenderer :modules="data?.modules" />
			</section>
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
  &__intro-section {
    margin: 0 0 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--content-gap);
  }
  &__related-content,
  &__more-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0 var(--mid-padding);
    box-sizing: border-box;
    h3 {
      width: 100%;
      font-size: var(--h3-size);
      text-transform: uppercase;
      span {
        color: var(--color-pink);
      }
      @media screen and (max-width: 900px) {
        padding: 0 0 var(--mid-margin) 0;
      }
    }
    &.last {
      padding: 0 0 var(--huge-margin) 0;
    }

    :deep(.related-content) {
      max-width: none;
      margin: var(--mid-margin) 0 0;

      .related-content__grid {
        min-width: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
    }
  }
  .module-section {
    padding: 0 var(--big-margin);

    @media screen and (max-width: 900px) {
      padding: 0 var(--page-gutter);
    }
  }
}

@media screen and (max-width: 900px) {
  .entry-detail {
    &__intro-section {
      gap: var(--big-margin);
    }

    &__related-content,
    &__more-content {
      padding: 0 var(--mid-padding);
    }
  }
}
</style>
