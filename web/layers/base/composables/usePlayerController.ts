import { toSetPlayable } from "~/layers/base/utils/setPlayable";
import { usePlayerStore } from "~/stores/playerStore";
import { useSoundCloudEngine } from "./useSoundCloudEngine";
import { useStreamEngine } from "./useStreamEngine";

let wired = false;

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
	}

	async function playSet(item: unknown, cover: string | null = null) {
		const playable = toSetPlayable(item, cover);
		if (!playable.soundcloudUrl) {
			store.setError("Kein Audio für dieses Set");
			return;
		}
		if (store.mode === "stream" && store.playing) stream.pause();
		store.openSet(playable);
		store.setLoading(true);
		store.clearError();
		try {
			await soundcloud.load(playable.soundcloudUrl);
		} catch {
			store.setError("Set konnte nicht geladen werden");
		} finally {
			store.setLoading(false);
		}
	}

	async function playStream() {
		soundcloud.stop();
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

	return { playSet, playStream, toggle, closeSet, seek, pauseForVideo };
}
