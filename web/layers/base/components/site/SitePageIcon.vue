<script setup lang="ts">
type PageIconName =
	| "shows"
	| "pool"
	| "words"
	| "index"
	| "shop"
	| "account"
	| "chat"
	| "calendar"
	| "legal";

defineProps<{ name: PageIconName }>();
</script>

<template>
	<svg class="page-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<template v-if="name === 'shows'">
			<path d="M6.8 4.6 15 10l-8.2 5.4Z" fill="currentColor" />
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
				d="M4 6.2h12M4 10h12M4 13.8h7.4"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else-if="name === 'index'">
			<rect
				x="4"
				y="4"
				width="5"
				height="5"
				rx="1"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<rect
				x="11"
				y="4"
				width="5"
				height="5"
				rx="1"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<rect
				x="4"
				y="11"
				width="5"
				height="5"
				rx="1"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<rect
				x="11"
				y="11"
				width="5"
				height="5"
				rx="1"
				stroke="currentColor"
				stroke-width="1.4"
			/>
		</template>

		<template v-else-if="name === 'shop'">
			<path
				d="M4.6 6.8h10.8l.8 9.4H3.8Z"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="M7.4 6.8V5.4a2.6 2.6 0 0 1 5.2 0v1.4"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else-if="name === 'account'">
			<circle
				cx="10"
				cy="6.8"
				r="2.6"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<path
				d="M4.8 16.2c.6-3 2.5-4.6 5.2-4.6s4.6 1.6 5.2 4.6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else-if="name === 'chat'">
			<path
				d="M3.4 4.8h13.2v8.4h-7l-3.7 2.6v-2.6H3.4Z"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
		</template>

		<template v-else-if="name === 'calendar'">
			<rect
				x="3.2"
				y="4.6"
				width="13.6"
				height="12"
				rx="1.6"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<path
				d="M3.2 8.2h13.6M6.8 3.2v2.8M13.2 3.2v2.8M6.8 11.2h2.4M11.2 11.2h2"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</template>

		<template v-else>
			<path
				d="M10 2.6 16 4.8v5.4c0 3.3-2.4 5.8-6 7.2-3.6-1.4-6-3.9-6-7.2V4.8Z"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="m7.4 10 1.7 1.7 3.5-3.6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</template>
	</svg>
</template>

<style scoped>
.page-icon {
  display: block;
  flex: none;
  width: 1rem;
  height: 1rem;
}
</style>
