// TEMPORARY diagnostic endpoint — remove after the Netlify Blobs cache is
// confirmed working. Surfaces what the `cache` storage mount actually does at
// runtime on Netlify, since blob writes were failing silently (no Blobs tab).
//
// Hit twice a few seconds apart:
//   - `driver` tells us if netlify-blobs is really mounted (vs memory fallback)
//   - `match` confirms write→read works in one request
//   - `previousProbe` on the 2nd call confirms persistence across requests
//   - `error` carries the real runtime failure if writes throw
export default defineEventHandler(async () => {
	const storage = useStorage("cache");

	const result: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		netlifyEnv: Boolean(process.env.NETLIFY),
	};

	// What driver is actually mounted under "cache"?
	try {
		const mounts =
			typeof (storage as { getMounts?: () => unknown }).getMounts === "function"
				? (storage as { getMounts: () => unknown }).getMounts()
				: undefined;
		result.mounts = JSON.parse(
			JSON.stringify(mounts, (_k, v) => (typeof v === "function" ? "[fn]" : v)),
		);
	} catch (err) {
		result.mountsError = (err as Error)?.message;
	}

	// Read what a previous invocation wrote (persistence across requests).
	try {
		result.previousProbe = await storage.getItem("_debug:probe");
	} catch (err) {
		result.previousProbeError = (err as Error)?.message;
	}

	// Write a fresh value and read it straight back (write+read in one request).
	const value = `probe-${Date.now()}`;
	try {
		await storage.setItem("_debug:probe", value);
		const readBack = await storage.getItem("_debug:probe");
		result.wrote = value;
		result.readBack = readBack;
		result.match = readBack === value;
	} catch (err) {
		result.error = (err as Error)?.message;
		result.errorName = (err as Error)?.name;
	}

	// Are real cached detail responses present? (our own key scheme)
	try {
		const keys = await storage.getKeys("sanity-detail");
		result.detailCacheKeyCount = keys.length;
		result.detailCacheKeysSample = keys.slice(0, 8);
	} catch (err) {
		result.detailKeysError = (err as Error)?.message;
	}

	return result;
});
