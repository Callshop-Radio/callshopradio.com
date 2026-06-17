<script setup>
import { flattenProps } from "@portabletext/vue";
import {
	ModuleCarousel,
	ModuleMedia,
	PortableTextLink,
	RichTextStyles,
} from "#components";

const props = defineProps({
	blocks: {
		type: Array,
		default: () => [],
	},
});

// Unwrap internationalizedArrayRichText* wrapper items so the component
// accepts both the i18n wrapper shape (from GROQ) and a flat block array.
const resolvedBlocks = computed(() => parseI18nObj(props.blocks) ?? []);

const portableTextComponents = {
	types: {
		"module.media": flattenProps(ModuleMedia),
		"module.carousel": flattenProps(ModuleCarousel),
	},
	marks: {
		link: flattenProps(PortableTextLink),
		linkCookie: flattenProps(PortableTextLink),
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
		<SanityContent :value="resolvedBlocks" :components="portableTextComponents" />
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
