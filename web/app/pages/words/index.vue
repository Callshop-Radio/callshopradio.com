<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { WORDS_QUERY } from '~~/queries/sanity.queries.ts'

const query = groq`${WORDS_QUERY}`
const { data } = await useCachedSanityQuery(query)

usePageSeo(data?.value?.seo)
</script>

<template>
	<div class="words">
		<section class="intro-section">
			<ModuleIntroArticleSlider
				:articles="data?.slider?.articles?.slice(0, data?.slider?.count * 2)"
				:title="'Featured Articles'"
			/>
		</section>
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

<style scoped lang="postcss">
.words {
  display: flex;
  align-items: center;

  flex-flow: column wrap;
  justify-content: flex-start;
  width: 100%;
}
</style>
