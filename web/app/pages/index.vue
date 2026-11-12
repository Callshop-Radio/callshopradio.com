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

/* Landing hero: 50 px more breathing room below the taller navigation. */
.words-archive :deep(.module-section .module:first-of-type) {
  margin-top: calc(var(--first-content-distance) + 50px);
}

@media screen and (max-width: 900px) {
  .words-archive :deep(.module-section .module:first-of-type) {
    margin-top: calc(var(--base-margin) + 50px);
  }
}
</style>
