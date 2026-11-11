type StreamEvent = "playing" | "pause" | "error";
type Listener = () => void;

const listeners = new Map<StreamEvent, Set<Listener>>();
let audio: HTMLAudioElement | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let usingFallback = false;
let fallbackUrl = "";

function emit(event: StreamEvent) {
	for (const listener of listeners.get(event) || []) listener();
}

function on(event: StreamEvent, listener: Listener) {
	const set = listeners.get(event) || new Set<Listener>();
	set.add(listener);
	listeners.set(event, set);
	return () => set.delete(listener);
}

function clearTimer() {
	if (fallbackTimer) {
		clearTimeout(fallbackTimer);
		fallbackTimer = null;
	}
}

function ensureAudio() {
	if (!import.meta.client) return null;
	if (!audio) {
		audio = new Audio();
		audio.preload = "none";
		audio.addEventListener("playing", () => {
			clearTimer();
			emit("playing");
		});
		audio.addEventListener("pause", () => emit("pause"));
		audio.addEventListener("error", () => {
			clearTimer();
			if (!usingFallback && fallbackUrl) {
				usingFallback = true;
				audio.src = fallbackUrl;
				audio.load();
				void audio.play().catch(() => emit("error"));
				return;
			}
			emit("error");
		});
	}
	return audio;
}

export function useStreamEngine() {
	const config = useRuntimeConfig();
	const primary = String(
		config.public.streamUrl || "https://stream.callshopradio.live/radio.mp3",
	);
	const fallback = String(
		config.public.streamFallbackUrl ||
			"https://icecast.callshopradio.com/callshopradio",
	);

	async function play() {
		if (!import.meta.client) return;
		const el = ensureAudio();
		if (!el) return;
		usingFallback = false;
		fallbackUrl = fallback;
		clearTimer();
		el.src = primary;
		el.load();
		try {
			await el.play();
		} catch {
			emit("error");
			return;
		}
		fallbackTimer = setTimeout(() => {
			if (usingFallback || !el.paused) return;
			if (!fallback) {
				emit("error");
				return;
			}
			usingFallback = true;
			el.src = fallback;
			el.load();
			void el.play().catch(() => emit("error"));
		}, 12_000);
	}

	function pause() {
		clearTimer();
		audio?.pause();
	}

	function destroy() {
		clearTimer();
		if (audio) {
			audio.pause();
			audio.removeAttribute("src");
			audio.load();
		}
	}

	return { play, pause, destroy, on };
}
