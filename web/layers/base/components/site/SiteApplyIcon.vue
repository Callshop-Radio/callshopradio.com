<script setup lang="ts">
type ApplyIconName = "residency" | "pool" | "words" | "guest";

defineProps<{ name: ApplyIconName }>();
</script>

<template>
	<svg class="apply-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<template v-if="name === 'residency'">
			<path
				d="M3.5 9.2 10 3.5l6.5 5.7"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M5.6 8.5v7.2h8.8V8.5"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M8.5 15.7v-3.4h3v3.4"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</template>

		<template v-else-if="name === 'pool'">
			<rect
				x="2.8"
				y="4.6"
				width="14.4"
				height="10.8"
				rx="1.7"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<circle cx="7" cy="8.9" r="1.4" fill="currentColor" />
			<path
				d="M9.8 8.6h4.4M9.8 11.6h4.4"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else-if="name === 'words'">
			<path
				d="M12.9 3.4 16.6 7.1 8.2 15.5l-4.4.8.8-4.4z"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="M11.5 4.8 15.2 8.5"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else>
			<rect
				x="7.6"
				y="2.6"
				width="4.8"
				height="8.6"
				rx="2.4"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<path
				d="M4.8 9.4a5.2 5.2 0 0 0 10.4 0M10 14.6v2.8"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>
	</svg>
</template>

<style scoped>
.apply-icon {
  display: block;
  flex: none;
  width: 0.9rem;
  height: 0.9rem;
}
</style>
