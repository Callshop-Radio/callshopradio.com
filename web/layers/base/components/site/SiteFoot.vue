<script setup>
import { useMainStore } from '~/stores/mainStore'

const mainStore = useMainStore()
const footerMenu = computed(() => mainStore?.siteNav?.footerMenu)
</script>

<template>
	<footer>
		<ElementsLink
			v-for="item in footerMenu"
			:key="item?._key"
			:type="item?.type"
			:href="item?.url"
			:blank="item?.blank"
			:route="item?.route"
			:slug="item?.slug"
			:func="item?.func"
		>
			{{ item?.title }}
		</ElementsLink>
	</footer>
</template>

<style lang="postcss" scoped>
footer {
  @apply flex gap-4 p4;
}
</style>
