<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChatPack } from "~~/layers/base/data/chatPacks";

const props = defineProps<{
	packs: ChatPack[];
}>();

const emit = defineEmits<{
	pick: [slug: string];
	close: [];
}>();

const activePack = ref<string>("all");

const stickers = computed(() =>
	activePack.value === "all"
		? props.packs.flatMap((pack) =>
				pack.stickers.map((s) => ({ ...s, pack: pack.title })),
			)
		: (props.packs.find((p) => p.slug === activePack.value)?.stickers ?? []),
);
</script>

<template>
	<div class="picker" role="group" aria-label="Sticker auswählen">
		<div class="picker__head">
			<div class="picker__tabs">
				<button
					v-for="pack in packs"
					:key="pack.slug"
					type="button"
					class="picker__tab"
					:class="{ 'is-active': activePack === pack.slug }"
					:aria-pressed="activePack === pack.slug"
					@click="activePack = pack.slug"
				>
					{{ pack.title }}
				</button>
				<button
					type="button"
					class="picker__tab"
					:class="{ 'is-active': activePack === 'all' }"
					:aria-pressed="activePack === 'all'"
					@click="activePack = 'all'"
				>
					Alle
				</button>
			</div>

			<button
				type="button"
				class="picker__close"
				aria-label="Sticker schließen"
				@click="emit('close')"
			>
				<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
					<path
						d="M1 1l10 10M11 1L1 11"
						stroke="currentColor"
						stroke-width="1.5"
						fill="none"
					/>
				</svg>
			</button>
		</div>

		<div class="picker__grid">
			<button
				v-for="sticker in stickers"
				:key="sticker.src"
				type="button"
				class="picker__sticker"
				:title="sticker.alt"
				@click="emit('pick', sticker.slug)"
			>
				<img
					:src="sticker.src"
					:alt="sticker.alt"
					:width="sticker.w"
					:height="sticker.h"
					loading="lazy"
					decoding="async"
				/>
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

.picker {
	border-top: 1px solid var(--chat-line);
	padding: 0.625rem 0.75rem 0.75rem;
	background-color: color-mix(in srgb, var(--color-text) 2.5%, transparent);
}

.picker__head {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
}

.picker__tabs {
	display: flex;
	gap: 0.25rem;
	flex-wrap: wrap;
}

.picker__tab {
	font-size: var(--small-font-size);
	padding: 0.125rem 0.5rem;
	border-radius: 999px;
	border: 1px solid var(--chat-line);
	color: color-mix(in srgb, var(--color-text) 65%, transparent);
	cursor: pointer;

	&.is-active {
		background-color: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg);
	}

	&:hover:not(.is-active) {
		border-color: color-mix(in srgb, var(--color-text) 45%, transparent);
	}
}

.picker__close {
	margin-left: auto;
	display: grid;
	place-items: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
	cursor: pointer;

	&:hover {
		color: var(--color-text);
		background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
	}
}

.picker__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
	gap: 0.125rem;
	max-height: 10.5rem;
	overflow-y: auto;
	overscroll-behavior: contain;
}

.picker__sticker {
	display: grid;
	place-items: center;
	padding: 0.3125rem;
	border-radius: 6px;
	cursor: pointer;
	border: 1px solid transparent;

	img {
		width: 2.25rem;
		height: auto;
	}

	&:hover {
		background-color: color-mix(in srgb, var(--color-text) 6%, transparent);
	}

	&:focus-visible {
		outline: 2px solid var(--color-pink);
		outline-offset: -2px;
	}
}
</style>
