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
}

const LIBRETIME_BASE = "https://libretime.callshopradio.com";
const ICECAST_URL = "https://icecast.callshopradio.com/status-json.xsl";
const WIEN_URL = "https://wien.callshopradio.com/api/live-info-v2?days=7";

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

		const [liveData1, icecastData, liveData2] = await Promise.all([
			$fetch<LibreTimeLiveInfo>(`${LIBRETIME_BASE}/api/live-info-v2`, {
				headers: libretimeHeaders,
				ignoreResponseError: true,
			}).catch(() => null),
			$fetch<IcecastStatus>(ICECAST_URL).catch(() => null),
			$fetch<LibreTimeLiveInfo>(WIEN_URL).catch(() => null),
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
		};
	},
	{
		maxAge: 15,
		swr: true,
		name: "stream-status",
	},
);
