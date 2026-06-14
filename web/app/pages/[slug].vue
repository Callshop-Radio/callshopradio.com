<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { SLUG_PAGE_QUERY } from "~~/queries/sanity.queries";

const query = groq`${SLUG_PAGE_QUERY}`;

const route = useRoute();

const { data } = await useCachedSanityQuery(query, {
	slug: route?.params?.slug,
});

if (!data?.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Page Not Found",
	});
}

usePageSeo(data?.value?.seo);

useHead({
	bodyAttrs: {
		class: "page--default",
	},
});
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
