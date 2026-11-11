<script setup lang="ts">
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from "vue";

const { open, minimized, close, restore } = useChatUi();
const config = useRuntimeConfig();
const enabled = computed(
	() => import.meta.dev || Boolean(config.public.chatEnabled),
);

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
} = useChatRoom();

const pickerOpen = ref(false);
const closeButton = ref<HTMLButtonElement | null>(null);
const height = ref(544);
const dragging = ref(false);
const isMobile = ref(false);

const MIN_HEIGHT = 288;

const maxHeight = () =>
	Math.max(
		MIN_HEIGHT,
		(typeof window === "undefined" ? 900 : window.innerHeight) - 112,
	);

const clampHeight = (value: number) =>
	Math.min(Math.max(value, MIN_HEIGHT), maxHeight());

const persistHeight = () => {
	if (typeof window !== "undefined") {
		localStorage.setItem("chat:height", String(Math.round(height.value)));
	}
};

const persistMinimized = (value: boolean) => {
	if (typeof window !== "undefined") {
		localStorage.setItem("chat:minimized", value ? "1" : "0");
	}
};

const onMinimize = () => {
	const next = !minimized.value;
	minimized.value = next;
	persistMinimized(next);
};

const onTicker = () => {
	minimized.value = false;
	persistMinimized(false);
};

const startDrag = (event: PointerEvent) => {
	if (isMobile.value) return;
	event.preventDefault();
	dragging.value = true;
	const startY = event.clientY;
	const startHeight = height.value;
	const move = (moveEvent: PointerEvent) => {
		height.value = clampHeight(startHeight + (startY - moveEvent.clientY));
	};
	const end = () => {
		dragging.value = false;
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", end);
		persistHeight();
	};
	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", end);
};

const onGripKey = (event: KeyboardEvent) => {
	if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
	event.preventDefault();
	height.value = clampHeight(
		height.value + (event.key === "ArrowUp" ? 24 : -24),
	);
	persistHeight();
};

const latestLine = computed(() => {
	const last = messages.value.at(-1);
	if (!last) {
		return host.value
			? `${host.value.name} ist im Chat`
			: "Noch keine Nachrichten. Sag hallo.";
	}
	if (last.kind === "track" && last.track) {
		const title = [last.track.artist, last.track.title]
			.filter(Boolean)
			.join(" – ");
		return `TRACK ID · ${title}`;
	}
	if (last.kind === "event") return last.body || "Der Raum ist offen.";
	const name = last.author?.name || "Team";
	if (last.kind === "sticker") return `${name}: Sticker`;
	return `${name}: ${last.body}`;
});

const onResize = () => {
	height.value = clampHeight(height.value);
	isMobile.value = window.matchMedia("(max-width: 600px)").matches;
};

const togglePicker = () => {
	pickerOpen.value = !pickerOpen.value;
};

const pickSticker = (slug: string) => {
	sendSticker(slug);
	pickerOpen.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape" && open.value) close();
};

watch(open, async (value) => {
	if (!value) {
		pickerOpen.value = false;
		return;
	}
	await nextTick();
	closeButton.value?.focus({ preventScroll: true });
});

onMounted(() => {
	window.addEventListener("keydown", onKeydown);
	window.addEventListener("resize", onResize);
	onResize();
	const stored = Number(localStorage.getItem("chat:height"));
	if (Number.isFinite(stored) && stored > 0) {
		height.value = clampHeight(stored);
	}
	minimized.value = localStorage.getItem("chat:minimized") === "1";
});

onBeforeUnmount(() => {
	window.removeEventListener("keydown", onKeydown);
	window.removeEventListener("resize", onResize);
});
</script>

<template>
	<Transition name="chat-popup">
		<section
			v-if="open && enabled"
			class="chat-popup"
			:class="{ 'is-minimized': minimized, 'is-dragging': dragging }"
			:style="
				minimized || isMobile ? undefined : { height: `${height}px` }
			"
			role="dialog"
			aria-label="Chat"
			aria-modal="false"
		>
			<div
				v-if="!minimized"
				class="chat-popup__grip"
				role="separator"
				aria-orientation="horizontal"
				aria-label="Chat-Höhe ändern"
				tabindex="0"
				@pointerdown="startDrag"
				@keydown="onGripKey"
			/>

			<header class="chat-popup__head">
				<span class="chat-popup__title">Chat</span>
				<span class="chat-popup__count">
					<span class="chat-popup__dot" aria-hidden="true" />
					{{ online }} im Raum
				</span>
				<button
					type="button"
					class="chat-popup__icon-button chat-popup__min"
					:aria-label="minimized ? 'Chat vergrößern' : 'Chat minimieren'"
					:aria-expanded="!minimized"
					@click="onMinimize"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						aria-hidden="true"
						:class="{ 'is-up': minimized }"
					>
						<path
							d="M2 4.5 6 8.5l4-4"
							stroke="currentColor"
							stroke-width="1.5"
							fill="none"
						/>
					</svg>
				</button>
				<button
					ref="closeButton"
					type="button"
					class="chat-popup__icon-button chat-popup__close"
					aria-label="Chat schließen"
					@click="close"
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
			</header>

			<div v-if="minimized" class="chat-popup__ticker" @click="onTicker">
				<span class="chat-popup__dot" aria-hidden="true" />
				<span class="chat-popup__ticker-text">{{ latestLine }}</span>
			</div>

			<template v-else>
				<div class="chat-popup__live" :class="{ 'is-live': !!host }">
					<span class="chat-popup__dot" aria-hidden="true" />
					<template v-if="host">
						<span class="chat-popup__state">On Air</span>
						<span>{{ host.name }} ist im Chat</span>
						<span v-if="host.showTitle" class="chat-popup__show">
							{{ host.showTitle }}
						</span>
					</template>
					<template v-else>
						<span class="chat-popup__state">Raum offen</span>
						<span>niemand vom Team im Chat</span>
					</template>
				</div>

				<p v-if="peopleNames" class="chat-popup__people">
					{{ peopleNames }}
				</p>

				<div class="chat-popup__stream">
					<ChatMessageList :messages="messages" />
				</div>

				<ChatStickerPicker
					v-if="pickerOpen"
					:packs="packs"
					@pick="pickSticker"
					@close="pickerOpen = false"
				/>

				<ChatComposer
					:signed-in="signedIn"
					:picker-open="pickerOpen"
					@send="sendText"
					@toggle-stickers="togglePicker"
					@signin="signIn"
				/>
			</template>
		</section>
	</Transition>
</template>

<style lang="postcss" scoped>
.chat-popup {
  --chat-line: color-mix(in srgb, var(--color-text) 14%, transparent);

  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9000;
  width: min(24rem, calc(100vw - 2rem));
  height: min(34rem, calc(100vh - 7rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--chat-line);
  border-radius: 12px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
}

.chat-popup__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.75rem 0.5rem 1rem;
}

.chat-popup__title {
  font-family: var(--font-text-semibold);
  font-size: var(--h3-size);
  line-height: 1.2;
}

.chat-popup__count {
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  margin-left: auto;
  font-size: var(--small-font-size);
  color: color-mix(in srgb, var(--color-text) 58%, transparent);
  font-variant-numeric: tabular-nums;
}

.chat-popup__dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  background-color: var(--color-green);
  flex: none;
}

.chat-popup__icon-button {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: color-mix(in srgb, var(--color-text) 55%, transparent);
  cursor: pointer;
  flex: none;

  &:hover {
    color: var(--color-text);
    background-color: color-mix(in srgb, var(--color-text) 7%, transparent);
  }
}

.chat-popup__min svg {
  transition: transform var(--transition-fast);

  &.is-up {
    transform: rotate(180deg);
  }
}

.chat-popup__grip {
  flex: none;
  height: 0.375rem;
  margin: 0.25rem 0.75rem 0;
  border-radius: 999px;
  background-color: transparent;
  cursor: ns-resize;
  touch-action: none;
  transition: background-color var(--transition-fast);

  &:hover,
  .chat-popup.is-dragging & {
    background-color: var(--color-pink);
  }
}

.chat-popup.is-minimized {
  height: auto;
}

.chat-popup__ticker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0 0.75rem 0.75rem 1rem;
  cursor: pointer;
}

.chat-popup__ticker-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--small-font-size);
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}

.chat-popup__live {
  display: flex;
  align-items: baseline;
  gap: 0.4375rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--chat-line);
  border-bottom: 1px solid var(--chat-line);
  font-size: var(--small-font-size);
  color: color-mix(in srgb, var(--color-text) 50%, transparent);
  flex: none;

  &.is-live {
    background-color: var(--color-pink);
    border-color: var(--color-pink);
    color: #111;

    .chat-popup__dot {
      background-color: #111;
    }
  }
}

.chat-popup__state {
  font-family: var(--font-text-semibold);
}

.chat-popup__show {
  margin-left: auto;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: color-mix(in srgb, #111 62%, transparent);
}

.chat-popup__people {
  padding: 0.375rem 1rem 0.5rem;
  font-size: var(--small-font-size);
  line-height: 1.4;
  color: color-mix(in srgb, var(--color-text) 58%, transparent);
  flex: none;
}

.chat-popup__stream {
  flex: 1 1 auto;
  min-height: 0;
}

.chat-popup__stream :deep(.messages) {
  height: 100%;
}

.chat-popup-enter-active,
.chat-popup-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.chat-popup-enter-from,
.chat-popup-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .chat-popup-enter-active,
  .chat-popup-leave-active {
    transition: none;
  }
}

@media screen and (max-width: 600px) {
  .chat-popup {
    top: var(--nav-height);
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    height: auto;
    max-height: none;
    border-width: 1px 0 0;
    border-radius: 0;
  }

  .chat-popup__grip {
    display: none;
  }
}
</style>
