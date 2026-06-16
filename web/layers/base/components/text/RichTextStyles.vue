<script setup>
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

const blockStyle = computed(() => props.style || props.value?.style || "normal");
</script>

<template>
	<h2 v-if="blockStyle === 'h1'">
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
	<p v-else-if="blockStyle === 'normal'">
		<slot />
	</p>
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
