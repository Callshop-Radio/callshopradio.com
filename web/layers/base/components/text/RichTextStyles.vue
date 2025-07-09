<script setup>
const props = defineProps({
	style: {
		type: String,
		default: () => ''
	},
	children: {
		type: Object,
		default: () => {}
	}
})
</script>

<template>
	<h1 v-if="props.style === 'h1'">
		<slot />
	</h1>
	<h2 v-else-if="props.style === 'h2'">
		<slot />
	</h2>
	<h3 v-else-if="props.style === 'h3'">
		<slot />
	</h3>
	<h4 v-else-if="props.style === 'h4'">
		<slot />
	</h4>
	<h5 v-else-if="props.style === 'h5'">
		<slot />
	</h5>
	<h6 v-else-if="props.style === 'h6'">
		<slot />
	</h6>
	<p v-else-if="props.style === 'normal'">
		<slot />
	</p>
	<p v-else>
		<slot />
	</p>
</template>
<style lang="postcss" scoped>
h1,
h2 {
	margin-bottom: var(--base-margin);
}

h3,h4,h5 {
	margin: var(--base-margin) 0 var(--small-margin) 0;
}

p {
	@apply max-w-80ch whitespace-pre-wrap;
	font-size: var(--base-font-size);
}

img {
	aspect-ratio: auto;
}
</style>
