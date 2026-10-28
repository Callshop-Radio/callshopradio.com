<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; centered?: boolean }>();
</script>

<template>
	<section class="account-page">
		<div class="account-page__inner" :class="{ 'account-page__inner--center': centered }">
			<header class="account-page__head">
				<h1>{{ title }}</h1>
				<p v-if="subtitle">{{ subtitle }}</p>
			</header>
			<slot />
		</div>
	</section>
</template>

<style scoped>
.account-page {
	width: 100%;
	padding: clamp(96px, 14vh, 160px) 0 4rem;
}

.account-page__inner {
	width: var(--page-max-width);
	max-width: 100%;
	margin: 0;
	display: grid;
	gap: 1.75rem;
}

.account-page__inner--center {
	width: min(520px, 100%);
	margin: 0 auto;
	justify-items: center;
	text-align: center;
}

.account-page__head h1 {
	font-size: clamp(1.8rem, 3vw, 2.6rem);
	line-height: 1.1;
	margin: 0;
}

.account-page__head p {
	margin: 0.4rem 0 0;
	opacity: 0.72;
}
</style>
