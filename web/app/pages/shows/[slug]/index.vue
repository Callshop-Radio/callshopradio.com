<script setup>
import { SHOW_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "show-detail",
	key: (route) => route.fullPath,
});

const route = useRoute();

const query = groq`${SHOW_QUERY}`;
const { data } = await useDetailSanityQuery(query, {
	keyPrefix: "show-detail",
});

// Add error handling
if (!data.value) {
	console.error("Show nicht gefunden:", route.params.slug);
	throw createError({
		statusCode: 404,
		statusMessage: "Page Not Found",
	});
}

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="show-detail">
		<section v-if="data" class="show-detail__intro-section">
			<ModuleIntroShowDetailPage :show-item="data" :title="'Show Profile'" />
		</section>
		<section
			v-if="data?.modules && data?.modules.length > 0"
			class="module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
		<section v-if="data?.sets?.length > 0" class="show-detail__related-content">
			<div class="inner">
				<h3 v-if="data?.title === 'No Show'">Similar Sets</h3>
				<h3 v-else>
					More Episodes of <span>{{ data?.title }}</span>
				</h3>
				<ModuleRelatedContent
					:items="data?.sets"
					:limit="9"
					type="sets"
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
    &.pool-detail__intro-section {
      padding-bottom: 0;
    }
  }
}
.show-detail {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  /* gap: var(--content-gap); */
  &__intro-section {
    margin: 0 0 0;
    width: 100%;

    @media screen and (max-width: 900px) {
      padding-top: 0;
    }
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
      span {
        color: var(--color-pink);
      }
    }
    background-color: var(--color-bg);
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
