<script setup lang="ts">
import { computed, ref } from "vue";
import { useAccountStore } from "~/stores/accountStore";

const props = withDefaults(
	defineProps<{
		setId: string;
		variant?: "overlay" | "inline";
	}>(),
	{ variant: "overlay" },
);

const account = useAccountStore();
const copy = useAccountCopy();
const route = useRoute();
const localePath = useLocalePath();
const busy = ref(false);

const listIds = computed(() => account.saved[props.setId] ?? []);
const saved = computed(() => props.setId in account.saved);
const label = computed(() => (saved.value ? copy.value.unsave : copy.value.save));

async function toggle() {
	if (account.sessionState === "unknown") await account.loadSession();
	if (account.sessionState !== "authenticated") {
		// v1 deliberately does not replay the mutation after login.
		await navigateTo(localePath({ path: "/konto/anmelden", query: { next: route.fullPath } }));
		return;
	}
	if (saved.value && listIds.value.length > 1 && !window.confirm(copy.value.unsaveEverywhere)) {
		return;
	}

	busy.value = true;
	try {
		await account.toggle(props.setId);
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<button
		type="button"
		class="heart-button"
		:class="[`heart-button--${variant}`, { 'is-saved': saved }]"
		:aria-pressed="saved"
		:aria-label="label"
		:title="label"
		:disabled="busy"
		@click.stop.prevent="toggle"
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			:fill="saved ? 'currentColor' : 'none'"
			stroke="currentColor"
			stroke-width="1.8"
			aria-hidden="true"
		>
			<path
				d="M12 20.2 4.9 13a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6A4.6 4.6 0 0 1 19.1 13Z"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
</template>

<style scoped>
.heart-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	padding: 0;
	border: 1px solid rgb(0 0 0 / 18%);
	border-radius: 999px;
	background: rgb(255 255 255 / 82%);
	color: var(--color-text, #111);
	cursor: pointer;
	transition:
		transform 120ms ease,
		color 120ms ease,
		background 120ms ease;
}

.heart-button:hover {
	transform: scale(1.06);
}

.heart-button:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 2px;
}

.heart-button.is-saved {
	color: #d23b3b;
	background: rgb(255 255 255 / 92%);
}

.heart-button:disabled {
	opacity: 0.6;
	cursor: progress;
}

.heart-button--overlay {
	position: absolute;
	top: 10px;
	right: 10px;
	z-index: 3;
}

.heart-button--inline {
	position: relative;
	vertical-align: middle;
}
</style>
