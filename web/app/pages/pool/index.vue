<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { POOLARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

const query = groq`${POOLARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

usePageSeo(data?.value?.seo);

useHead({
	bodyAttrs: {
		class: "pool-archive",
	},
});
</script>

<template>
	<div class="pool-archive">
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="module-section"
		>
			<div
				v-for="module in data.modules"
				:key="module._key || index"
				class="module"
			>
				<ModuleContentGrid
					v-if="module._type == 'module.contentReferenceGrid'"
					:module="module"
				/>
				<ModuleContentTeaser
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
