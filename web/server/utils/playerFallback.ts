import type {
	PlayerFeed,
	PlayerTrack,
	PlayerVideo,
} from "../../types/player.ts";

interface FeedOptions {
	audioUrl: string;
	fallbackUrl?: string;
	video?: PlayerVideo | null;
}

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function baseFeed({
	state,
	title,
	subtitle,
	track,
	audio,
	video,
	source,
}: {
	state: PlayerFeed["state"];
	title: string;
	subtitle: string | null;
	track: PlayerTrack | null;
	audio: PlayerFeed["audio"];
	video: PlayerVideo | null;
	source: NonNullable<PlayerFeed["source"]>;
}): PlayerFeed {
	return {
		version: 1,
		updatedAt: new Date().toISOString(),
		state,
		audio,
		video,
		title,
		subtitle,
		cover: null,
		show: null,
		set: null,
		artists: [],
		track,
		progress: null,
		tracklist: null,
		source,
	};
}

/** AzuraCast now playing is display data only; it carries no editorial links. */
export function feedFromAzuraCast(
	np: unknown,
	options: FeedOptions,
): PlayerFeed {
	const station = Array.isArray(np) ? np[0] : np;
	if ((station as { is_online?: unknown } | null)?.is_online === false) {
		return offlineFeed(options);
	}
	const song = (
		station as {
			now_playing?: { song?: { title?: unknown; artist?: unknown } };
		} | null
	)?.now_playing?.song;
	const title = text(song?.title) || "AutoDJ";
	const artist = text(song?.artist) || null;
	return baseFeed({
		state: "auto",
		title,
		subtitle: artist,
		track: song ? { title, artist } : null,
		audio: { url: options.audioUrl, fallbackUrl: options.fallbackUrl },
		video: options.video ?? null,
		source: "azura",
	});
}

function mainIcecastSource(
	status: unknown,
): { title?: unknown; artist?: unknown } | null {
	const raw = (status as { icestats?: { source?: unknown } } | null)?.icestats
		?.source;
	const sources = Array.isArray(raw) ? raw : raw ? [raw] : [];
	return (
		(sources.find((source) => {
			const url = text((source as { listenurl?: unknown } | null)?.listenurl);
			return (
				url.includes("/callshopradio") && !url.includes("callshopradio-wien")
			);
		}) as { title?: unknown; artist?: unknown } | undefined) ?? null
	);
}

/** Icecast status JSON is the last metadata fallback; no links. */
export function feedFromIcecast(
	status: unknown,
	options: FeedOptions,
): PlayerFeed {
	const source = mainIcecastSource(status);
	if (!source) return offlineFeed(options);
	const title = text(source?.title) || "Callshop Radio";
	const artist = text(source?.artist) || null;
	return baseFeed({
		state: "auto",
		title,
		subtitle: artist,
		track: source ? { title, artist } : null,
		audio: { url: options.audioUrl, fallbackUrl: options.fallbackUrl },
		video: options.video ?? null,
		source: "icecast",
	});
}

export function offlineFeed(options: FeedOptions): PlayerFeed {
	return baseFeed({
		state: "offline",
		title: "Callshop Radio",
		subtitle: "Stream nicht erreichbar",
		track: null,
		audio: { url: options.audioUrl, fallbackUrl: options.fallbackUrl },
		video: options.video ?? null,
		source: "fallback",
	});
}

export function videoFromStatus(
	payload: unknown,
	options: { hlsUrl: string; title?: string },
): PlayerVideo | null {
	const live = (payload as { live?: unknown } | null)?.live;
	if (live !== true && live !== false) return null;
	const sinceRaw = (payload as { since?: unknown } | null)?.since;
	const since =
		typeof sinceRaw === "string" &&
		sinceRaw &&
		!Number.isNaN(Date.parse(sinceRaw))
			? sinceRaw
			: null;
	return {
		live,
		since,
		hlsUrl: options.hlsUrl,
		title: text(options.title) || "Live Video",
	};
}

export function unknownFeed(options: FeedOptions): PlayerFeed {
	return baseFeed({
		state: "unknown",
		title: "Callshop Radio",
		subtitle: "Live",
		track: null,
		audio: { url: options.audioUrl, fallbackUrl: options.fallbackUrl },
		video: options.video ?? null,
		source: "fallback",
	});
}
