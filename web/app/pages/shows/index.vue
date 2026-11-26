<script setup>
import { computed } from "vue";
import { SHOWSARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "shows-archive",
});

const query = groq`${SHOWSARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

const slider = computed(() => data.value?.slider);
const { featured: featuredSets } = await useCoverFlowSliderItems(
	slider,
	"sets",
	{
		contentType: "sets",
	},
);

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="shows-archive">
		<SiteArchiveMasthead
			title="Shows"
			accent="var(--color-pink)"
		/>
		<section v-if="featuredSets.length > 0" class="intro-section">
			<SiteHeroSlider
				:items="featuredSets"
				page="shows"
				accent="var(--color-pink)"
			/>
		</section>
		<section
			v-if="data?.modules && data?.modules?.length > 0"
			class="module-section"
		>
			<h2 class="archive-sr-only">All sets</h2>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.shows-archive {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  overflow-x: clip;

  .intro-section {
    width: 100%;
    max-width: 100%;
    margin-top: 0.75rem;
  }

  .module-section {
    width: 100%;
  }

  .archive-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  /* The filter console keeps its dark surface; only the shape follows the
     5px card language. The tag cloud itself stays transparent so it reads as
     part of the glass dock instead of a black plate (same as Words). */
  :deep(.content-grid__filter-section),
  :deep(.content-grid__filter-bar) {
    border-radius: 5px !important;
  }

}
</style>
