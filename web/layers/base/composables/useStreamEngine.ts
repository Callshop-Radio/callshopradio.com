type StreamEvent = "playing" | "pause" | "error";
type Listener = () => void;

const listeners = new Map<StreamEvent, Set<Listener>>();
let audio: HTMLAudioElement | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let usingFallback = false;
let fallbackUrl = "";
/** A paused player must never resume on its own — not on a dropped connection,
 *  not through the fallback switch. */
let pausedByUser = false;

/**
 * The stream may die while the listener has paused. Switching to the fallback
 * and calling play() there is what made a paused player start again on its own,
 * so the switch only happens for a player the user actually wants running.
 */
export function shouldAutoFallback({
	paused,
	usingFallback: alreadyOnFallback,
}: {
	paused: boolean;
	usingFallback: boolean;
}): boolean {
	return !paused && !alreadyOnFallback;
}

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
			// A paused player stays paused: the connection may drop after a long
			// pause, and resuming here is exactly the bug we are fixing.
			if (
				fallbackUrl &&
				shouldAutoFallback({
					paused: pausedByUser,
					usingFallback,
				})
			) {
				usingFallback = true;
				element.src = fallbackUrl;
				element.load();
				void element.play().catch(() => emit("error"));
				return;
			}
			if (!pausedByUser) emit("error");
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
		pausedByUser = false;
		usingFallback = false;
		fallbackUrl = fallback;
		clearTimer();
		el.src = primary;
		el.load();
		fallbackTimer = setTimeout(() => {
			if (pausedByUser) return;
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
		pausedByUser = true;
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
