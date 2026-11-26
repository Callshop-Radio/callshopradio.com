import { fetchSoundCloudWaveform } from "../../utils/soundcloudWaveform";

interface WaveformConfig {
	soundcloudClientId?: string;
	soundcloudClientSecret?: string;
}

/**
 * Server-only SoundCloud proxy. The client sends a numeric track id; the
 * client id/secret stay on the server and the peak samples are cached for a
 * day, so opening a set costs at most one SoundCloud request per track.
 */
export default defineCachedEventHandler(
	async (event) => {
		const trackId = String(getQuery(event).id ?? "");
		if (!/^\d{1,20}$/.test(trackId)) {
			throw createError({ statusCode: 400, statusMessage: "invalid track id" });
		}

		const config = useRuntimeConfig(event) as unknown as WaveformConfig;
		const clientId = String(config.soundcloudClientId || "");
		const clientSecret = String(config.soundcloudClientSecret || "");
		if (!clientId || !clientSecret) {
			throw createError({
				statusCode: 503,
				statusMessage: "waveform unavailable",
			});
		}

		try {
			const waveform = await fetchSoundCloudWaveform(
				trackId,
				clientId,
				clientSecret,
			);
			setHeader(
				event,
				"cache-control",
				"public, max-age=86400, s-maxage=604800",
			);
			return waveform;
		} catch {
			throw createError({
				statusCode: 502,
				statusMessage: "waveform unavailable",
			});
		}
	},
	{
		maxAge: 86_400,
		swr: true,
		name: "player-waveform",
		getKey: (event) => `player-waveform:${String(getQuery(event).id ?? "")}`,
	},
);
