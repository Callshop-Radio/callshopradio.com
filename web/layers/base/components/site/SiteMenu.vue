<script setup>
import { useMainStore } from '~/stores/mainStore'

const mainStore = useMainStore()
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu)
</script>

<template>
	<nav>
		<ElementsLink
			v-for="item in mainMenu"
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
	</nav>
</template>

<style lang="postcss" scoped>
nav {
	@apply flex gap-4 p4 sticky top-0 z-99;
}
</style>
