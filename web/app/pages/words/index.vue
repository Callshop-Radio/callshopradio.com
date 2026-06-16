<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { WORDS_QUERY } from "~~/queries/sanity.queries.ts";

const query = groq`${WORDS_QUERY}`;
const { data } = await useCachedSanityQuery(query);

usePageSeo(data?.value?.seo);
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
			<ModuleRenderer :modules="data?.modules" />
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
