// Cached server-side proxy for Sanity detail-page queries.
//
// Sanity's CDN can be slow (2–3s cold) for these reference-heavy queries, so
// responses are cached in `useStorage("cache")` — backed by a site-scoped
// Netlify Blob store in production (see nuxt.config.ts), which persists across
// deploys, idle-shutdowns and Function instances.
//
// We manage the cache manually (rather than defineCachedEventHandler) so the
// cache key is fully under our control: a deterministic `sanity-detail:type:slug`.
// Nitro's cached handler runs the key through escapeKey() (strips every dash
// and colon), which both collides distinct dashed slugs and makes the key
// impossible to reconstruct for targeted webhook purges. With our own key the
// /api/revalidate webhook can purge the exact entry on content changes.

import {
	ENTRY_QUERY,
	POOL_PROFILE_QUERY,
	SET_QUERY,
	SHOW_QUERY,
	SLUG_PAGE_QUERY,
} from "~~/queries/sanity.queries";

interface QueryConfig {
	query: string;
	tag: string;
}

const QUERY_MAP: Record<string, QueryConfig> = {
	"show-detail": { query: SHOW_QUERY, tag: "shows" },
	"set-detail": { query: SET_QUERY, tag: "shows" },
	"pool-detail": { query: POOL_PROFILE_QUERY, tag: "pool" },
	"article-detail": { query: ENTRY_QUERY, tag: "words" },
	"slug-page": { query: SLUG_PAGE_QUERY, tag: "page" },
};

interface CacheEntry<T = unknown> {
	data: T;
	mtime: number;
}

// Background-revalidate cadence, NOT a coldness cliff: a hit older than this is
// still served instantly (stale-while-revalidate) and refreshed in the
// background. The Sanity webhook is the real invalidator; this just self-heals
// if a webhook is ever missed.
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// Dedup concurrent fetches for the same key (hover-prefetch + the click that
// follows, or several stale reads triggering revalidation) → one Sanity fetch.
const inflight = new Map<string, Promise<unknown>>();

/** Deterministic cache key shared with the /api/revalidate webhook. */
export function sanityDetailCacheKey(type: string, slug: string): string {
	return `sanity-detail:${type}:${slug}`;
}

function fetchAndStore(
	storage: ReturnType<typeof useStorage>,
	key: string,
	query: string,
	slug: string,
): Promise<unknown> {
	let promise = inflight.get(key);
	if (!promise) {
		const sanity = useSanity();
		promise = sanity.client
			.fetch(query, { slug })
			.then(async (data) => {
				await storage
					.setItem(key, { data, mtime: Date.now() } satisfies CacheEntry)
					.catch(() => {});
				return data;
			})
			.finally(() => inflight.delete(key));
		inflight.set(key, promise);
	}
	return promise;
}

export default defineEventHandler(async (event) => {
	const type = getRouterParam(event, "type") ?? "";
	const queryParams = getQuery(event);
	const slug = typeof queryParams.slug === "string" ? queryParams.slug : "";

	const config = QUERY_MAP[type];
	if (!config) {
		throw createError({
			statusCode: 400,
			statusMessage: `Unknown detail type: ${type}`,
		});
	}
	if (!slug) {
		throw createError({ statusCode: 400, statusMessage: "Missing slug" });
	}

	setHeader(event, "Netlify-Cache-Tag", config.tag);

	const storage = useStorage("cache");
	const key = sanityDetailCacheKey(type, slug);

	const cached = await storage.getItem<CacheEntry>(key).catch(() => null);
	if (cached) {
		// Stale-while-revalidate: serve the cached value immediately, always. If
		// it's past the refresh cadence, revalidate in the background — kept alive
		// via waitUntil so the write finishes before the Function freezes.
		if (Date.now() - cached.mtime > MAX_AGE_MS) {
			const revalidation = fetchAndStore(
				storage,
				key,
				config.query,
				slug,
			).catch(() => {});
			event.waitUntil?.(revalidation);
		}
		return cached.data;
	}

	// True miss (first load or after a webhook purge) — must fetch once.
	return fetchAndStore(storage, key, config.query, slug);
});
