<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { HOMEPAGE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "words-archive",
});

const query = groq`${HOMEPAGE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="words-archive">
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.words-archive {
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
