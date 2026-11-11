interface TokenResponse {
	access_token?: unknown;
	expires_in?: unknown;
}

interface TrackResponse {
	waveform_url?: unknown;
}

interface WaveformResponse {
	samples?: unknown;
	width?: unknown;
	height?: unknown;
}

export interface SoundCloudWaveform {
	samples: number[];
	width: number;
	height: number;
}

const tokenCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * The waveform image sits on wave.sndcdn.com. Replacing the image suffix with
 * `.json` returns the actual peak samples. Only that host is accepted, so a
 * crafted request can never turn this into an open proxy.
 */
export function waveformJsonUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (url.protocol !== "https:" || url.hostname !== "wave.sndcdn.com") {
		return null;
	}
	if (!/\.(png|jpe?g)$/i.test(url.pathname)) return null;
	return `https://wave.sndcdn.com${url.pathname.replace(/\.(png|jpe?g)$/i, ".json")}`;
}

async function requestToken(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const response = await $fetch<TokenResponse>(
		"https://api.soundcloud.com/oauth2/token",
		{
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "client_credentials",
			}),
			timeout: 4000,
		},
	);
	const token =
		typeof response?.access_token === "string" ? response.access_token : "";
	if (!token) throw new Error("SoundCloud token missing");
	const lifetime = Number(response?.expires_in) || 3600;
	tokenCache.set(clientId, {
		value: token,
		expiresAt: Date.now() + Math.max(lifetime - 60, 30) * 1000,
	});
	return token;
}

async function tokenFor(
	clientId: string,
	clientSecret: string,
	force = false,
): Promise<string> {
	const cached = tokenCache.get(clientId);
	if (!force && cached && cached.expiresAt > Date.now()) return cached.value;
	return requestToken(clientId, clientSecret);
}

async function fetchTrack(
	trackId: string,
	clientId: string,
	clientSecret: string,
): Promise<TrackResponse> {
	const request = (token: string) =>
		$fetch<TrackResponse>(`https://api.soundcloud.com/tracks/${trackId}`, {
			headers: { accept: "application/json", authorization: `OAuth ${token}` },
			timeout: 4000,
		});
	try {
		return await request(await tokenFor(clientId, clientSecret));
	} catch (error) {
		const status = (error as { statusCode?: number } | null)?.statusCode;
		if (status !== 401) throw error;
		tokenCache.delete(clientId);
		return request(await tokenFor(clientId, clientSecret, true));
	}
}

/** Resolve a numeric SoundCloud track id to its peak samples. */
export async function fetchSoundCloudWaveform(
	trackId: string,
	clientId: string,
	clientSecret: string,
): Promise<SoundCloudWaveform> {
	const track = await fetchTrack(trackId, clientId, clientSecret);
	const url = waveformJsonUrl(track?.waveform_url);
	if (!url) throw new Error("SoundCloud waveform missing");
	const wave = await $fetch<WaveformResponse>(url, {
		headers: { accept: "application/json" },
		timeout: 4000,
	});
	const samples = Array.isArray(wave?.samples)
		? wave.samples
				.slice(0, 4000)
				.map((value) => Number(value))
				.filter((value) => Number.isFinite(value))
		: [];
	if (!samples.length) throw new Error("SoundCloud samples missing");
	return {
		samples,
		width: Math.max(1, Number(wave.width) || 1800),
		height: Math.max(1, Number(wave.height) || 140),
	};
}
