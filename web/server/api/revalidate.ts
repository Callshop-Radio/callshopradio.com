import { createHmac } from "node:crypto";

interface SanityWebhookPayload {
	_type: string;
	_id: string;
	slug?: { current: string };
	show?: { _ref: string };
}

interface RevalidateResponse {
	success: boolean;
	purged: string[];
	detailKeys: string[];
	tags: string[];
	edgePurge: "ok" | "skipped" | "failed";
	timestamp: string;
	message?: string;
}

// Maps Sanity _type → keyPrefix used by /api/sanity/detail/{type} so the
// webhook can purge the matching cached detail responses.
const DETAIL_KEY_PREFIX_BY_TYPE: Record<string, string> = {
	show: "show-detail",
	set: "set-detail",
	person: "pool-detail",
	venue: "pool-detail",
	article: "article-detail",
	page: "slug-page",
};

// Maps a Sanity document _type to the Netlify-Cache-Tag(s) set on the
// affected route group(s). Tags match the headers in nuxt.config.ts routeRules.
const TAGS_BY_TYPE: Record<string, string[]> = {
	show: ["shows", "home"],
	set: ["shows"],
	person: ["pool", "shows"],
	venue: ["pool"],
	article: ["words"],
	home: ["home"],
	page: ["page"],
	pool: ["pool"],
	showsArchive: ["shows"],
	words: ["words"],
	timetable: ["schedule"],
};

export default defineEventHandler(
	async (event): Promise<RevalidateResponse> => {
		const body = await readBody<SanityWebhookPayload>(event);
		const signature = getHeader(event, "sanity-webhook-signature");
		const config = useRuntimeConfig();

		const secret = config.sanityWebhookSecret;
		if (secret && signature) {
			const expectedSignature = createHmac("sha256", secret)
				.update(JSON.stringify(body))
				.digest("hex");

			if (signature !== expectedSignature) {
				console.warn("⚠️ Invalid webhook signature received");
				throw createError({
					statusCode: 401,
					message: "Invalid webhook signature",
				});
			}
		}

		const routesToPurge: string[] = [];

		switch (body._type) {
			case "show":
				routesToPurge.push("/shows");
				if (body.slug?.current) {
					routesToPurge.push(`/shows/${body.slug.current}`);
				}
				routesToPurge.push("/");
				break;

			case "set":
				routesToPurge.push("/shows");
				break;

			case "person":
				routesToPurge.push("/pool");
				if (body.slug?.current) {
					routesToPurge.push(`/pool/${body.slug.current}`);
				}
				routesToPurge.push("/shows");
				break;

			case "venue":
				routesToPurge.push("/pool");
				if (body.slug?.current) {
					routesToPurge.push(`/pool/${body.slug.current}`);
				}
				break;

			case "article":
				routesToPurge.push("/words");
				if (body.slug?.current) {
					routesToPurge.push(`/words/${body.slug.current}`);
				}
				break;

			case "home":
				routesToPurge.push("/");
				break;

			case "page":
				if (body.slug?.current) {
					routesToPurge.push(`/${body.slug.current}`);
				}
				break;

			case "pool":
			case "showsArchive":
			case "words":
			case "timetable":
				routesToPurge.push("/pool", "/shows", "/words", "/schedule");
				break;

			default:
		}

		const uniqueRoutes = [...new Set(routesToPurge)];
		const tags = TAGS_BY_TYPE[body._type] ?? [];

		// Cached Sanity detail response keys — must match the deterministic key
		// in /api/sanity/detail/[type].get.ts (sanityDetailCacheKey). The `v2`
		// segment is the CACHE_VERSION there; keep both in sync on bumps.
		const detailKeys: string[] = [];
		const detailPrefix = DETAIL_KEY_PREFIX_BY_TYPE[body._type];
		if (detailPrefix && body.slug?.current) {
			detailKeys.push(`sanity-detail:v2:${detailPrefix}:${body.slug.current}`);
		}

		// Purge both cache layers. Nitro's in-process render cache lives in the
		// `cache` mount (LRU, per-instance), the Sanity-detail cache in `sanity`
		// (Netlify Blobs in prod, LRU/FS in dev). The authoritative invalidation
		// is the Netlify edge tag purge below; these are best-effort.
		try {
			const routeCache = useStorage("cache");
			for (const route of uniqueRoutes) {
				await routeCache.removeItem(`nitro:routes:${route}.html`);
				await routeCache.removeItem(`nitro:routes:${route}`);
			}
			const detailCache = useStorage("sanity");
			for (const detailKey of detailKeys) {
				await detailCache.removeItem(detailKey);
			}
		} catch (error) {
			console.error("❌ Error purging cache:", error);
		}

		// Netlify edge purge by tag — invalidates ISR cache so all users get
		// fresh content on next request.
		let edgePurge: RevalidateResponse["edgePurge"] = "skipped";
		const purgeToken = config.netlifyPurgeToken;
		const siteId = config.netlifySiteId;

		if (purgeToken && siteId && tags.length > 0) {
			try {
				await $fetch("https://api.netlify.com/api/v1/purge", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${purgeToken}`,
						"Content-Type": "application/json",
					},
					body: { site_id: siteId, cache_tags: tags },
				});
				edgePurge = "ok";
			} catch (error) {
				console.error("❌ Netlify edge purge failed:", error);
				edgePurge = "failed";
			}
		}

		return {
			success: true,
			purged: uniqueRoutes,
			detailKeys,
			tags,
			edgePurge,
			timestamp: new Date().toISOString(),
			message: `Invalidated ${uniqueRoutes.length} route(s), ${detailKeys.length} detail key(s), ${tags.length} tag(s)`,
		};
	},
);
