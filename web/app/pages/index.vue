<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { HOMEPAGE_QUERY } from '~~/queries/sanity.queries.ts'

const query = groq`${HOMEPAGE_QUERY}`
const { data } = await useSanityQuery(query)

usePageSeo(data?.value?.seo)
</script>

<template>
	<div>
		<RichText v-if="data?.content?.length" :blocks="data?.content" />
	</div>
</template>
