<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SHOWSARCHIVE_QUERY } from "~~/queries/sanity.queries.ts";

const query = groq`${SHOWSARCHIVE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

useHead({
	bodyAttrs: {
		class: "shows-archive",
	},
});
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

