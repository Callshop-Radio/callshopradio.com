<script setup>
import { computed } from "vue";
import { WORDS_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "words-archive",
});

const query = groq`${WORDS_QUERY}`;
const { data } = await useCachedSanityQuery(query);

function hasTeaserText(article) {
	return Boolean(article?.useTeaserText && article?.textTeaser?.length);
}

const slider = computed(() => data.value?.slider);
const { featured: featuredArticles } = await useCoverFlowSliderItems(
	slider,
	"articles",
	{
		contentType: "articles",
		filter: hasTeaserText,
	},
);

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="words">
		<section v-if="featuredArticles.length > 0" class="intro-section">
			<ModuleIntroArticleCoverFlow :articles="featuredArticles" />
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
