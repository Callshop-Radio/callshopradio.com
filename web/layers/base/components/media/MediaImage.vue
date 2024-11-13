<script setup>
const { $urlFor } = useNuxtApp()

const props = defineProps({
	expand: {
		type: Number,
		default: undefined
	},
	image: {
		type: Object,
		default: () => undefined
	},

	svgPlaceholder: {
		type: Boolean,
		default: () => false
	},
	lqipPlaceholder: {
		type: Boolean,
		default: () => true
	},
	dataSizes: {
		type: String,
		default: () => 'auto'
	},
	dataParentFit: {
		type: String,
		default: () => ''
	},
	alt: {
		type: String,
		default: ''
	},
	auto: {
		default: 'format',
		type: String
	},
	fit: {
		default: 'max',
		type: String
	},
	preload: {
		type: Boolean,
		default: () => false
	}
})

const placeholderSrc = computed(() => {
	const svgColor = 'rgb(230,230,230)'
	return props.svgPlaceholder
		? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cropWidth.value} ${cropHeight.value}'%3E%3Crect width='${cropWidth.value}' height='${cropHeight.value}' fill='${svgColor}' /%3E%3C/svg%3E`
		: props.lqipPlaceholder
			? $urlFor(props.image).width(100).auto(props.auto).fit(props.fit).url()
			: ''
})

const srcSet = computed(() => {
	let srcSet = ''
	const widths = [250, 375, 500, 750, 1000, 1400, 1800, 2400, 3000]
	widths.forEach((width, index) => {
		if (!props.image?.asset) {
			return false
		}
		srcSet
      += $urlFor(props.image).width(width).auto(props.auto).fit(props.fit)
      + ` ${width}w`
		if (index + 1 !== widths.length) {
			srcSet += ','
		}
		srcSet += ' '
	})
	return srcSet
})

const cropWidth = computed(() => {
	const originalWidth = props.image?.asset?.metadata?.dimensions?.width
	const cropLeft = props.image?.crop?.left ?? 0
	const cropRight = props.image?.crop?.right ?? 0

	return originalWidth - cropLeft * originalWidth - cropRight * originalWidth
})

const cropHeight = computed(() => {
	const originalHeight = props.image?.asset?.metadata?.dimensions?.height
	const cropTop = props.image?.crop?.top ?? 0
	const cropBottom = props.image?.crop?.bottom ?? 0
	return originalHeight - cropTop * originalHeight - cropBottom * originalHeight
})

const orientation = computed(() => {
	if (!cropWidth.value || !cropHeight.value) return undefined

	return cropWidth.value > cropHeight.value
		? 'landscape'
		: cropWidth.value < cropHeight.value
			? 'portrait'
			: 'square'
})

const altText = computed(() => props.alt ?? props.image?.asset?.altText)
const isLoaded = ref(false)
const onLoad = () => { isLoaded.value = true }

</script>

<template>
	<UnLazyImage
		:placeholder-src="placeholderSrc"
		:src-set="srcSet"
		:auto-sizes="true"
		:alt="altText"
		:width="cropWidth"
		:height="cropHeight"
		:class="[orientation, { 'loaded': isLoaded }]"
		:preload="props.preload"
		draggable="false"
		:lazy-load="true"
		class="fade"
		@load="onLoad"
	/>
	
</template>

<style lang="postcss" scoped>
.fade {
  @apply opacity-0;

	&.loaded {
  	@apply opacity-100 transition-opacity duration-400;
	}
}
</style>
