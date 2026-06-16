<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ERROR_PAGE_QUERY } from "~~/queries/sanity.queries";

const query = groq`${ERROR_PAGE_QUERY}`;
const { data } = await useSanityQuery(query);

const { favicon } = useUtils();
const localePath = useLocalePath();
favicon();
useSeoMeta({
	title: data?.value?.title || "Page Not Found",
});
</script>

<template>
	<div class="error-page">
		<RichText :blocks="data?.content ?? []" />
		<NuxtLink :to="localePath('/')" class="link-style">
			{{ data?.button }}
		</NuxtLink>
	</div>
</template>

<style lang="postcss" scoped>
.error-page {
  @apply p-4;
}
</style>
