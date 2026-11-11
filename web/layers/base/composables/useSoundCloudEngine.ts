type SoundCloudEvent =
	| "ready"
	| "play"
	| "pause"
	| "progress"
	| "finish"
	| "error";
type Progress = { positionMs: number; durationMs: number };
type Listener = (payload?: unknown) => void;
type WidgetApi = {
	bind: (event: string, handler: (payload?: unknown) => void) => void;
	play: () => void;
	pause: () => void;
	seekTo: (positionMs: number) => void;
	getDuration: (callback: (durationMs: number) => void) => void;
};

const listeners = new Map<SoundCloudEvent, Set<Listener>>();
let container: HTMLDivElement | null = null;
let iframe: HTMLIFrameElement | null = null;
let widget: WidgetApi | null = null;
let apiPromise: Promise<unknown> | null = null;
let durationMs = 0;

function emit(event: SoundCloudEvent, payload?: unknown) {
	for (const listener of listeners.get(event) || []) listener(payload);
}

function on(event: SoundCloudEvent, listener: Listener) {
	const set = listeners.get(event) || new Set<Listener>();
	set.add(listener);
	listeners.set(event, set);
	return () => set.delete(listener);
}

function loadApi(): Promise<unknown> {
	if (!import.meta.client) return Promise.resolve(null);
	const existing = (window as unknown as { SC?: unknown }).SC;
	if (existing) return Promise.resolve(existing);
	if (apiPromise) return apiPromise;
	apiPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://w.soundcloud.com/player/api.js";
		script.onload = () => resolve((window as unknown as { SC?: unknown }).SC);
		script.onerror = () => reject(new Error("SoundCloud API konnte nicht geladen werden"));
		document.body.appendChild(script);
	});
	return apiPromise;
}

function emitProgress(positionMs: number) {
	if (durationMs <= 0 && positionMs <= 0) return;
	emit("progress", { positionMs, durationMs } satisfies Progress);
}

function destroy() {
	widget = null;
	durationMs = 0;
	if (container) {
		container.remove();
		container = null;
		iframe = null;
	}
}

async function load(url: string) {
	destroy();
	const SC = (await loadApi()) as
		| { Widget?: (element: HTMLIFrameElement) => WidgetApi }
		| null;
	if (!SC?.Widget) throw new Error("SoundCloud Widget API fehlt");

	container = document.createElement("div");
	container.setAttribute("aria-hidden", "true");
	container.style.cssText =
		"position:fixed;left:-9999px;bottom:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
	iframe = document.createElement("iframe");
	iframe.title = "SoundCloud";
	iframe.tabIndex = -1;
	iframe.allow = "autoplay";
	iframe.width = "100%";
	iframe.height = "100%";
	iframe.scrolling = "no";
	iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
		url,
	)}&color=%23f794b3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;
	container.appendChild(iframe);
	document.body.appendChild(container);

	await new Promise<void>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error("SoundCloud Player antwortet nicht")),
			10_000,
		);
		iframe?.addEventListener(
			"load",
			() => {
				clearTimeout(timer);
				resolve();
			},
			{ once: true },
		);
	});

	const instance = SC.Widget(iframe);
	widget = instance;
	instance.bind("ready", () => {
		instance.getDuration((value) => {
			durationMs = Number(value) || 0;
			emitProgress(0);
		});
		emit("ready");
		instance.play();
	});
	instance.bind("play", () => emit("play"));
	instance.bind("pause", () => emit("pause"));
	instance.bind("finish", () => emit("finish"));
	instance.bind("playProgress", (payload) => {
		const positionMs = Number(
			(payload as { currentPosition?: unknown } | null)?.currentPosition,
		);
		emitProgress(Number.isFinite(positionMs) ? positionMs : 0);
	});
	instance.bind("error", () => emit("error"));
}

function play() {
	widget?.play();
}

function pause() {
	widget?.pause();
}

function seek(ratio: number) {
	if (!widget || durationMs <= 0) return;
	const safe = Math.min(Math.max(ratio, 0), 1);
	widget.seekTo(Math.round(durationMs * safe));
}

export function useSoundCloudEngine() {
	return { load, play, pause, seek, stop: destroy, on };
}
