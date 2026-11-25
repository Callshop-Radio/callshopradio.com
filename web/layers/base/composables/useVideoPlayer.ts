import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePlayerStore } from "~/stores/playerStore";
import { usePlayerController } from "~~/layers/base/composables/usePlayerController";
import {
	clampVideoWidth,
	shouldOpenVideo,
} from "~~/layers/base/utils/videoPanel";
import type { PlayerVideo } from "~~/types/player";

const DEFAULT_WIDTH = 360;
const WIDTH_KEY = "video:width";
const DISMISSED_KEY = "video:dismissed";

export function useVideoPlayer() {
	const store = usePlayerStore();
	const controller = usePlayerController();
	const route = useRoute();

	const open = ref(false);
	const muted = ref(true);
	const fullscreen = ref(false);
	const width = ref(DEFAULT_WIDTH);
	const dismissedSince = ref<string | null>(null);

	const demoVideo: PlayerVideo | null =
		import.meta.dev && route.query.video === "demo"
			? {
					live: true,
					since: "dev-demo",
					hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
					title: "Dev Video",
				}
			: null;

	const video = computed<PlayerVideo | null>(
		() => demoVideo ?? store.feed?.video ?? null,
	);

	if (import.meta.client) {
		const storedWidth = Number(localStorage.getItem(WIDTH_KEY));
		if (Number.isFinite(storedWidth) && storedWidth > 0) {
			width.value = clampVideoWidth(storedWidth, window.innerWidth);
		}
		const dismissed = sessionStorage.getItem(DISMISSED_KEY);
		if (dismissed) dismissedSince.value = dismissed;
	}

	watch(
		video,
		(value) => {
			if (!value?.live) {
				open.value = false;
				return;
			}
			if (
				shouldOpenVideo({
					live: true,
					since: value.since,
					dismissedSince: dismissedSince.value,
				})
			) {
				open.value = true;
			}
		},
		{ immediate: true },
	);

	watch(
		() => store.playing,
		(playing) => {
			if (playing) muted.value = true;
		},
	);

	function close() {
		open.value = false;
		dismissedSince.value = video.value?.since ?? null;
		if (import.meta.client) {
			sessionStorage.setItem(DISMISSED_KEY, dismissedSince.value ?? "1");
		}
	}

	function reopen() {
		dismissedSince.value = null;
		open.value = true;
		if (import.meta.client) {
			sessionStorage.removeItem(DISMISSED_KEY);
		}
	}

	function setWidth(value: number) {
		if (!import.meta.client) return;
		width.value = clampVideoWidth(value, window.innerWidth);
		localStorage.setItem(WIDTH_KEY, String(width.value));
	}

	function toggleMute() {
		muted.value = !muted.value;
		if (!muted.value) controller.pauseForVideo();
	}

	async function requestFullscreen(
		panel: HTMLElement | null,
		videoElement: HTMLVideoElement | null,
	) {
		if (!import.meta.client) return;
		const native = videoElement as
			| (HTMLVideoElement & {
					webkitDisplayingFullscreen?: boolean;
					webkitExitFullscreen?: () => void;
					webkitEnterFullscreen?: () => void;
			  })
			| null;
		if (document.fullscreenElement) {
			await document.exitFullscreen();
			return;
		}
		if (native?.webkitDisplayingFullscreen) {
			native.webkitExitFullscreen?.();
			return;
		}
		if (panel?.requestFullscreen) {
			await panel.requestFullscreen();
			return;
		}
		native?.webkitEnterFullscreen?.();
	}

	function onFullscreenChange() {
		fullscreen.value = Boolean(document.fullscreenElement);
	}

	onMounted(() => {
		if (!import.meta.client) return;
		document.addEventListener("fullscreenchange", onFullscreenChange);
	});

	onBeforeUnmount(() => {
		if (import.meta.client) {
			document.removeEventListener("fullscreenchange", onFullscreenChange);
		}
	});

	return {
		video,
		open,
		muted,
		fullscreen,
		width,
		close,
		reopen,
		setWidth,
		toggleMute,
		requestFullscreen,
	};
}
