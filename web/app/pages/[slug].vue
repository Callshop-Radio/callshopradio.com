<script setup>
import { PRIVACY_SLUGS, privacyContentBlocks } from "~/utils/privacyPage";
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

const route = useRoute();
const { locale } = useI18n();

const contentBlocks = computed(() => {
	const blocks = parseI18nObj(data.value?.content) ?? [];
	const slug = String(route.params.slug || "");
	if (!PRIVACY_SLUGS.includes(slug)) return blocks;

	return privacyContentBlocks(blocks, locale.value);
});
</script>

<template>
	<div class="default">
		<section v-if="data" class="default__content">
			<RichText :blocks="contentBlocks" />
		</section>
		<section
			v-if="data?.modules && data.modules.length > 0"
			class="default__module-section"
		>
			<ModuleRenderer :modules="data?.modules" />
		</section>
	</div>
</template>
