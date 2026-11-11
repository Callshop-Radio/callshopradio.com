// Consolidated live-status endpoint.
//
// Fans out to LibreTime (Düsseldorf, auth via server-only key), Icecast, and
// LibreTime Wien. Cached for 15s with SWR so N clients map to ≤ 1 origin call
// per 15s window instead of N × 3 every 20s.

interface LibreTimeLiveInfo {
	sources?: {
		livedj?: string;
		masterdj?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface IcecastStatus {
	[key: string]: unknown;
}

interface StreamStatusResponse {
	stream1: {
		onAirLight: Record<string, boolean>;
		liveData: LibreTimeLiveInfo;
		icecastData: IcecastStatus;
	};
	stream2: {
		onAirLight: Record<string, boolean>;
		liveData: LibreTimeLiveInfo;
	};
	liveGate: LiveGate | null;
}

interface LiveGateTrack {
	title: string;
	artist: string | null;
}

interface LiveGate {
	live: boolean;
	show: { id: string | null; title: string | null } | null;
	city: { id: string | null; name: string } | null;
	genres: string[];
	artists: { id: string; name: string; slug: string | null }[];
	currentTrack: LiveGateTrack | null;
	lastTrack: LiveGateTrack | null;
	tracklist: LiveGateTrack[];
}

const LIBRETIME_BASE = "https://libretime.callshopradio.com";
const ICECAST_URL = "https://icecast.callshopradio.com/status-json.xsl";
const WIEN_URL = "https://wien.callshopradio.com/api/live-info-v2?days=7";
const LIVE_GATE_URL = "https://air.callshopradio.live/api/public/live";

// LibreTime is offline during the PHP zero-day transition. It answers 403 with
// an HTML error page; normalize anything that is not a JSON object to null so
// `liveData` never becomes a string. The timeout keeps the endpoint responsive
// if an origin is unreachable instead of returning an error page.
const fetchJson = async <T>(
	url: string,
	headers?: Record<string, string>,
): Promise<T | null> => {
	const data = await $fetch<T>(url, {
		headers,
		ignoreResponseError: true,
		timeout: 3000,
	}).catch(() => null);

	return data && typeof data === "object" ? data : null;
};

const deriveOnAirLight = (
	liveData: LibreTimeLiveInfo | null,
): Record<string, boolean> => {
	if (!liveData?.sources) return {};
	return {
		on_air_light:
			liveData.sources.livedj === "on" || liveData.sources.masterdj === "on",
		live_stream: liveData.sources.livedj === "on",
		live_stream_on_air: liveData.sources.livedj === "on",
		master_stream: liveData.sources.masterdj === "on",
		master_stream_on_air: liveData.sources.masterdj === "on",
	};
};

export default defineCachedEventHandler(
	async (): Promise<StreamStatusResponse> => {
		const config = useRuntimeConfig();
		const libretimeHeaders: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (config.libretimeApiKey) {
			libretimeHeaders.Authorization = `Api-Key ${config.libretimeApiKey}`;
		}

		const [liveData1, icecastData, liveData2, liveGate] = await Promise.all([
			fetchJson<LibreTimeLiveInfo>(
				`${LIBRETIME_BASE}/api/live-info-v2`,
				libretimeHeaders,
			),
			fetchJson<IcecastStatus>(ICECAST_URL),
			fetchJson<LibreTimeLiveInfo>(WIEN_URL),
			fetchJson<LiveGate>(LIVE_GATE_URL),
		]);

		return {
			stream1: {
				onAirLight: deriveOnAirLight(liveData1),
				liveData: liveData1 ?? {},
				icecastData: icecastData ?? {},
			},
			stream2: {
				onAirLight: deriveOnAirLight(liveData2),
				liveData: liveData2 ?? {},
			},
			liveGate: liveGate ?? null,
		};
	},
	{
		maxAge: 15,
		swr: true,
		name: "stream-status",
	},
);
