<script setup>
import { WORDS_TYPOGRAPHY } from "@callshop/words-typography";
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

// flattenProps drops the default slot — fine for standalone block types, but
// mark text arrives as slot children, so links rendered empty. This variant
// flattens the markDef value into props and forwards the slots.
const flattenMarkProps =
	(component) =>
	(markProps, { slots }) =>
		h(component, { ...markProps.value }, slots);

// Every block style renders through RichTextStyles: the standard styles plus
// each custom style the Words editor offers. Deduplicated, so `normal` and the
// headings appear exactly once.
const blockMap = Object.fromEntries(
	[
		"normal",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		...WORDS_TYPOGRAPHY.styles.map((style) => style.key),
	].map((style) => [style, RichTextStyles]),
);

const portableTextComponents = {
	types: {
		"module.media": flattenProps(ModuleMedia),
		"module.carousel": flattenProps(ModuleCarousel),
	},
	marks: {
		link: flattenMarkProps(PortableTextLink),
		linkCookie: flattenMarkProps(PortableTextLink),
		underline: "u",
		"strike-through": "s",
	},
	block: blockMap,
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
