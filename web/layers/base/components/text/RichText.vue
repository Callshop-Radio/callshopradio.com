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

// flattenProps drops the default slot — fine for standalone block types, but
// mark text arrives as slot children, so links rendered empty. This variant
// flattens the markDef value into props and forwards the slots.
const flattenMarkProps =
	(component) =>
	(markProps, { slots }) =>
		h(component, { ...markProps.value }, slots);

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
