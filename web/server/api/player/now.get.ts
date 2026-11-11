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

		let managerFallback: PlayerFeed | null = null;
		try {
			const manager = await fetchJson<PlayerFeed>(
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
					return manager;
				}
				managerFallback = manager;
			}

			let feed: PlayerFeed | null = null;

			const nowPlaying = await fetchJson<unknown[] | Record<string, unknown>>(
				`${STREAM_BASE}/api/nowplaying`,
				1_000,
			);
			if (nowPlaying) {
				const station = Array.isArray(nowPlaying) ? nowPlaying[0] : nowPlaying;
				feed = feedFromAzuraCast(station, { audioUrl, fallbackUrl });
			}

			if (!feed) {
				const staticNowPlaying = await fetchJson<Record<string, unknown>>(
					`${STREAM_BASE}/api/nowplaying_static/callshopradio.json`,
					1_000,
				);
				if (staticNowPlaying) {
					feed = feedFromAzuraCast(staticNowPlaying, { audioUrl, fallbackUrl });
				}
			}

			if (!feed) {
				const icecast = await fetchJson<Record<string, unknown>>(
					`${STREAM_BASE}/status-json.xsl`,
					500,
				);
				if (icecast?.icestats) {
					feed = feedFromIcecast(icecast, { audioUrl, fallbackUrl });
				}
			}

			const chosen = feed || managerFallback || unknownFeed({ audioUrl, fallbackUrl });

			if (chosen.source !== "manager" && !chosen.video) {
				const videoPayload = await fetchJson<Record<string, unknown>>(
					videoStatusUrl,
					500,
				);
				const video: PlayerVideo | null = videoFromStatus(videoPayload, {
					hlsUrl: videoHlsUrl,
					title: chosen.title,
				});
				if (video?.live) chosen.video = video;
			}

			return chosen;
		} catch {
			return managerFallback || unknownFeed({ audioUrl, fallbackUrl });
		}
	},
	{ maxAge: 10, swr: true, name: "public-player" },
);
