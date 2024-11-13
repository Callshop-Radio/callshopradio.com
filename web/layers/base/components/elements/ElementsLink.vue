<script setup>
import { useMainStore } from '~/stores/mainStore'

const props = defineProps({
	type: {
		type: String,
		default: () => 'external'
	},
	href: {
		type: String,
		default: () => ''
	},
	blank: {
		type: Boolean,
		default: () => false
	},
	route: {
		type: String,
		default: () => ''
	},
	slug: {
		type: String,
		default: () => ''
	},
	func: {
		type: String,
		default: () => ''
	}
})

const query = useRoute().query
const internalRoute = computed(() => {
	return {
		name: props?.route ?? 'index',
		params: props?.slug ? { slug: props?.slug } : {},
		query: query
	}
})

const { $CC } = useNuxtApp()
const mainStore = useMainStore()

const onClick = (func) => {
	switch (func) {
	case 'cookie':
		if (!mainStore?.siteCookieBanner?.useCookieBanner) {
			return console.warn(
				`'${func}' triggered but cookie banner is not used.`
			)
		}
		$CC.showPreferences()
		break
	default:
		console.warn(`Function '${func}' not defined.`)
	}
}
</script>

<template>
	<NuxtLink
		v-if="type !== 'function'"
		:to="props.type !== 'internal' ? props?.href : internalRoute"
		:target="props?.blank && props?.type === 'external' ? '_blank' : undefined"
		:download="props.type === 'download' ? true : undefined"
		:rel="props?.blank && props?.type !== 'internal' ? 'noopener' : undefined"
	><slot /></NuxtLink>
	<button
		v-else
		class="link-style"
		@click="onClick(props?.func)"
	>
		<slot />
	</button>
</template>

<style lang="postcss" scoped>
.router-link-exact-active {
	@apply no-underline pointer-events-none;
}

a[target="_blank"] {
	@apply after:content-['↗'];
}

a[download] {
	@apply after:content-['↓'];
}
</style>
