<script setup lang="ts">
defineProps<{
	title: string;
	subtitle?: string;
	eyebrow?: string;
	centered?: boolean;
	compact?: boolean;
}>();
</script>

<template>
	<section class="account-page" :class="{ 'account-page--compact': compact }">
		<div
			class="account-page__inner"
			:class="{
				'account-page__inner--center': centered,
				'account-page__inner--compact': compact,
			}"
		>
			<header v-if="!compact" class="account-page__head">
				<div>
					<p v-if="eyebrow" class="account-page__eyebrow">{{ eyebrow }}</p>
					<h1>{{ title }}</h1>
					<p v-if="subtitle" class="account-page__subtitle">{{ subtitle }}</p>
				</div>
				<div v-if="$slots.actions" class="account-page__actions">
					<slot name="actions" />
				</div>
			</header>
			<slot />
		</div>
	</section>
</template>

<style scoped>
.account-page {
	width: var(--page-max-width);
	max-width: 100%;
	margin: 0 auto;
	padding: calc(var(--first-content-distance) + 50px) 0 var(--content-gap);
}

.account-page--compact {
	width: 100%;
	padding: 0;
}

.account-page__inner {
	width: 100%;
	display: grid;
	gap: var(--base-margin);
}

.account-page__inner--compact {
	width: 100%;
}

.account-page__inner--center {
	width: min(520px, 100%);
	margin: 0 auto;
	justify-items: center;
	text-align: center;
}

.account-page__head {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	padding-bottom: var(--mid-padding);
	border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.account-page__eyebrow {
	margin: 0 0 0.35rem;
	font-size: var(--text-s);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	color: var(--color-pink);
}

.account-page__head h1 {
	margin: 0;
	font-family: var(--font-text-semibold);
	font-size: max(2rem, min(4.4vw, 3.4rem));
	line-height: 0.95;
	text-transform: uppercase;
	letter-spacing: -0.01em;
}

.account-page__subtitle {
	margin: 0.5rem 0 0;
	font-size: var(--text-s);
	color: color-mix(in srgb, var(--color-text) 50%, transparent);
}

.account-page__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.account-page__actions :deep(button),
.account-page__actions :deep(a) {
	padding: 0.5rem 1rem;
	border: 0;
	border-radius: var(--radius-pill);
	background-color: color-mix(in srgb, var(--color-text) 7%, transparent);
	color: inherit;
	font: inherit;
	font-size: var(--text-s);
	letter-spacing: var(--button-letter-spacing);
	text-transform: uppercase;
	text-decoration: none;
	cursor: pointer;
	transition: background-color var(--transition-fast);
}

.account-page__actions :deep(button:hover),
.account-page__actions :deep(a:hover) {
	background-color: color-mix(in srgb, var(--color-text) 12%, transparent);
}

@media screen and (max-width: 900px) {
	.account-page {
		padding-top: calc(var(--base-margin) + 50px);
	}
}
</style>
