// Cached server-side proxy for Sanity detail-page queries.
//
// Sanity's CDN can return cold for these reference-heavy queries in 2–3s.
// Wrapping them in defineCachedEventHandler collapses that to one origin
// call per (type, slug) — every other user (and SPA navigation) gets the
// response from the cache instantly. On Netlify the cache is backed by a
// site-scoped Blob store (see nuxt.config.ts nitro.storage.cache), so the
// cached entry survives deploys, idle-shutdowns and is shared across
// Function instances. The /api/revalidate webhook purges the matching
// keys on every Sanity content change; the long TTL below is only a
// safety net for the rare missed webhook.

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

export default defineCachedEventHandler(
	async (event) => {
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

		const sanity = useSanity();
		return await sanity.client.fetch(config.query, { slug });
	},
	{
		name: "sanity-detail",
		// 30 days — the Sanity webhook is the primary invalidator; TTL is just
		// a backstop for missed webhooks. SWR keeps users from waiting on a
		// re-fetch when an entry expires: stale is served while the next
		// request triggers background revalidation.
		maxAge: 60 * 60 * 24 * 30,
		swr: true,
		getKey: (event) => {
			const type = getRouterParam(event, "type") ?? "unknown";
			const queryParams = getQuery(event);
			const slug = typeof queryParams.slug === "string" ? queryParams.slug : "";
			return `${type}:${slug}`;
		},
	},
);
