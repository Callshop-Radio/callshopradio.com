<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePlayerStore } from "~/stores/playerStore";
import { useHlsLive } from "~~/layers/base/composables/useHlsLive";
import { usePlayerController } from "~~/layers/base/composables/usePlayerController";
import { useVideoPlayer } from "~~/layers/base/composables/useVideoPlayer";

const store = usePlayerStore();
const controller = usePlayerController();
const {
	video,
	open,
	minimized,
	muted,
	fullscreen,
	width,
	toggleMinimize,
	close,
	reopen,
	setWidth,
	toggleMute,
	requestFullscreen,
} = useVideoPlayer();

const { track } = useAnalytics();
const panelRef = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
const playing = ref(false);
const hlsUrl = computed(() => (video.value?.live ? video.value.hlsUrl : null));
const {
	state: hlsState,
	error: hlsError,
	start: startHls,
	stop: stopHls,
	retry: retryHls,
} = useHlsLive(videoEl, hlsUrl);

let openTracked: string | null = null;
let errorTracked: string | null = null;

watch(
	[open, video],
	([isOpen, value]) => {
		if (!isOpen || !value?.since || openTracked === value.since) return;
		openTracked = value.since;
		track("video_open", { since: value.since, show_title: value.title });
	},
	{ immediate: true },
);

watch(hlsState, (state) => {
	const since = video.value?.since;
	if (state === "error" && since && errorTracked !== since) {
		errorTracked = since;
		track("video_error", { since, reason: hlsError.value || "hls" });
	}
});

watch(
	[open, minimized, hlsUrl, videoEl],
	([isOpen, isMinimized, url]) => {
		if (isOpen && !isMinimized && url) void startHls();
		else stopHls();
	},
	{ immediate: true },
);

watch(muted, (value) => {
	if (videoEl.value) videoEl.value.muted = value;
	if (!value) track("video_unmute", { since: video.value?.since });
});

watch(
	() => store.playing,
	(playingNow) => {
		if (playingNow) muted.value = true;
	},
);

function togglePlay() {
	const element = videoEl.value;
	if (!element) return;
	if (element.paused) void element.play().catch(() => {});
	else element.pause();
}

function onPlaying() {
	playing.value = true;
}

function onPause() {
	playing.value = false;
}

function onVideoError() {
	hlsState.value = "error";
	hlsError.value = "Video nicht verfügbar";
}

function startResize(event: PointerEvent) {
	event.preventDefault();
	const startX = event.clientX;
	const startWidth = width.value;
	const move = (moveEvent: PointerEvent) => {
		setWidth(startWidth + (moveEvent.clientX - startX));
	};
	const end = () => {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", end);
	};
	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", end, { once: true });
}

function onResizeKey(event: KeyboardEvent) {
	if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
		event.preventDefault();
		setWidth(width.value + (event.key === "ArrowRight" ? 24 : -24));
	} else if (event.key === "Home") {
		event.preventDefault();
		setWidth(360);
	} else if (event.key === "End") {
		event.preventDefault();
		setWidth(640);
	}
}

async function enterFullscreen() {
	await requestFullscreen(panelRef.value, videoEl.value);
	track("video_fullscreen", { since: video.value?.since });
}

function onVisibilityChange() {
	const element = videoEl.value;
	if (!element) return;
	if (document.hidden) {
		if (muted.value) element.pause();
	} else if (open.value && !minimized.value) {
		void element.play().catch(() => {});
	}
}

onMounted(() => {
	document.addEventListener("visibilitychange", onVisibilityChange);
});

onBeforeUnmount(() => {
	document.removeEventListener("visibilitychange", onVisibilityChange);
	stopHls();
});
</script>

<template>
	<Transition name="video-panel">
		<section
			v-if="open && video"
			ref="panelRef"
			class="video-panel"
			:class="{ 'is-minimized': minimized }"
			:style="{ '--video-width': `${width}px` }"
			role="dialog"
			aria-label="Live Video"
		>
			<header class="video-panel__head">
				<span class="video-panel__dot" :class="{ 'is-live': video.live }" aria-hidden="true" />
				<span class="video-panel__title">{{ minimized ? "Video live" : video.title }}</span>
				<template v-if="!minimized">
					<button type="button" class="video-panel__icon" :aria-label="muted ? 'Ton an' : 'Ton aus'" @click="toggleMute">
						{{ muted ? "Ton an" : "Ton aus" }}
					</button>
					<button type="button" class="video-panel__icon" :aria-label="fullscreen ? 'Vollbild verlassen' : 'Vollbild'" @click="enterFullscreen">⤢</button>
				</template>
				<button type="button" class="video-panel__icon" :aria-label="minimized ? 'Video vergrößern' : 'Video minimieren'" @click="toggleMinimize">
					{{ minimized ? "▢" : "–" }}
				</button>
				<button type="button" class="video-panel__icon" aria-label="Video schließen" @click="close">×</button>
			</header>

			<div v-if="!minimized" class="video-panel__body">
				<video
					ref="videoEl"
					class="video-panel__video"
					playsinline
					:muted="muted"
					@playing="onPlaying"
					@pause="onPause"
					@error="onVideoError"
					@click="togglePlay"
				/>
				<button
					v-if="!playing && hlsState !== 'error'"
					type="button"
					class="video-panel__play"
					aria-label="Video abspielen"
					@click="togglePlay"
				>
					▶
				</button>
				<div v-if="hlsState === 'error'" class="video-panel__error" role="status">
					<p>{{ hlsError || "Video nicht verfügbar" }}</p>
					<button type="button" @click="retryHls">Erneut versuchen</button>
				</div>
				<span
					class="video-panel__resize"
					role="separator"
					aria-label="Videogröße ändern"
					aria-valuemin="280"
					aria-valuemax="640"
					:aria-valuenow="width"
					tabindex="0"
					@pointerdown="startResize"
					@keydown="onResizeKey"
					@dblclick="setWidth(360)"
				/>
			</div>
		</section>
	</Transition>

	<Transition name="video-pill">
		<button
			v-if="video?.live && !open"
			type="button"
			class="video-panel__pill"
			@click="reopen"
		>
			<span class="video-panel__dot is-live" aria-hidden="true" />
			Video live
		</button>
	</Transition>
</template>

<style lang="postcss" scoped>
.video-panel {
  position: fixed;
  bottom: calc(
    1.5rem + env(safe-area-inset-bottom) + var(--player-bar-height)
  );
  left: 1.5rem;
  z-index: 8990;
  width: var(--video-width, 360px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  border-radius: 12px;
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);

  @media screen and (max-width: 600px) {
    right: 1rem;
    left: 1rem;
    width: auto;
  }

  &.is-minimized {
    width: 200px;

    .video-panel__head {
      padding: 0 0.5rem;
    }
  }
}

.video-panel__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 32px;
  padding: 0 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.video-panel__dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--color-dark-grey);

  &.is-live {
    background: var(--color-pink);
  }
}

.video-panel__title {
  flex: 1;
  overflow: hidden;
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.video-panel__icon {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.25rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: var(--small-font-size);
  cursor: pointer;

  &:hover {
    background: var(--color-grey);
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
  }
}

.video-panel__body {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-panel__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.video-panel__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.video-panel__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: var(--small-font-size);
  text-align: center;

  p {
    margin: 0;
  }

  button {
    padding: 0.25rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 100px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
}

.video-panel__resize {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-top: 2px solid rgba(255, 255, 255, 0.8);
  border-right: 2px solid rgba(255, 255, 255, 0.8);
  cursor: nesw-resize;

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
  }

  @media screen and (max-width: 600px) {
    display: none;
  }
}

.video-panel:fullscreen {
  width: 100vw;
  height: 100vh;
  border: 0;
  border-radius: 0;

  .video-panel__body {
    height: calc(100vh - 32px);
    aspect-ratio: auto;
  }
}

.video-panel__pill {
  position: fixed;
  bottom: calc(
    1.5rem + env(safe-area-inset-bottom) + var(--player-bar-height)
  );
  left: 1.5rem;
  z-index: 8990;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 40px;
  padding: 0 0.75rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--small-font-size);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);

  @media screen and (max-width: 600px) {
    left: 1rem;
  }
}

.video-panel-enter-active,
.video-panel-leave-active,
.video-pill-enter-active,
.video-pill-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.video-panel-enter-from,
.video-panel-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.video-pill-enter-from,
.video-pill-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .video-panel-enter-active,
  .video-panel-leave-active,
  .video-pill-enter-active,
  .video-pill-leave-active {
    transition: opacity 80ms ease;
  }

  .video-panel-enter-from,
  .video-panel-leave-to,
  .video-pill-enter-from,
  .video-pill-leave-to {
    transform: none;
  }
}
</style>
