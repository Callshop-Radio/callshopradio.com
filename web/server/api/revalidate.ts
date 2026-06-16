import { createHmac } from "crypto";

interface SanityWebhookPayload {
	_type: string;
	_id: string;
	slug?: { current: string };
	show?: { _ref: string };
}

interface RevalidateResponse {
	success: boolean;
	purged: string[];
	timestamp: string;
	message?: string;
}

export default defineEventHandler(
	async (event): Promise<RevalidateResponse> => {
		const body = await readBody<SanityWebhookPayload>(event);
		const signature = getHeader(event, "sanity-webhook-signature");
		const config = useRuntimeConfig();

		// Verify webhook signature if secret is configured
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

		// Log incoming webhook for debugging

		const routesToPurge: string[] = [];

		// Determine routes to invalidate based on content type
		switch (body._type) {
			case "show":
				routesToPurge.push("/shows");
				if (body.slug?.current) {
					routesToPurge.push(`/shows/${body.slug.current}`);
				}
				// Shows may appear on homepage
				routesToPurge.push("/");
				break;

			case "set":
				// Sets appear on show pages and archive
				routesToPurge.push("/shows");
				// Note: For set changes, we'd need to fetch parent show slug
				// For now, invalidate all shows
				break;

			case "person":
				routesToPurge.push("/pool");
				if (body.slug?.current) {
					routesToPurge.push(`/pool/${body.slug.current}`);
				}
				// Persons may appear in shows
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
				// These are singleton documents for archive pages
				routesToPurge.push("/pool", "/shows", "/words", "/schedule");
				break;

			default:
		}

		// Remove duplicate routes
		const uniqueRoutes = [...new Set(routesToPurge)];

		// Purge cache for affected routes
		try {
			const storage = useStorage("cache");

			for (const route of uniqueRoutes) {
				// Clear Nitro route cache
				const cacheKey = `nitro:routes:${route}.html`;
				await storage.removeItem(cacheKey);

				// Also try without .html extension
				await storage.removeItem(`nitro:routes:${route}`);
			}
		} catch (error) {
			console.error("❌ Error purging cache:", error);
			// Don't throw - still return success as webhook was processed
		}

		const response: RevalidateResponse = {
			success: true,
			purged: uniqueRoutes,
			timestamp: new Date().toISOString(),
			message: `Invalidated ${uniqueRoutes.length} route(s)`,
		};

		return response;
	},
);
