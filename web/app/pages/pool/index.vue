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
		<section v-if="featuredProfiles.length > 0" class="intro-section">
			<ModuleIntroPoolCoverFlow :profiles="featuredProfiles" />
		</section>
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="module-section"
		>
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
}
</style>
