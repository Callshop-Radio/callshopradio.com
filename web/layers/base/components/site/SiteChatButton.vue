<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const { open, toggle } = useChatUi();

// The chat icon owns the chat only; the schedule panel keeps its own state and
// simply shifts sideways while the chat is open.
const togglePanels = () => toggle();
const { messages, loaded } = useChatRoom();

const pulsing = ref(false);
let lastId = 0;
let ready = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const latestId = computed(() => messages.value.at(-1)?.id ?? 0);

const stopPulse = () => {
	pulsing.value = false;
	if (timer) clearTimeout(timer);
	timer = null;
};

const pulse = () => {
	if (pulsing.value) return;
	pulsing.value = true;
	timer = setTimeout(stopPulse, 3200);
};

watch(
	loaded,
	(value) => {
		if (!value) return;
		lastId = latestId.value;
		ready = true;
	},
	{ immediate: true },
);

watch(latestId, (id) => {
	if (!ready) {
		lastId = id;
		return;
	}
	if (id <= lastId) {
		lastId = Math.max(lastId, id);
		return;
	}
	lastId = id;
	if (!open.value) pulse();
});

watch(open, (value) => {
	if (value) stopPulse();
});

onBeforeUnmount(stopPulse);
</script>

<template>
	<button
		type="button"
		class="chat-button"
		:class="{ 'is-open': open, 'is-pulsing': pulsing }"
		:aria-expanded="open"
		aria-label="Chat"
		@click="togglePanels"
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle
				cx="12"
				cy="12"
				r="11.5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
			/>
			<path
				d="M8.4 8.4h7.2a1.5 1.5 0 0 1 1.5 1.5v3.8a1.5 1.5 0 0 1-1.5 1.5h-3.6l-2.7 2v-2H8.4a1.5 1.5 0 0 1-1.5-1.5v-3.8a1.5 1.5 0 0 1 1.5-1.5z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="M9.4 10.9h5.2M9.4 13.1h3.4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</svg>
	</button>
</template>

<style lang="postcss" scoped>
.chat-button {
  position: relative;
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.chat-button.is-pulsing::after {
  content: "";
  position: absolute;
  inset: -0.25rem;
  border-radius: 50%;
  border: 2px solid var(--color-pink);
  pointer-events: none;
  animation: chat-ping 0.9s ease-out 3;
}

@keyframes chat-ping {
  0% {
    transform: scale(0.8);
    opacity: 0.9;
  }

  70% {
    transform: scale(1.35);
    opacity: 0;
  }

  100% {
    opacity: 0;
  }
}

svg {
  overflow: visible;
  width: 26px;
  height: 26px;

  circle,
  path {
    overflow: visible;
  }
}

.chat-button:hover svg,
.chat-button.is-open svg {
  @media (min-width: 1024px) {
    circle {
      fill: var(--color-pink);
      stroke: var(--color-pink);
    }

    path {
      stroke: var(--color-bg);
    }
  }
}

.chat-button:focus-visible {
  outline: 2px solid var(--color-pink);
  outline-offset: 2px;
  border-radius: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .chat-button.is-pulsing::after {
    animation: none;
    opacity: 0.8;
  }
}
</style>
