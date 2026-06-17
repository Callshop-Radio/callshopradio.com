<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { POOL_PROFILE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "pool-detail",
	key: (route) => route.fullPath,
});

const route = useRoute();

// Extract the "set" parameter from the URL route
const query = groq`${POOL_PROFILE_QUERY}`;

const { data } = await useDetailSanityQuery(query, {
	keyPrefix: "pool-detail",
});

// Add error handling
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
		<section v-if="data" class="pool-detail__intro-section">
			<ModuleIntroPoolDetailPage :pool-item="data" :title="'Pool Profile'" />
		</section>
		<section
			v-if="data?.modules && data?.modules.length > 0"
			class="module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
		<section
			v-if="data?.relatedContent?.length > 0"
			class="pool-detail__related-content"
		>
			<div class="inner">
				<h3>Related</h3>
				<ModuleRelatedContent
					:items="data?.relatedContent"
					type="pool"
					image-aspect="portrait"
				/>
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
