<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { computed } from "vue";
import { SHOWSARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "shows-archive",
});

const query = groq`${SHOWSARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

const slider = computed(() => data.value?.slider);
const { featured: featuredSets } = useCoverFlowSliderItems(slider, "sets", {
	contentType: "sets",
});

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="shows-archive">
		<section v-if="featuredSets.length > 0" class="intro-section">
			<ModuleIntroCoverFlow :items="featuredSets" nav-label="Set">
				<template #default="{ item, mediaActive }">
					<ModuleIntroSet layout="cover-flow" :set="item" :media-active="mediaActive" />
				</template>
			</ModuleIntroCoverFlow>
		</section>
		<section
			v-if="data?.modules && data?.modules?.length > 0"
			class="module-section"
		>
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
}
</style>
