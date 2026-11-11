<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useChatRoom } from "~~/layers/base/composables/useChatRoom";

const props = withDefaults(
	defineProps<{
		/** Standalone page: adds top spacing instead of sitting in the module flow. */
		page?: boolean;
	}>(),
	{ page: false },
);

const config = useRuntimeConfig();
const isDev = import.meta.dev;
const enabled = computed(() => isDev || Boolean(config.public.chatEnabled));

const {
	real,
	packs,
	messages,
	signedIn,
	host,
	online,
	peopleNames,
	sendText,
	sendSticker,
	signIn,
	signOut,
	hostJoin,
	hostLeave,
	simulateIncoming,
	reset,
} = useChatRoom();

const pickerOpen = ref(false);

const togglePicker = () => {
	pickerOpen.value = !pickerOpen.value;
};

const pickSticker = (slug: string) => {
	sendSticker(slug);
	pickerOpen.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape" && pickerOpen.value) pickerOpen.value = false;
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
	<section
		v-if="enabled"
		id="chat"
		class="chat-section"
		:class="{ 'chat-section--page': props.page }"
		aria-labelledby="chat-heading"
	>
		<div class="chat-shell">
			<aside class="chat-rail">
				<div class="chat-rail__top">
					<h2 id="chat-heading" class="chat-rail__title">Chat</h2>
					<p class="chat-rail__intro">
						Ein Raum für alle, die gerade zuhören. Lesen ist offen,
						schreiben können angemeldete Hörer:innen.
					</p>
				</div>

				<div class="chat-rail__facts">
					<p class="chat-rail__online">
						<span class="chat-rail__dot" aria-hidden="true" />
						{{ online }} im Raum
					</p>

					<p v-if="peopleNames" class="chat-rail__people">
						{{ peopleNames }}
					</p>

					<p v-if="host" class="chat-rail__host">
						<span class="chat-rail__label">Host im Chat</span>
						<strong>{{ host.name }}</strong>
						<span class="chat-rail__show">{{ host.showTitle }}</span>
					</p>
					<p v-else class="chat-rail__host chat-rail__host--empty">
						<span class="chat-rail__label">Host im Chat</span>
						<span>niemand vom Team</span>
					</p>

					<p class="chat-rail__me">
						{{ signedIn ? "Du bist als Lena dabei." : "Du liest mit." }}
					</p>
				</div>
			</aside>

			<div class="chat-room">
				<div class="chat-live" :class="{ 'is-live': !!host }">
					<span class="chat-live__dot" aria-hidden="true" />
					<template v-if="host">
						<span class="chat-live__state">On Air</span>
						<span class="chat-live__text">{{ host.name }} ist im Chat</span>
						<span class="chat-live__show">{{ host.showTitle }}</span>
					</template>
					<template v-else>
						<span class="chat-live__state">Raum offen</span>
						<span class="chat-live__text">niemand vom Team im Chat</span>
					</template>
				</div>

				<ChatMessageList :messages="messages" />

				<ChatStickerPicker
					v-if="pickerOpen"
					:packs="packs"
					@pick="pickSticker"
					@close="pickerOpen = false"
				/>

				<ChatComposer
					:signed-in="signedIn"
					:me-name="signedIn ? 'Lena' : null"
					:picker-open="pickerOpen"
					@send="sendText"
					@toggle-stickers="togglePicker"
					@signin="signIn"
				/>
			</div>
		</div>

		<ClientOnly>
			<ChatDemoBar
				v-if="isDev && !real"
				:signed-in="signedIn"
				:host-active="!!host"
				@signin="signIn"
				@signout="signOut"
				@host-join="hostJoin"
				@host-leave="hostLeave"
				@simulate="simulateIncoming"
				@reset="reset"
			/>
		</ClientOnly>
	</section>
</template>

<style lang="postcss" scoped>
.chat-section {
	--chat-line: color-mix(in srgb, var(--color-text) 14%, transparent);

	width: 100%;
	max-width: var(--page-max-width);
	margin: 0 auto var(--content-gap);

	&--page {
		margin-top: var(--first-content-distance);
	}
}

.chat-shell {
	display: grid;
	grid-template-columns: 15rem minmax(0, 1fr);
	border: 1px solid var(--chat-line);
	border-radius: 12px;
	overflow: hidden;
	background-color: var(--color-bg);
}

.chat-rail {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	gap: 1.5rem;
	padding: 1.25rem;
	border-right: 1px solid var(--chat-line);
}

.chat-rail__title {
	font-size: var(--h2-size);
	line-height: var(--h2-line-height);
	font-family: var(--font-text-semibold);
	margin-bottom: 0.5rem;
}

.chat-rail__intro {
	font-size: var(--small-font-size);
	line-height: 1.45;
	color: color-mix(in srgb, var(--color-text) 62%, transparent);
	max-width: 22ch;
}

.chat-rail__facts {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.chat-rail__online {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-size: var(--small-font-size);
	font-variant-numeric: tabular-nums;
}

.chat-rail__dot {
	width: 0.4375rem;
	height: 0.4375rem;
	border-radius: 50%;
	background-color: var(--color-green);
	flex: none;
}

.chat-rail__people {
	font-size: var(--small-font-size);
	line-height: 1.4;
	color: color-mix(in srgb, var(--color-text) 58%, transparent);
}

.chat-rail__host {
	display: flex;
	flex-direction: column;
	gap: 0.0625rem;
	font-size: var(--base-font-size);
	line-height: 1.3;

	strong {
		font-family: var(--font-text-medium);
		font-weight: normal;
	}

	&--empty {
		color: color-mix(in srgb, var(--color-text) 45%, transparent);
	}
}

.chat-rail__label {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
}

.chat-rail__show {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 62%, transparent);
}

.chat-rail__me {
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 45%, transparent);
	padding-top: 0.75rem;
	margin-top: auto;
	border-top: 1px solid var(--chat-line);
}

.chat-room {
	display: flex;
	flex-direction: column;
	min-width: 0;
	height: clamp(26rem, 58vh, 34rem);
}

.chat-live {
	display: flex;
	align-items: baseline;
	gap: 0.4375rem;
	padding: 0.5625rem 1.25rem;
	border-bottom: 1px solid var(--chat-line);
	font-size: var(--small-font-size);
	color: color-mix(in srgb, var(--color-text) 50%, transparent);
	flex: none;

	&.is-live {
		background-color: var(--color-pink);
		border-bottom-color: var(--color-pink);
		color: var(--color-black);

		.chat-live__dot {
			background-color: var(--color-black);
			animation: chat-pulse 2.4s ease-in-out infinite;
		}

		.chat-live__state {
			color: var(--color-black);
		}

		.chat-live__show {
			color: color-mix(in srgb, var(--color-black) 62%, transparent);
		}
	}
}

.chat-live__dot {
	width: 0.4375rem;
	height: 0.4375rem;
	border-radius: 50%;
	border: 1px solid currentcolor;
	flex: none;
	align-self: center;
}

.chat-live__state {
	font-family: var(--font-text-semibold);
}

.chat-live__text {
	color: inherit;
}

.chat-live__show {
	margin-left: auto;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 45%;
}

@keyframes chat-pulse {
	0%,
	100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.45;
		transform: scale(0.8);
	}
}

@media (prefers-reduced-motion: reduce) {
	.chat-live.is-live .chat-live__dot {
		animation: none;
	}
}

@media screen and (max-width: 900px) {
	.chat-shell {
		grid-template-columns: minmax(0, 1fr);
	}

	.chat-rail {
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem;
		border-right: 0;
		border-bottom: 1px solid var(--chat-line);
	}

	.chat-rail__title {
		font-size: var(--h3-size);
		margin-bottom: 0.125rem;
	}

	.chat-rail__intro {
		max-width: 34ch;
	}

	.chat-rail__facts {
		gap: 0.3125rem;
		text-align: right;
		align-items: flex-end;
	}

	.chat-rail__host {
		align-items: flex-end;
	}

	.chat-rail__me {
		display: none;
	}

	.chat-room {
		height: clamp(24rem, 66vh, 32rem);
	}

	.chat-live {
		padding: 0.5rem 0.875rem;
	}

	.chat-live__show {
		display: none;
	}
}

@media screen and (max-width: 600px) {
	.chat-rail {
		flex-direction: column;
		gap: 0.75rem;
	}

	.chat-rail__intro {
		display: none;
	}

	.chat-rail__facts {
		text-align: left;
		align-items: flex-start;
	}

	.chat-rail__host {
		align-items: flex-start;
	}
}
</style>
