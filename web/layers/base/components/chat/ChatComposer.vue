<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	signedIn: boolean;
	meName?: string | null;
	maxLength?: number;
	pickerOpen?: boolean;
}>();

const emit = defineEmits<{
	send: [text: string];
	"toggle-stickers": [];
	signin: [];
}>();

const draft = ref("");

const max = () => props.maxLength ?? 500;

const submit = () => {
	const text = draft.value.trim();
	if (!text || !props.signedIn) return;
	emit("send", text);
	draft.value = "";
};
</script>

<template>
	<div class="composer">
		<form v-if="signedIn" class="composer__form" @submit.prevent="submit">
			<input
				v-model="draft"
				class="composer__input"
				type="text"
				:maxlength="max()"
				placeholder="Schreib etwas in den Raum …"
				aria-label="Nachricht an den Chat"
				autocomplete="off"
			/>

			<span v-if="draft.length > max() - 80" class="composer__count">
				{{ max() - draft.length }}
			</span>

			<button
				type="button"
				class="composer__icon"
				:class="{ 'is-active': pickerOpen }"
				aria-label="Sticker öffnen"
				:aria-expanded="pickerOpen ? 'true' : 'false'"
				@click="emit('toggle-stickers')"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
					<circle
						cx="12"
						cy="12"
						r="9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
					<circle cx="9" cy="10" r="1.2" fill="currentColor" />
					<circle cx="15" cy="10" r="1.2" fill="currentColor" />
					<path
						d="M8 14.5c1.1 1.4 2.4 2 4 2s2.9-.6 4-2"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</button>

			<button
				type="submit"
				class="composer__send"
				:disabled="!draft.trim()"
			>
				Senden
			</button>
		</form>

		<div v-else class="composer__signin">
			<p>
				<strong>Zum Schreiben anmelden.</strong>
				Lesen ist für alle offen.
			</p>
			<button type="button" class="composer__signin-btn" @click="emit('signin')">
				Anmelden
			</button>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
button {
	font: inherit;
	color: inherit;
	background: transparent;
	border: 0;
	padding: 0;
	cursor: pointer;
}

.composer {
	border-top: 1px solid var(--chat-line);
	padding: 0.625rem 0.75rem;
}

.composer__form {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.composer__input {
	flex: 1 1 auto;
	min-width: 0;
	font-size: var(--base-font-size);
	padding: 0.375rem 0;
	border: 0;
	border-bottom: 1px solid var(--chat-line);
	background: transparent;
	color: var(--color-text);
	border-radius: 0;

	&::placeholder {
		color: color-mix(in srgb, var(--color-text) 48%, transparent);
	}

	&:focus {
		outline: none;
		border-bottom-color: var(--color-text);
	}
}

.composer__count {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
	font-variant-numeric: tabular-nums;
}

.composer__icon {
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	color: color-mix(in srgb, var(--color-text) 62%, transparent);
	cursor: pointer;
	flex: none;

	&:hover,
	&.is-active {
		color: var(--color-text);
		background-color: color-mix(in srgb, var(--color-text) 7%, transparent);
	}
}

.composer__send {
	font-size: var(--small-font-size);
	font-family: var(--font-text-medium);
	padding: 0.3125rem 0.75rem;
	border-radius: 999px;
	background-color: var(--color-text);
	color: var(--color-bg);
	cursor: pointer;
	flex: none;

	&:disabled {
		opacity: 0.35;
		cursor: default;
	}
}

.composer__signin {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-height: 2rem;

	p {
		font-size: var(--small-font-size);
		line-height: 1.35;
		color: color-mix(in srgb, var(--color-text) 62%, transparent);
	}

	strong {
		color: var(--color-text);
		font-family: var(--font-text-medium);
		font-weight: normal;
	}
}

.composer__signin-btn {
	font-size: var(--small-font-size);
	font-family: var(--font-text-medium);
	padding: 0.3125rem 0.75rem;
	border-radius: 999px;
	border: 1px solid var(--color-text);
	background-color: transparent;
	color: var(--color-text);
	margin-left: auto;
	flex: none;
	cursor: pointer;

	&:hover {
		background-color: var(--color-text);
		color: var(--color-bg);
	}
}

@media screen and (max-width: 900px) {
	.composer__signin {
		align-items: flex-start;
		flex-direction: column;
		gap: 0.375rem;

		.composer__signin-btn {
			margin-left: 0;
		}
	}
}
</style>
