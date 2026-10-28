/**
 * Prefetches the Sanity payload for a detail route (show, set, pool profile,
 * article, generic slug page) so the subsequent click resolves from the payload
 * cache instead of suspending for a fresh network round-trip.
 *
 * Hover/focus/touch/pointerdown prefetches immediately. Cards may opt into a
 * low-priority proximity prefetch (first related row), which waits until the
 * card is near the viewport and is queued behind a small concurrency limit.
 * Slow connections and save-data mode are left alone.
 *
 * Hits the same /api/sanity/detail/{type} endpoint as useDetailSanityQuery, so
 * Nitro's defineCachedEventHandler dedupes the request: a prefetch already in
 * flight is reused by the actual navigation rather than racing it.
 */
interface PrefetchTarget {
	keyPrefix: string;
	slug: string;
}

interface PrefetchOptions {
	/** Low-priority background prefetch, queued and concurrency-limited. */
	proximity?: boolean;
}

type NetworkInformation = {
	effectiveType?: string;
	saveData?: boolean;
};

const ARCHIVE_SEGMENTS = new Set([
	"",
	"shows",
	"pool",
	"words",
	"schedule",
	"search",
]);

const PROXIMITY_CONCURRENCY = 2;

let activeProximityPrefetches = 0;
const proximityQueue: Array<() => void> = [];

function parseRoute(path: string): PrefetchTarget | null {
	if (!path) return null;

	const stripped = path.replace(/^\/[a-z]{2}(\/|$)/, "/").replace(/^\//, "");
	const parts = stripped.split("/").filter(Boolean);

	if (parts.length === 0) return null;

	const [first, second, third] = parts;

	if (first === "shows" && third) {
		return { keyPrefix: "set-detail", slug: third };
	}
	if (first === "shows" && second) {
		return { keyPrefix: "show-detail", slug: second };
	}
	if (first === "pool" && second) {
		return { keyPrefix: "pool-detail", slug: second };
	}
	if (first === "words" && second) {
		return { keyPrefix: "article-detail", slug: second };
	}
	if (parts.length === 1 && first && !ARCHIVE_SEGMENTS.has(first)) {
		return { keyPrefix: "slug-page", slug: first };
	}
	return null;
}

function shouldSkipPrefetch() {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return true;
	}
	if (document.visibilityState !== "visible") return true;

	const connection = (
		navigator as Navigator & {
			connection?: NetworkInformation;
		}
	).connection;

	if (connection?.saveData) return true;
	if (
		connection?.effectiveType &&
		["slow-2g", "2g", "3g"].includes(connection.effectiveType)
	) {
		return true;
	}

	return false;
}

function finishProximityPrefetch() {
	activeProximityPrefetches = Math.max(0, activeProximityPrefetches - 1);
	const next = proximityQueue.shift();
	if (!next) return;
	activeProximityPrefetches += 1;
	next();
}

function queueProximityPrefetch(task: () => void) {
	if (activeProximityPrefetches < PROXIMITY_CONCURRENCY) {
		activeProximityPrefetches += 1;
		task();
		return;
	}
	proximityQueue.push(task);
}

const inFlight = new WeakMap<object, Set<string>>();

export function usePrefetchRoute() {
	const nuxtApp = useNuxtApp();

	function prefetchRoute(path?: string | null, options: PrefetchOptions = {}) {
		if (!path || import.meta.server || shouldSkipPrefetch()) return;

		const target = parseRoute(path);
		if (!target) return;

		const key = `${target.keyPrefix}-${target.slug}`;
		if (nuxtApp.payload.data[key] !== undefined) return;

		let bucket = inFlight.get(nuxtApp);
		if (!bucket) {
			bucket = new Set();
			inFlight.set(nuxtApp, bucket);
		}
		if (bucket.has(key)) return;
		bucket.add(key);

		const run = () => {
			if (shouldSkipPrefetch()) {
				bucket?.delete(key);
				if (options.proximity) finishProximityPrefetch();
				return;
			}

			$fetch(`/api/sanity/detail/${target.keyPrefix}`, {
				query: { slug: target.slug },
			})
				.then((data) => {
					nuxtApp.payload.data[key] = data ?? null;
				})
				.catch(() => {
					// Swallow — the real navigation will surface any error.
				})
				.finally(() => {
					bucket?.delete(key);
					if (options.proximity) finishProximityPrefetch();
				});
		};

		if (options.proximity) {
			queueProximityPrefetch(run);
			return;
		}

		// Hover/focus/tap is direct user intent and bypasses the background queue.
		run();
	}

	return { prefetchRoute };
}
