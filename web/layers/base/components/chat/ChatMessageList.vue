<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import type { ChatMessage } from "~~/layers/base/composables/useChatRoom";

const props = defineProps<{
	messages: ChatMessage[];
}>();

const list = ref<HTMLElement | null>(null);
const pinned = ref(true);

const scrollToBottom = async (smooth = false) => {
	await nextTick();
	const el = list.value;
	if (!el) return;
	el.scrollTo({
		top: el.scrollHeight,
		behavior: smooth ? "smooth" : "auto",
	});
};

const onScroll = () => {
	const el = list.value;
	if (!el) return;
	pinned.value = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
};

const onStickerLoad = () => {
	if (pinned.value) scrollToBottom();
};

watch(
	() => props.messages.length,
	() => {
		if (pinned.value) scrollToBottom(true);
	},
);

onMounted(() => scrollToBottom());
</script>

<template>
	<div
		ref="list"
		class="messages"
		role="log"
		aria-live="polite"
		aria-relevant="additions"
		@scroll.passive="onScroll"
	>
		<ol class="messages__list">
			<li
				v-if="messages.length === 0"
				class="messages__empty"
			>
				Noch keine Nachrichten. Sag hallo.
			</li>
			<li
				v-for="message in messages"
				:key="message.id"
				class="message"
				:class="[
					message.kind === 'event' && 'message--event',
					message.kind === 'sticker' && 'message--sticker',
					message.kind === 'track' && 'message--track',
				]"
			>
				<template v-if="message.kind === 'track'">
					<div class="track-card">
						<span class="track-card__label">Track ID</span>
						<span class="track-card__title">
							<span
								v-if="message.track?.artist"
								class="track-card__artist"
							>
								{{ message.track.artist }}
							</span>
							{{ message.track?.title }}
						</span>
						<time class="track-card__time">{{ message.time }}</time>
					</div>
				</template>

				<template v-else-if="message.kind === 'event'">
					<span class="message__event">
						<span class="message__event-dot" aria-hidden="true" />
						{{ message.body }}
					</span>
				</template>

				<template v-else>
					<span class="message__avatar" aria-hidden="true">
						{{ message.author?.initials }}
					</span>

					<div class="message__body">
						<div class="message__meta">
							<span class="message__name">{{ message.author?.name }}</span>
							<span
								v-if="message.author && message.author.role !== 'listener'"
								class="message__role"
								:class="`message__role--${message.author.role}`"
							>
								{{ message.author.role === "host" ? "Host" : "Team" }}
							</span>
							<time class="message__time">{{ message.time }}</time>
						</div>

						<p
							v-if="message.deleted"
							class="message__text message__text--deleted"
						>
							Nachricht ausgeblendet.
						</p>

						<p v-else-if="message.kind === 'text'" class="message__text">
							{{ message.body }}
						</p>

						<img
							v-else-if="message.sticker"
							class="message__sticker"
							:src="message.sticker.src"
							:alt="message.sticker.alt"
							:width="message.sticker.w"
							:height="message.sticker.h"
							:style="{
								aspectRatio: `${message.sticker.w} / ${message.sticker.h}`,
							}"
							loading="lazy"
							decoding="async"
							@load="onStickerLoad"
						/>
					</div>
				</template>
			</li>
		</ol>
	</div>
</template>

<style lang="postcss" scoped>
.messages {
	overflow-y: auto;
	overscroll-behavior: contain;
	padding: 1rem 1.25rem 0.5rem;

	@media screen and (max-width: 900px) {
		padding: 0.75rem 0.875rem 0.25rem;
	}
}

.messages__list {
	display: flex;
	flex-direction: column;
	gap: 0;
	list-style: none;
}

.messages__empty {
	padding: 2.5rem 1rem;
	text-align: center;
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
}

.message {
	display: grid;
	grid-template-columns: 1.75rem minmax(0, 1fr);
	gap: 0.625rem;
	align-items: start;
	padding: 0.625rem 0;
}

.message + .message {
	border-top: 1px solid color-mix(in srgb, var(--color-text) 7%, transparent);
}

.message__avatar {
	display: grid;	place-items: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 50%;
	background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
	color: color-mix(in srgb, var(--color-text) 70%, transparent);
	font-size: 0.5625rem;
	font-family: var(--font-text-medium);
	letter-spacing: 0.02em;
	user-select: none;
}

.message__body {
	min-width: 0;
}

.message__meta {
	display: flex;
	align-items: baseline;
	gap: 0.375rem;
	line-height: 1.1;
	margin-bottom: 0.1875rem;
}

.message__name {
	font-family: var(--font-text-medium);
	font-size: var(--base-font-size);
}

.message__role {
	font-size: 0.625rem;
	line-height: 1.35;
	padding: 0 0.3125rem;
	border-radius: 999px;
	border: 1px solid currentcolor;
	transform: translateY(-1px);

	&--host {
		background-color: var(--color-pink);
		border-color: var(--color-pink);
		color: var(--color-black);
	}

	&--editor,
	&--admin {
		color: color-mix(in srgb, var(--color-text) 55%, transparent);
	}
}

.message__time {
	margin-left: 0.1875rem;
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 52%, transparent);
	font-variant-numeric: tabular-nums;
}

.message__text {
	font-size: var(--base-font-size);
	line-height: 1.45;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.message__text--deleted {
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
	font-style: italic;
}

.message__sticker {
	display: block;
	width: 6rem;
	height: auto;
	margin-top: 0.1875rem;
}

.message--event {
	display: block;
	padding: 0.125rem 0;
}

.message--track {
	display: block;
}

.track-card {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	border-left: 3px solid var(--color-pink);
	border-radius: 0 8px 8px 0;
	background-color: color-mix(in srgb, var(--color-pink) 9%, transparent);
}

.track-card__label {
	flex: none;
	font-size: 0.5625rem;
	font-family: var(--font-text-semibold);
	letter-spacing: 0.06em;
	text-transform: uppercase;
	line-height: 1.6;
	padding: 0 0.375rem;
	border-radius: 999px;
	background-color: var(--color-pink);
	color: #111;
}

.track-card__title {
	font-size: var(--base-font-size);
	line-height: 1.35;
	min-width: 0;
}

.track-card__artist {
	font-family: var(--font-text-medium);
}

.track-card__time {
	margin-left: auto;
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 50%, transparent);
	font-variant-numeric: tabular-nums;
	flex: none;
}

.message__event {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.4375rem;
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 55%, transparent);
	text-align: center;
}

.message__event-dot {
	width: 0.3125rem;
	height: 0.3125rem;
	border-radius: 50%;
	background-color: var(--color-pink);
	flex: none;
}

@media screen and (max-width: 900px) {
	.message__sticker {
		width: 5rem;
	}
}
</style>
