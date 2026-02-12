<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SHOWSARCHIVE_QUERY } from '~~/queries/sanity.queries.ts'

const query = groq`${SHOWSARCHIVE_QUERY}`
const { data } = await useCachedSanityQuery(query)

useHead({
	bodyAttrs: {
		class: 'shows-archive'
	}
})
</script>

<template>
	<div class="shows-archive">
		<!-- <section class="intro-section">
      <ModuleIntroSetSlider
        :sets="data?.slider?.sets?.slice(0, data?.slider?.count * 2)"
        :title="'Featured Shows'"
      />
    </section> -->
		<section
			v-if="data?.modules && data?.modules?.length > 0"
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
				<ModuleContentSlider
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
.shows-archive {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
}
</style>

