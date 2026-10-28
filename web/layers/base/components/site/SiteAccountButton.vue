<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAccountStore } from "~/stores/accountStore";

const localePath = useLocalePath();
const account = useAccountStore();
const enabled = ref(false);

// The icon only appears when the manager reports listener accounts as on.
onMounted(async () => {
	enabled.value = await account.loadStatus();
});
</script>

<template>
	<NuxtLink v-if="enabled" :to="localePath('/konto')" :aria-label="'Konto'">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="12" cy="12" r="11.5" stroke="currentColor" />
			<circle cx="12" cy="9.2" r="2.7" fill="currentColor" />
			<path
				d="M6.7 17.4c.5-2.5 2.7-4.1 5.3-4.1s4.8 1.6 5.3 4.1"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
		</svg>
	</NuxtLink>
</template>

<style lang="postcss" scoped>
svg {
	overflow: visible;
	width: calc(var(--base-font-size) + var(--small-padding) * 2);
	height: calc(var(--base-font-size) + var(--small-padding) * 2);
	cursor: pointer;
	color: var(--color-text);

	&:hover {
		@media (min-width: 1024px) {
			color: var(--color-pink);
		}
	}
}
</style>
