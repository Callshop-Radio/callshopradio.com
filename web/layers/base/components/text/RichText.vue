<script setup>
import { flattenProps } from "@portabletext/vue";
import {
	ElementsLink,
	ModuleCarousel,
	ModuleMedia,
	RichTextStyles,
} from "#components";

const props = defineProps({
	blocks: {
		type: Array,
		default: () => [],
	},
});

const portableTextComponents = {
	types: {
		"module.media": flattenProps(ModuleMedia),
		"module.carousel": flattenProps(ModuleCarousel),
	},
	marks: {
		link: flattenProps(ElementsLink),
		linkCookie: flattenProps(ElementsLink),
		underline: "u",
		"strike-through": "s",
	},
	block: {
		normal: RichTextStyles,
		h1: RichTextStyles,
		h2: RichTextStyles,
		h3: RichTextStyles,
		h4: RichTextStyles,
		h5: RichTextStyles,
		h6: RichTextStyles,
	},
};
</script>

<template>
	<div class="rich-text">
		<SanityContent :value="props.blocks" :components="portableTextComponents" />
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
