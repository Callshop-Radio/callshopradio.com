<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
	<section class="account-page">
		<div class="account-page__inner">
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
	padding: clamp(96px, 14vh, 160px) 1.25rem 4rem;
}

.account-page__inner {
	width: min(760px, 100%);
	margin: 0 auto;
	display: grid;
	gap: 1.75rem;
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
