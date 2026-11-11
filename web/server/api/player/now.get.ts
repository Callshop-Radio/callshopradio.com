import type { PlayerFeed, PlayerVideo } from "../../../types/player";
import {
	feedFromAzuraCast,
	feedFromIcecast,
	unknownFeed,
	videoFromStatus,
} from "../../utils/playerFallback";

const STREAM_BASE = "https://stream.callshopradio.live";
const MANAGER_FEED = "/api/public/player?channel=callshop-radio";

interface FeedConfig {
	managerBaseUrl?: string;
	videoStatusUrl?: string;
	videoHlsUrl?: string;
	public: {
		streamUrl?: string;
		streamFallbackUrl?: string;
	};
}

async function fetchJson<T>(url: string, timeout: number): Promise<T | null> {
	try {
		const data = await $fetch<T>(url, {
			timeout,
			ignoreResponseError: true,
			headers: { accept: "application/json" },
		});
		return data ?? null;
	} catch {
		return null;
	}
}

let lastGoodFeed: PlayerFeed | null = null;
let lastGoodAt = 0;
const LAST_GOOD_MS = 5 * 60_000;
const TOTAL_BUDGET_MS = 3_000;

function lastGoodOrUnknown(audioUrl: string, fallbackUrl: string): PlayerFeed {
	if (lastGoodFeed && Date.now() - lastGoodAt < LAST_GOOD_MS) {
		return { ...lastGoodFeed, updatedAt: new Date().toISOString() };
	}
	return unknownFeed({ audioUrl, fallbackUrl });
}

/**
 * One cached endpoint for the row and the video panel. The manager is the only
 * source with editorial links; AzuraCast, the static copy and Icecast keep the
 * title/artist alive when the manager is unavailable.
 */
export default defineCachedEventHandler(
	async (event): Promise<PlayerFeed> => {
		const config = useRuntimeConfig(event) as unknown as FeedConfig;
		const audioUrl = String(
			config.public?.streamUrl || "https://stream.callshopradio.live/radio.mp3",
		);
		const fallbackUrl = String(
			config.public?.streamFallbackUrl ||
				"https://icecast.callshopradio.com/callshopradio",
		);
		const managerBase = String(
			config.managerBaseUrl || "https://air.callshopradio.live",
		).replace(/\/+$/, "");
		const videoStatusUrl = String(
			config.videoStatusUrl || "https://video.callshopradio.live/api/live",
		);
		const videoHlsUrl = String(
			config.videoHlsUrl ||
				"https://video.callshopradio.live/hls/live/index.m3u8",
		);

		setHeader(event, "cache-control", "no-store");

		const deadline = Date.now() + TOTAL_BUDGET_MS;
		async function fetchWithin<T>(
			url: string,
			maxTimeout: number,
		): Promise<T | null> {
			const remaining = deadline - Date.now();
			if (remaining <= 0) return null;
			return fetchJson<T>(url, Math.min(maxTimeout, remaining));
		}

		let managerFallback: PlayerFeed | null = null;
		try {
			const manager = await fetchWithin<PlayerFeed>(
				`${managerBase}${MANAGER_FEED}`,
				1_500,
			);
			if (manager?.version === 1) {
				if (manager.state !== "unknown") {
					manager.source = "manager";
					manager.audio = {
						...manager.audio,
						fallbackUrl: manager.audio?.fallbackUrl || fallbackUrl,
					};
					lastGoodFeed = manager;
					lastGoodAt = Date.now();
					return manager;
				}
				managerFallback = manager;
			}

			let feed: PlayerFeed | null = null;

			const nowPlaying = await fetchWithin<unknown[] | Record<string, unknown>>(
				`${STREAM_BASE}/api/nowplaying`,
				1_000,
			);
			if (nowPlaying) {
				const station = Array.isArray(nowPlaying) ? nowPlaying[0] : nowPlaying;
				feed = feedFromAzuraCast(station, { audioUrl, fallbackUrl });
			}

			if (!feed) {
				const staticNowPlaying = await fetchWithin<Record<string, unknown>>(
					`${STREAM_BASE}/api/nowplaying_static/callshopradio.json`,
					1_000,
				);
				if (staticNowPlaying) {
					feed = feedFromAzuraCast(staticNowPlaying, { audioUrl, fallbackUrl });
				}
			}

			if (!feed) {
				const icecast = await fetchWithin<Record<string, unknown>>(
					`${STREAM_BASE}/status-json.xsl`,
					500,
				);
				if (icecast?.icestats) {
					feed = feedFromIcecast(icecast, { audioUrl, fallbackUrl });
				}
			}

			const chosen =
				feed || managerFallback || lastGoodOrUnknown(audioUrl, fallbackUrl);

			if (chosen.state !== "unknown") {
				lastGoodFeed = chosen;
				lastGoodAt = Date.now();
			}

			if (chosen.source !== "manager" && !chosen.video) {
				const videoPayload = await fetchJson<Record<string, unknown>>(
					videoStatusUrl,
					500,
				);
				const video: PlayerVideo | null = videoFromStatus(videoPayload, {
					hlsUrl: videoHlsUrl,
					title: chosen.show?.title || "Live Video",
				});
				if (video?.live) chosen.video = video;
			}

			return chosen.state === "unknown"
				? lastGoodOrUnknown(audioUrl, fallbackUrl)
				: chosen;
		} catch {
			return managerFallback || lastGoodOrUnknown(audioUrl, fallbackUrl);
		}
	},
	{ maxAge: 10, swr: true, name: "public-player" },
);
