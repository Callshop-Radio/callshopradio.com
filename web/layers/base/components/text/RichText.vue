<script setup>
import {
	ElementsLink,
	ModuleCarousel,
	ModuleMedia,
	RichTextStyles
} from '#components'

const props = defineProps({
	blocks: {
		type: Array,
		default: () => []
	}
})

const serializers = {
	types: {
		'module.media': ModuleMedia,
		'module.carousel': ModuleCarousel
	},
	marks: {
		link: ElementsLink,
		linkCookie: ElementsLink,
		underline: 'u',
		'strike-through': 's'
	},
	styles: {
		normal: RichTextStyles,
		h1: RichTextStyles,
		h2: RichTextStyles,
		h3: RichTextStyles,
		h4: RichTextStyles,
		h5: RichTextStyles,
		h6: RichTextStyles
	}
}
</script>

<template>
	<div class="rich-text">
		<SanityContent :blocks="props.blocks" :serializers="serializers" />
	</div>
</template>
<style lang="postcss" scoped>
.rich-text {
	:deep(ul),
	:deep(ol) {
		@apply text-base;
	}
}
</style>