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
		const element = new Audio();
		audio = element;
		element.preload = "none";
		element.addEventListener("playing", () => {
			emit("playing");
		});
		element.addEventListener("pause", () => {
			clearTimer();
			emit("pause");
		});
		element.addEventListener("timeupdate", () => {
			if (element.currentTime > 0.1) clearTimer();
		});
		element.addEventListener("error", () => {
			clearTimer();
			if (!usingFallback && fallbackUrl) {
				usingFallback = true;
				element.src = fallbackUrl;
				element.load();
				void element.play().catch(() => emit("error"));
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
		fallbackTimer = setTimeout(() => {
			if (usingFallback || el.currentTime > 0.1) return;
			if (!fallback) {
				emit("error");
				return;
			}
			usingFallback = true;
			el.src = fallback;
			el.load();
			void el.play().catch(() => emit("error"));
		}, 12_000);
		try {
			await el.play();
		} catch {
			emit("error");
		}
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
