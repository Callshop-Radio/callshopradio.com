import { ref, watch, type Ref } from "vue";

type HlsPlayer = typeof import("hls.js").default;
type HlsInstance = InstanceType<HlsPlayer>;

const RETRY_DELAYS = [2000, 4000, 8000];

export function useHlsLive(
	videoEl: Ref<HTMLVideoElement | null>,
	hlsUrl: Ref<string | null>,
) {
	const state = ref<"idle" | "starting" | "playing" | "error">("idle");
	const error = ref<string | null>(null);
	let hls: HlsInstance | null = null;
	let attempt = 0;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;

	function clearRetry() {
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
	}

	function stop() {
		clearRetry();
		hls?.destroy();
		hls = null;
		if (videoEl.value) {
			videoEl.value.pause();
			videoEl.value.removeAttribute("src");
			videoEl.value.load();
		}
		state.value = "idle";
	}

	function scheduleRetry() {
		const delay = RETRY_DELAYS[attempt];
		if (delay === undefined) {
			state.value = "error";
			error.value = "Video nicht verfügbar";
			return;
		}
		attempt += 1;
		clearRetry();
		retryTimer = setTimeout(() => {
			void start();
		}, delay);
	}

	async function startNative(url: string) {
		const video = videoEl.value;
		if (!video) return;
		video.src = `${url}${url.includes("?") ? "&" : "?"}retry=${Date.now()}`;
		video.load();
		await video.play().catch(() => {
			state.value = "idle";
		});
	}

	async function start() {
		stop();
		const url = hlsUrl.value;
		const video = videoEl.value;
		if (!url || !video) return;

		state.value = "starting";
		error.value = null;

		try {
			const { default: Hls } = await import("hls.js");
			if (Hls.isSupported()) {
				hls = new Hls({
					enableWorker: true,
					lowLatencyMode: false,
					liveSyncDuration: 4,
					liveMaxLatencyDuration: 8,
					maxBufferLength: 6,
					maxMaxBufferLength: 12,
				});
				hls.loadSource(url);
				hls.attachMedia(video);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					void video.play().catch(() => {
						state.value = "idle";
					});
				});
				hls.on(Hls.Events.ERROR, (_event, data) => {
					if (!data?.fatal || !hls) return;
					if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
						hls.recoverMediaError();
						return;
					}
					scheduleRetry();
				});
				return;
			}
			if (video.canPlayType("application/vnd.apple.mpegurl")) {
				await startNative(url);
				return;
			}
			state.value = "error";
			error.value = "Video wird von diesem Browser nicht unterstützt";
		} catch {
			state.value = "error";
			error.value = "Video nicht verfügbar";
		}
	}

	function retry() {
		attempt = 0;
		error.value = null;
		void start();
	}

	const onPlaying = () => {
		state.value = "playing";
		error.value = null;
		attempt = 0;
	};

	watch(
		videoEl,
		(element, previous) => {
			previous?.removeEventListener("playing", onPlaying);
			element?.addEventListener("playing", onPlaying);
		},
		{ immediate: true },
	);

	return { state, error, start, stop, retry };
}
