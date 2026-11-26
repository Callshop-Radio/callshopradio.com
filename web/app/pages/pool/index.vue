<script setup>
import { computed } from "vue";
import { POOLARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "pool-archive",
});

const query = groq`${POOLARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

const slider = computed(() => data.value?.slider);
const { featured: featuredProfiles } = await useCoverFlowSliderItems(
	slider,
	"pool",
	{
		contentType: "pool",
	},
);

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="pool-archive">
		<SiteArchiveMasthead
			title="Pool"
			accent="var(--color-blue)"
		/>
		<section v-if="featuredProfiles.length > 0" class="intro-section">
			<SiteHeroSlider
				:items="featuredProfiles"
				page="pool"
				accent="var(--color-blue)"
			/>
		</section>
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="module-section"
		>
			<h2 class="archive-sr-only">All profiles</h2>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.pool-archive {
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

  /* The slider caption starts on the same vertical line as the POOL headline.
     The slider is full-bleed, so the aside needs the headline's page inset. */
  @media (min-width: 901px) {
    :deep(.lab-pool-layout__aside) {
      left: calc(var(--lab-inset) + var(--base-margin));
    }

    :deep(.lab-viewport--pool--start) {
      --lab-start-offset: calc(
        var(--lab-inset) + var(--base-margin) + var(--lab-pool-caption-width) +
          var(--lab-pool-gap)
      );
    }
  }

  @media (max-width: 900px) {
    :deep(.lab-pool-layout .lab-pool-layout__aside) {
      /* 5px compensates for the full-bleed 100vw overhang against the
         scrollbar-adjusted content width. */
      padding-inline: calc(var(--base-margin) + var(--page-gutter) + 5px);
    }
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

  :deep(.content-grid__filter-section),
  :deep(.content-grid__filter-bar) {
    border-radius: 5px !important;
  }

  /* The pool filter cloud uses blue instead of the set-pink defaults. */
  :deep(.filter-tag--genre) {
    border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
    border-radius: 5px;
    background: transparent;
    color: var(--color-text);
  }

  :deep(.filter-tag--genre:hover) {
    border-color: var(--color-blue);
    color: var(--color-blue);
  }

  :deep(.content-grid__filters .filter-genres .filter-tag--subgenre) {
    border-color: var(--color-blue);
  }

  :deep(.content-grid__filters .filter-genres .filter-tag--subgenre::before) {
    background: var(--color-blue);
  }

  :deep(.content-grid__filters .filter-genres .filter-tag--subgenre:hover),
  :deep(
    .content-grid__filters
      .filter-genres
      .filter-tag--subgenre.filter-tag--active
  ) {
    border-color: var(--color-blue);
    background: var(--color-blue);
    color: var(--color-white);
  }
}
</style>
