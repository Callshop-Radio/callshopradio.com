<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { SLUG_PAGE_QUERY } from '~~/queries/sanity.queries'

const query = groq`${SLUG_PAGE_QUERY}`

const route = useRoute()
const { data } = await useSanityQuery(query, { slug: route?.params?.slug })

if (!data?.value) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Page Not Found'
	})
}

usePageSeo(data?.value?.seo)
</script>

<template>
	<div>
	</div>
</template>
