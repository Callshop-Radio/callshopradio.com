/**
 * Prefetches the Sanity payload for a detail route (show, set, pool profile,
 * article, generic slug page) on hover/touch-start, so the subsequent click
 * resolves synchronously from the payload cache instead of suspending for a
 * fresh network round-trip.
 *
 * Hits the same /api/sanity/detail/{type} endpoint as useDetailSanityQuery,
 * so Nitro's defineCachedEventHandler dedupes the request: a hover-prefetch
 * already in flight is reused by the actual navigation rather than racing it.
 */
interface PrefetchTarget {
	keyPrefix: string;
	slug: string;
}

const ARCHIVE_SEGMENTS = new Set([
	"",
	"shows",
	"pool",
	"words",
	"schedule",
	"search",
]);

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
	if (parts.length === 1 && !ARCHIVE_SEGMENTS.has(first)) {
		return { keyPrefix: "slug-page", slug: first };
	}
	return null;
}

const inFlight = new WeakMap<object, Set<string>>();

export function usePrefetchRoute() {
	const nuxtApp = useNuxtApp();

	function prefetchRoute(path?: string | null) {
		if (!path || import.meta.server) return;

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
			});
	}

	return { prefetchRoute };
}
