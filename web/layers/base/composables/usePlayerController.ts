import { usePlayerStore } from "~/stores/playerStore";
import { toSetPlayable } from "~~/layers/base/utils/setPlayable";
import { clampWaveformSamples } from "~~/layers/base/utils/waveform";
import { useSoundCloudEngine } from "./useSoundCloudEngine";
import { useStreamEngine } from "./useStreamEngine";

let wired = false;
let waveformGeneration = 0;

interface WaveformResponse {
	samples?: unknown;
	width?: unknown;
	height?: unknown;
}

export function usePlayerController() {
	const store = usePlayerStore();
	const stream = useStreamEngine();
	const soundcloud = useSoundCloudEngine();

	if (!wired) {
		wired = true;
		stream.on("playing", () => {
			store.setPlaying(true);
			store.setLoading(false);
		});
		stream.on("pause", () => store.setPlaying(false));
		stream.on("error", () => {
			store.setError("Stream antwortet nicht");
			store.setPlaying(false);
			store.setLoading(false);
		});
		soundcloud.on("play", () => {
			store.setPlaying(true);
			store.setLoading(false);
		});
		soundcloud.on("pause", () => store.setPlaying(false));
		soundcloud.on("progress", (payload) => {
			const progress = payload as { positionMs: number; durationMs: number };
			store.setProgress({
				positionMs: progress.positionMs,
				durationMs: progress.durationMs,
			});
		});
		soundcloud.on("finish", () => closeSet());
		soundcloud.on("error", () => {
			store.setError("Set konnte nicht geladen werden");
			store.setPlaying(false);
			store.setLoading(false);
		});
		if (import.meta.client && "mediaSession" in navigator) {
			navigator.mediaSession.setActionHandler("play", () => {
				if (store.mode === "set") soundcloud.play();
				else void playStream();
			});
			navigator.mediaSession.setActionHandler("pause", () => {
				if (store.mode === "set") soundcloud.pause();
				else stream.pause();
			});
			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (
					store.mode !== "set" ||
					typeof details.seekTime !== "number" ||
					!store.progress?.durationMs
				) {
					return;
				}
				soundcloud.seek((details.seekTime * 1000) / store.progress.durationMs);
			});
		}
	}

	async function loadWaveform(trackId: string | null) {
		const generation = ++waveformGeneration;
		store.setWaveform(null);
		if (!trackId) return;
		try {
			const data = await $fetch<WaveformResponse>("/api/player/waveform", {
				query: { id: trackId },
				timeout: 8_000,
			});
			if (generation !== waveformGeneration) return;
			if (store.set?.soundcloudId !== trackId) return;
			const samples = clampWaveformSamples(data?.samples);
			if (!samples) return;
			store.setWaveform({
				samples,
				width: Math.max(1, Number(data?.width) || 1800),
				height: Math.max(1, Number(data?.height) || 140),
			});
		} catch {
			// No waveform is not an error: the thin progress line is the fallback.
		}
	}

	async function playSet(item: unknown, cover: string | null = null) {
		const playable = toSetPlayable(item, cover);
		if (!playable.soundcloudUrl) {
			store.setError("Kein Audio für dieses Set");
			return;
		}
		if (store.mode === "stream" && store.playing) stream.pause();
		store.openSet(playable);
		void loadWaveform(playable.soundcloudId);
		store.setLoading(true);
		store.clearError();
		try {
			await soundcloud.load(playable.soundcloudUrl);
		} catch (error) {
			if ((error as { code?: string } | null)?.code !== "cancelled") {
				store.setError("Set konnte nicht geladen werden");
			}
		} finally {
			store.setLoading(false);
		}
	}

	async function retrySet() {
		const current = store.set;
		if (!current?.soundcloudUrl) return;
		if (!store.waveform) void loadWaveform(current.soundcloudId);
		store.clearError();
		store.setLoading(true);
		try {
			await soundcloud.load(current.soundcloudUrl);
		} catch (error) {
			if ((error as { code?: string } | null)?.code !== "cancelled") {
				store.setError("Set konnte nicht geladen werden");
			}
		} finally {
			store.setLoading(false);
		}
	}

	async function playStream() {
		soundcloud.stop();
		waveformGeneration += 1;
		store.closeSet();
		store.streamWasPlaying = false;
		store.setLoading(true);
		store.clearError();
		try {
			await stream.play();
		} finally {
			store.setLoading(false);
		}
	}

	function toggle() {
		if (store.mode === "set") {
			if (store.error) {
				void retrySet();
				return;
			}
			if (store.playing) soundcloud.pause();
			else soundcloud.play();
			return;
		}
		if (store.playing) stream.pause();
		else void playStream();
	}

	function closeSet() {
		const resume = store.streamWasPlaying;
		soundcloud.stop();
		waveformGeneration += 1;
		store.closeSet();
		if (resume) void playStream();
	}

	function seek(ratio: number) {
		if (store.mode === "set") soundcloud.seek(ratio);
	}

	function pauseForVideo() {
		if (store.mode === "set") soundcloud.pause();
		else stream.pause();
	}

	function syncMediaSession() {
		if (
			!import.meta.client ||
			!("mediaSession" in navigator) ||
			typeof MediaMetadata === "undefined"
		) {
			return;
		}
		const set = store.set;
		const feed = store.feed;
		const title =
			set?.title || feed?.track?.title || feed?.title || "Callshop Radio";
		const artist = set
			? set.artists.map((entry) => entry.name).join(", ")
			: feed?.track?.artist || feed?.subtitle || "";
		const cover = set?.cover || feed?.cover || null;
		navigator.mediaSession.metadata = new MediaMetadata({
			title,
			artist,
			album: "Callshop Radio",
			artwork: cover ? [{ src: cover, sizes: "512x512" }] : [],
		});
	}

	return {
		playSet,
		playStream,
		toggle,
		closeSet,
		seek,
		pauseForVideo,
		retrySet,
		syncMediaSession,
	};
}
