<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SET_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "set-detail",
	key: (route) => route.fullPath,
});

const route = useRoute();

const query = groq`${SET_QUERY}`;
const { data } = await useDetailSanityQuery(query, {
	keyPrefix: "set-detail",
	routeParam: "set",
});

if (!data.value) {
	console.error("Set nicht gefunden:", route.params.set);
}

const relatedSets = computed(() => {
	if (
		!data.value?.parentShow?.sets ||
		!Array.isArray(data.value.parentShow?.sets)
	) {
		return [];
	}

	return data.value.parentShow?.sets.filter((set) => {
		return set.slug.current !== route.params.set;
	});
});

usePageSeo(data?.value?.seo);
</script>

<template>
	<div ref="setDetailRef" class="set-detail">
		<section v-if="data" class="set-detail__intro-section">
			<ModuleIntroSetDetailPage :set="data" :title="data?.title" />
		</section>
		<section
			v-if="data?.modules && data?.modules.length > 0"
			class="module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
		<section
			v-if="data?.relatedContent?.length > 0"
			class="set-detail__related-content"
		>
			<h3>Related</h3>
			<ModuleRelatedContent
				v-if="data?.relatedContent?.length > 0"
				:items="data?.relatedContent"
				type="sets"
				title=""
				:limit="6"
			/>
		</section>
		<section v-if="relatedSets.length > 0" class="set-detail__more-content">
			<h3 v-if="data?.parentShow?.title === 'No Show'">Similar Sets</h3>
			<h3 v-else>
				More Episodes of <span>{{ data?.parentShow?.title }}</span>
			</h3>
			<ModuleRelatedContent
				v-if="relatedSets.length > 0"
				:items="relatedSets"
				type="sets"
				title=""
				:limit="6"
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
  width: var(--page-max-width);
  max-width: 100%;
  margin-inline: auto;
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
    /* @media screen and (max-width: 900px) {
      padding: 0 var(--big-margin);
    } */
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
