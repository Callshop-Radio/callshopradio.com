<script setup>
import { SLUG_PAGE_QUERY } from "~~/queries/sanity.queries";

definePageMeta({
	bodyClass: "page--default",
	key: (route) => route.fullPath,
});

const query = groq`${SLUG_PAGE_QUERY}`;

const { data } = await useDetailSanityQuery(query, {
	keyPrefix: "slug-page",
});

if (!data?.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Page Not Found",
	});
}

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="default">
		<section v-if="data" class="default__content">
			<RichText :blocks="parseI18nObj(data?.content)" />
		</section>
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="default__module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>
