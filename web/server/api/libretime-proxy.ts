// LibreTime is queried server-side so the API key never reaches the browser.
// `path` is appended to a hardcoded base URL — accepting an arbitrary
// `endpoint` URL would be SSRF + key-leak surface.
const LIBRETIME_BASE_URL = "https://libretime.callshopradio.com";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const query = getQuery(event);

	const path = typeof query.path === "string" ? query.path : "";
	if (!path.startsWith("/")) {
		throw createError({
			statusCode: 400,
			statusMessage: "path must start with '/'",
		});
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (config.libretimeApiKey) {
		headers.Authorization = `Api-Key ${config.libretimeApiKey}`;
	}

	try {
		return await $fetch(`${LIBRETIME_BASE_URL}${path}`, {
			headers,
			ignoreResponseError: true,
		});
	} catch (error) {
		console.error("[LibreTime Proxy] Error fetching:", error);
		throw createError({
			statusCode: 502,
			statusMessage: "Failed to fetch data from LibreTime API",
		});
	}
});
