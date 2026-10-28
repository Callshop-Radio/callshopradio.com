<script setup>
import { resolveStyle } from "@callshop/words-typography";

const props = defineProps({
	value: {
		type: Object,
		default: null,
	},
	style: {
		type: String,
		default: () => "",
	},
});

const blockStyle = computed(
	() => props.style || props.value?.style || "normal",
);

// The custom Words styles carry a class name; headings resolve without one
// and keep the dedicated markup below.
const custom = computed(() => {
	const style = resolveStyle(blockStyle.value);

	return style?.className ? style : null;
});
</script>

<template>
	<component
		:is="custom.element"
		v-if="custom"
		:class="custom.className"
		:style="custom.css"
	>
		<slot />
	</component>
	<h2 v-else-if="blockStyle === 'h1'">
		<slot />
	</h2>
	<h2 v-else-if="blockStyle === 'h2'">
		<slot />
	</h2>
	<h3 v-else-if="blockStyle === 'h3'">
		<slot />
	</h3>
	<h4 v-else-if="blockStyle === 'h4'">
		<slot />
	</h4>
	<h5 v-else-if="blockStyle === 'h5'">
		<slot />
	</h5>
	<h6 v-else-if="blockStyle === 'h6'">
		<slot />
	</h6>
	<p v-else>
		<slot />
	</p>
</template>
<style lang="postcss" scoped>

p {
  @apply max-w-80ch whitespace-pre-wrap;
}

img {
  aspect-ratio: auto;
}
</style>
